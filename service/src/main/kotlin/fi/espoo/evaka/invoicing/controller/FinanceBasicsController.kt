// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.controller

import fi.espoo.evaka.Audit
import fi.espoo.evaka.invoicing.domain.FeeThresholds
import fi.espoo.evaka.invoicing.domain.roundToEuros
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.BadRequest
import fi.espoo.evaka.shared.domain.DateRange
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.Nested
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.util.UUID

@RestController
@RequestMapping("/finance-basics")
class FinanceBasicsController {
    @GetMapping("/fee-thresholds")
    fun getFeeThresholds(db: Database.Connection, user: AuthenticatedUser): List<FeeThresholdsWithId> {
        Audit.FinanceBasicsFeeThresholdsRead.log()
        user.requireOneOfRoles(UserRole.FINANCE_ADMIN)

        return db.read { it.getFeeThresholds().sortedByDescending { it.thresholds.validDuring.start } }
    }

    @PostMapping("/fee-thresholds")
    fun createFeeThresholds(
        db: Database.Connection,
        user: AuthenticatedUser,
        @RequestBody body: FeeThresholds
    ) {
        Audit.FinanceBasicsFeeThresholdsCreate.log()
        user.requireOneOfRoles(UserRole.FINANCE_ADMIN)

        validateFeeThresholds(body)
        db.transaction { tx ->
            val latest = tx.getFeeThresholds().maxByOrNull { it.thresholds.validDuring.start }

            if (latest != null) {
                if (latest.thresholds.validDuring.end != null && latest.thresholds.validDuring.overlaps(body.validDuring))
                    throw BadRequest("New fee thresholds over lap with existing fee thresholds")

                if (latest.thresholds.validDuring.end == null)
                    tx.updateFeeThresholdsValidity(
                        latest.id,
                        latest.thresholds.validDuring.copy(end = body.validDuring.start.minusDays(1))
                    )
            }

            tx.insertNewFeeThresholds(body)
        }
    }
}

data class FeeThresholdsWithId(
    val id: UUID,
    @Nested
    val thresholds: FeeThresholds
)

private fun validateFeeThresholds(thresholds: FeeThresholds) {
    val allMaxFeesMatch = listOf(
        calculateMaxFeeFromThresholds(
            thresholds.minIncomeThreshold2,
            thresholds.maxIncomeThreshold2,
            thresholds.incomeMultiplier2
        ),
        calculateMaxFeeFromThresholds(
            thresholds.minIncomeThreshold3,
            thresholds.maxIncomeThreshold3,
            thresholds.incomeMultiplier3
        ),
        calculateMaxFeeFromThresholds(
            thresholds.minIncomeThreshold4,
            thresholds.maxIncomeThreshold4,
            thresholds.incomeMultiplier4
        ),
        calculateMaxFeeFromThresholds(
            thresholds.minIncomeThreshold5,
            thresholds.maxIncomeThreshold5,
            thresholds.incomeMultiplier5
        ),
        calculateMaxFeeFromThresholds(
            thresholds.minIncomeThreshold6,
            thresholds.maxIncomeThreshold6,
            thresholds.incomeMultiplier6
        )
    ).all { it == thresholds.maxFee }

    if (!allMaxFeesMatch) throw BadRequest("Inconsistent max fees from income thresholds")
}

private fun calculateMaxFeeFromThresholds(minThreshold: Int, maxThreshold: Int, multiplier: BigDecimal): Int {
    return roundToEuros(BigDecimal(maxThreshold - minThreshold) * multiplier).toInt()
}

fun Database.Read.getFeeThresholds(): List<FeeThresholdsWithId> =
    createQuery("SELECT * FROM fee_thresholds")
        .mapTo<FeeThresholdsWithId>()
        .toList()

fun Database.Transaction.insertNewFeeThresholds(thresholds: FeeThresholds) =
    createUpdate(
        """
INSERT INTO fee_thresholds (
    id,
    valid_during,
    min_income_threshold_2,
    min_income_threshold_3,
    min_income_threshold_4,
    min_income_threshold_5,
    min_income_threshold_6,
    income_multiplier_2,
    income_multiplier_3,
    income_multiplier_4,
    income_multiplier_5,
    income_multiplier_6,
    max_income_threshold_2,
    max_income_threshold_3,
    max_income_threshold_4,
    max_income_threshold_5,
    max_income_threshold_6,
    income_threshold_increase_6_plus,
    sibling_discount_2,
    sibling_discount_2_plus,
    max_fee,
    min_fee
) VALUES (
    :id,
    :validDuring,
    :minIncomeThreshold2,
    :minIncomeThreshold3,
    :minIncomeThreshold4,
    :minIncomeThreshold5,
    :minIncomeThreshold6,
    :incomeMultiplier2,
    :incomeMultiplier3,
    :incomeMultiplier4,
    :incomeMultiplier5,
    :incomeMultiplier6,
    :maxIncomeThreshold2,
    :maxIncomeThreshold3,
    :maxIncomeThreshold4,
    :maxIncomeThreshold5,
    :maxIncomeThreshold6,
    :incomeThresholdIncrease6Plus,
    :siblingDiscount2,
    :siblingDiscount2Plus,
    :maxFee,
    :minFee
)
"""
    )
        .bindKotlin(thresholds)
        .bind("id", UUID.randomUUID())
        .execute()

fun Database.Transaction.updateFeeThresholdsValidity(id: UUID, newValidity: DateRange) =
    createUpdate("UPDATE fee_thresholds SET valid_during = :validDuring WHERE id = :id")
        .bind("id", id)
        .bind("validDuring", newValidity)
        .execute()
