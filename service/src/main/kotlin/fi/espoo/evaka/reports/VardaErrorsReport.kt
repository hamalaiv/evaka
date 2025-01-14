// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.reports

import fi.espoo.evaka.Audit
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.ServiceNeedId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class VardaErrorReport(private val accessControl: AccessControl) {
    @GetMapping("/reports/varda-errors")
    fun getVardaErrorsReport(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock
    ): List<VardaErrorReportRow> {
        return db.connect { dbc ->
                dbc.read {
                    accessControl.requirePermissionFor(
                        it,
                        user,
                        clock,
                        Action.Global.READ_VARDA_REPORT
                    )
                    it.setStatementTimeout(REPORT_STATEMENT_TIMEOUT)
                    it.getVardaErrors()
                }
            }
            .also { Audit.VardaReportRead.log(meta = mapOf("count" to it.size)) }
    }
}

private fun Database.Read.getVardaErrors(): List<VardaErrorReportRow> =
    createQuery {
            sql(
                """
SELECT
    vsn.evaka_service_need_id AS service_need_id,
    daterange(sn.start_date, sn.end_date, '[]') as service_need_validity,
    sno.name_fi as service_need_option_name,
    vsn.evaka_child_id AS child_id,
    vsn.updated,
    CASE WHEN vrc.reset_timestamp IS NULL THEN vrc.updated ELSE vsn.created END AS created,
    vsn.errors,
    vrc.reset_timestamp
FROM varda_service_need vsn
JOIN service_need sn on vsn.evaka_service_need_id = sn.id
JOIN service_need_option sno ON sn.option_id = sno.id
LEFT JOIN varda_reset_child vrc ON vrc.evaka_child_id = vsn.evaka_child_id
WHERE
    vsn.update_failed AND
    vrc.reset_timestamp IS NOT NULL AND
    NOT EXISTS (SELECT FROM varda_state vs WHERE vs.child_id = vsn.evaka_child_id)

UNION ALL

SELECT
    NULL AS service_need_id,
    NULL AS service_need_validity,
    NULL AS service_need_option_name,
    child_id,
    errored_at AS updated,
    coalesce(last_success_at, created_at) AS created,
    ARRAY[error] AS errors,
    NULL AS reset_timestamp
FROM varda_state
WHERE errored_at IS NOT NULL

ORDER BY updated DESC
    """
            )
        }
        .toList<VardaErrorReportRow>()

data class VardaErrorReportRow(
    val serviceNeedId: ServiceNeedId?,
    val serviceNeedValidity: FiniteDateRange?,
    val serviceNeedOptionName: String?,
    val childId: ChildId,
    val updated: HelsinkiDateTime,
    val created: HelsinkiDateTime,
    val errors: List<String>,
    val resetTimeStamp: HelsinkiDateTime?
)
