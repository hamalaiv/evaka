// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.reports

import fi.espoo.evaka.Audit
import fi.espoo.evaka.assistanceneed.decision.AssistanceNeedDecisionStatus
import fi.espoo.evaka.shared.AssistanceNeedDecisionId
import fi.espoo.evaka.shared.DatabaseTable
import fi.espoo.evaka.shared.EvakaUserId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import fi.espoo.evaka.shared.security.actionrule.AccessControlFilter
import fi.espoo.evaka.shared.security.actionrule.forTable
import java.time.LocalDate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class AssistanceNeedDecisionsReport(private val accessControl: AccessControl) {
    @GetMapping("/reports/assistance-need-decisions")
    fun getAssistanceNeedDecisions(
        db: Database,
        user: AuthenticatedUser,
        clock: EvakaClock
    ): List<AssistanceNeedDecisionsReportRow> {
        return db.connect { dbc ->
                dbc.read {
                    it.setStatementTimeout(REPORT_STATEMENT_TIMEOUT)
                    val filter =
                        accessControl.requireAuthorizationFilter(
                            it,
                            user,
                            clock,
                            Action.AssistanceNeedDecision.READ_IN_REPORT
                        )
                    it.getDecisionRows(user.evakaUserId, filter)
                }
            }
            .also { Audit.AssistanceNeedDecisionsReportRead.log(meta = mapOf("count" to it.size)) }
    }

    @GetMapping("/reports/assistance-need-decisions/unread-count")
    fun getAssistanceNeedDecisionUnreadCount(
        db: Database,
        user: AuthenticatedUser.Employee,
        clock: EvakaClock
    ): Int {
        return db.connect { dbc ->
                dbc.read { tx ->
                    if (
                        accessControl.isPermittedForSomeTarget(
                            tx,
                            user,
                            clock,
                            Action.AssistanceNeedDecision.READ_IN_REPORT
                        )
                    ) {
                        tx.getDecisionMakerUnreadCount(user.evakaUserId)
                    } else {
                        0
                    }
                }
            }
            .also { Audit.AssistanceNeedDecisionsReportUnreadCount.log() }
    }
}

private fun Database.Read.getDecisionRows(
    userId: EvakaUserId,
    idFilter: AccessControlFilter<AssistanceNeedDecisionId>
): List<AssistanceNeedDecisionsReportRow> =
    createQuery<DatabaseTable> {
            sql(
                """
SELECT ad.id, sent_for_decision, concat(child.last_name, ' ', child.first_name) child_name,
    care_area.name care_area_name, daycare.name unit_name, decision_made, status,
    (CASE WHEN decision_maker_employee_id = ${bind(userId)} THEN decision_maker_has_opened ELSE NULL END) is_opened
FROM assistance_need_decision ad
JOIN person child ON child.id = ad.child_id
JOIN daycare ON daycare.id = ad.selected_unit
JOIN care_area ON care_area.id = daycare.care_area_id
WHERE sent_for_decision IS NOT NULL
AND (${predicate(idFilter.forTable("ad"))})
        """
                    .trimIndent()
            )
        }
        .mapTo<AssistanceNeedDecisionsReportRow>()
        .toList()

data class AssistanceNeedDecisionsReportRow(
    val id: AssistanceNeedDecisionId,
    val sentForDecision: LocalDate,
    val childName: String,
    val careAreaName: String,
    val unitName: String,
    val decisionMade: LocalDate?,
    val status: AssistanceNeedDecisionStatus,
    val isOpened: Boolean?
)

private fun Database.Read.getDecisionMakerUnreadCount(userId: EvakaUserId): Int {
    // language=sql
    val sql =
        """
        SELECT COUNT(*)
        FROM assistance_need_decision
        WHERE sent_for_decision IS NOT NULL
          AND decision_maker_employee_id = :employeeId
          AND NOT decision_maker_has_opened
        """
            .trimIndent()
    return createQuery(sql).bind("employeeId", userId).mapTo<Int>().first()
}
