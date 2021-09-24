// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.reservations

import fi.espoo.evaka.Audit
import fi.espoo.evaka.daycare.service.AbsenceType
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.isWeekend
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.utils.dateNow
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.json.Json
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.DayOfWeek
import java.time.LocalDate
import java.util.UUID

@RestController
class ReservationControllerCitizen(
    private val accessControl: AccessControl
) {
    @GetMapping("/citizen/reservations")
    fun getReservations(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
    ): ReservationsResponse {
        Audit.AttendanceReservationCitizenRead.log(targetId = user.id)
        user.requireOneOfRoles(UserRole.CITIZEN_WEAK, UserRole.END_USER)

        val range = try {
            FiniteDateRange(from, to)
        } catch (e: IllegalArgumentException) {
            throw BadRequest("Invalid date range $from - $to")
        }

        return db.read {
            ReservationsResponse(
                dailyData = it.getReservationsCitizen(user.id, range),
                children = it.getReservationChildren(user.id, range),
                reservableDays = getReservableDays(HelsinkiDateTime.now().toLocalDate())
            )
        }
    }

    @PostMapping("/citizen/reservations")
    fun postReservations(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestBody body: List<DailyReservationRequest>
    ) {
        Audit.AttendanceReservationCitizenCreate.log(targetId = body.map { it.childId }.toSet().joinToString())
        user.requireOneOfRoles(UserRole.CITIZEN_WEAK, UserRole.END_USER)
        accessControl.requireGuardian(user, body.map { it.childId }.toSet())

        val reservableDays = getReservableDays(dateNow())
        if (body.any { !reservableDays.includes(it.date) }) {
            throw BadRequest("Some days are not reservable")
        }

        db.transaction { createReservationsAsCitizen(it, user.id, body) }
    }

    @PostMapping("/citizen/absences")
    fun postAbsences(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestBody body: AbsenceRequest
    ) {
        Audit.AbsenceCitizenCreate.log(targetId = body.childIds.toSet().joinToString())
        user.requireOneOfRoles(UserRole.CITIZEN_WEAK, UserRole.END_USER)
        accessControl.requireGuardian(user, body.childIds)

        if (body.dateRange.start.isBefore(dateNow()))
            throw BadRequest("Cannot mark absences for past days")

        db.transaction { tx ->
            tx.clearOldAbsences(
                body.childIds.flatMap { childId ->
                    body.dateRange.dates().map { childId to it }
                }
            )
            tx.insertAbsences(user.id, body)
        }
    }
}

data class ReservationsResponse(
    val dailyData: List<DailyReservationData>,
    val children: List<ReservationChild>,
    val reservableDays: FiniteDateRange
)

data class DailyReservationData(
    val date: LocalDate,
    val isHoliday: Boolean,
    @Json
    val children: List<ChildDailyData>
)

@Json
data class ChildDailyData(
    val childId: UUID,
    val absence: AbsenceType?,
    val reservation: Reservation?
)

@Json
data class Reservation(
    val startTime: String,
    val endTime: String
)

data class ReservationChild(
    val id: UUID,
    val firstName: String,
    val preferredName: String?
)

data class AbsenceRequest(
    val childIds: Set<UUID>,
    val dateRange: FiniteDateRange,
    val absenceType: AbsenceType
)

fun Database.Read.getReservationsCitizen(guardianId: UUID, range: FiniteDateRange): List<DailyReservationData> {
    if (range.durationInDays() > 450) throw BadRequest("Range too long")

    return createQuery(
        """
SELECT
    t::date AS date,
    EXISTS(SELECT 1 FROM holiday h WHERE h.date = t::date) AS is_holiday,
    coalesce(
        jsonb_agg(
            jsonb_build_object(
                'childId', g.child_id,
                'absence', a.absence_type
            ) || (CASE
                WHEN ar.start_time IS NULL THEN '{}'::jsonb
                ELSE jsonb_build_object(
                    'reservation',
                    jsonb_build_object(
                        'startTime', to_char((ar.start_time AT TIME ZONE 'Europe/Helsinki')::time, 'HH24:MI'),
                        'endTime', to_char((ar.end_time AT TIME ZONE 'Europe/Helsinki')::time, 'HH24:MI')
                    )
                )
            END)
        ) FILTER (WHERE a.absence_type IS NOT NULL OR ar.id IS NOT NULL),
        '[]'
    ) AS children
FROM generate_series(:start, :end, '1 day') t
JOIN guardian g ON g.guardian_id = :guardianId
JOIN placement p ON g.child_id = p.child_id
JOIN daycare d ON p.unit_id = d.id AND 'RESERVATIONS' = ANY(d.enabled_pilot_features)
LEFT JOIN attendance_reservation ar ON ar.child_id = g.child_id AND ar.start_date = t::date
LEFT JOIN LATERAL (
    SELECT a.absence_type FROM absence a WHERE a.child_id = g.child_id AND a.date = t::date LIMIT 1
) a ON true
GROUP BY date, is_holiday
        """.trimIndent()
    )
        .bind("guardianId", guardianId)
        .bind("start", range.start)
        .bind("end", range.end)
        .mapTo<DailyReservationData>()
        .toList()
        .filter { !it.date.isWeekend() }
}

private fun Database.Read.getReservationChildren(guardianId: UUID, range: FiniteDateRange): List<ReservationChild> {
    return createQuery(
        """
SELECT ch.id, ch.first_name, child.preferred_name
FROM person ch
JOIN guardian g ON ch.id = g.child_id AND g.guardian_id = :guardianId
LEFT JOIN child ON ch.id = child.id
WHERE EXISTS(
    SELECT 1
    FROM placement pl
    JOIN daycare u ON u.id = pl.unit_id
    WHERE pl.child_id = ch.id AND daterange(pl.start_date, pl.end_date, '[]') && :range AND 'RESERVATIONS' = ANY(u.enabled_pilot_features)
)
ORDER BY first_name
        """.trimIndent()
    )
        .bind("guardianId", guardianId)
        .bind("range", range)
        .mapTo<ReservationChild>()
        .list()
}

fun getReservableDays(today: LocalDate): FiniteDateRange {
    // Start of the next week if it's currently Monday, otherwise start of the week after next
    val start = if (today.dayOfWeek == DayOfWeek.MONDAY) {
        today.plusWeeks(1)
    } else {
        today.plusWeeks(2).minusDays(today.dayOfWeek.value - 1L)
    }

    val end = if (start.withMonth(7).withDayOfMonth(1) <= start) {
        start.plusYears(1).withMonth(7).withDayOfMonth(31)
    } else {
        start.withMonth(7).withDayOfMonth(31)
    }

    return FiniteDateRange(start, end)
}

fun createReservationsAsCitizen(tx: Database.Transaction, userId: UUID, reservations: List<DailyReservationRequest>) {
    tx.clearOldAbsences(reservations.filter { it.reservation != null }.map { it.childId to it.date })
    tx.clearOldReservations(reservations.map { it.childId to it.date })
    tx.insertValidReservations(userId, reservations)
}

private fun Database.Transaction.insertValidReservations(userId: UUID, reservations: List<DailyReservationRequest>) {
    val batch = prepareBatch(
        """
        INSERT INTO attendance_reservation (child_id, start_time, end_time, created_by_guardian_id, created_by_employee_id)
        SELECT :childId, :start, :end, :userId, NULL
        FROM placement pl 
        JOIN daycare d ON d.id = pl.unit_id AND 'RESERVATIONS' = ANY(d.enabled_pilot_features)
        JOIN guardian g ON g.child_id = pl.child_id AND g.guardian_id = :userId
        WHERE 
            pl.child_id = :childId AND 
            daterange(pl.start_date, pl.end_date, '[]') @> :date AND 
            extract(DOW FROM :date) = ANY(d.operation_days) AND 
            NOT EXISTS(SELECT 1 FROM holiday h WHERE h.date = :date) AND
            NOT EXISTS(SELECT 1 FROM absence ab WHERE ab.child_id = :childId AND ab.date = :date)
        ON CONFLICT DO NOTHING;
        """.trimIndent()
    )

    reservations.forEach { res ->
        if (res.reservation != null) {
            val start = HelsinkiDateTime.of(
                date = res.date,
                time = res.reservation.startTime
            )
            val end = HelsinkiDateTime.of(
                date = if (res.reservation.endTime.isAfter(res.reservation.startTime)) res.date else res.date.plusDays(1),
                time = res.reservation.endTime
            )
            batch
                .bind("userId", userId)
                .bind("childId", res.childId)
                .bind("start", start)
                .bind("end", end)
                .bind("date", res.date)
                .add()
        }
    }

    batch.execute()
}

private fun Database.Transaction.insertAbsences(userId: UUID, request: AbsenceRequest) {
    val batch = prepareBatch(
        """
        INSERT INTO absence (child_id, date, care_type, absence_type, modified_by_guardian_id)
        SELECT
            :childId,
            :date,
            care_type,
            :absenceType,
            :userId
        FROM (
            SELECT unnest((CASE type
                WHEN 'CLUB'::placement_type THEN '{CLUB}'
                WHEN 'SCHOOL_SHIFT_CARE'::placement_type THEN '{SCHOOL_SHIFT_CARE}'
                WHEN 'PRESCHOOL'::placement_type THEN '{PRESCHOOL}'
                WHEN 'PREPARATORY'::placement_type THEN '{PRESCHOOL}'
                WHEN 'PRESCHOOL_DAYCARE'::placement_type THEN '{PRESCHOOL, PRESCHOOL_DAYCARE}'
                WHEN 'PREPARATORY_DAYCARE'::placement_type THEN '{PRESCHOOL, PRESCHOOL_DAYCARE}'
                WHEN 'DAYCARE'::placement_type THEN '{DAYCARE}'
                WHEN 'DAYCARE_PART_TIME'::placement_type THEN '{DAYCARE}'
                WHEN 'DAYCARE_FIVE_YEAR_OLDS'::placement_type THEN '{DAYCARE, DAYCARE_5YO_FREE}'
                WHEN 'DAYCARE_PART_TIME_FIVE_YEAR_OLDS'::placement_type THEN '{DAYCARE, DAYCARE_5YO_FREE}'
                WHEN 'TEMPORARY_DAYCARE'::placement_type THEN '{}'
                WHEN 'TEMPORARY_DAYCARE_PART_DAY'::placement_type THEN '{}'
            END)::text[]) AS care_type
            FROM placement
            WHERE child_id = :childId AND :date BETWEEN start_date AND end_date
        ) care_type
        ON CONFLICT DO NOTHING
        """.trimIndent()
    )

    request.childIds.forEach { childId ->
        request.dateRange.dates().forEach { date ->
            batch
                .bind("childId", childId)
                .bind("date", date)
                .bind("absenceType", request.absenceType)
                .bind("userId", userId)
                .add()
        }
    }

    batch.execute()
}
