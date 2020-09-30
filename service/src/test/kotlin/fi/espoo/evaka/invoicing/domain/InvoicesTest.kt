// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.util.UUID

class InvoicesTest {
    @Test
    fun `Invoice has correct default due date calculated from period end date`() {
        val invoice = Invoice(
            id = UUID.randomUUID(),
            status = InvoiceStatus.DRAFT,
            periodStart = LocalDate.of(2019, 1, 1),
            periodEnd = LocalDate.of(2019, 1, 31),
            agreementType = 100,
            headOfFamily = PersonData.JustId(UUID.randomUUID()),
            rows = listOf()
        )

        assertEquals(LocalDate.of(2019, 2, 28), invoice.dueDate)
    }

    @Test
    fun `Invoice has correct default due date when last day of month is saturday`() {
        val invoice = Invoice(
            id = UUID.randomUUID(),
            status = InvoiceStatus.DRAFT,
            periodStart = LocalDate.of(2019, 7, 1),
            periodEnd = LocalDate.of(2019, 7, 31),
            agreementType = 100,
            headOfFamily = PersonData.JustId(UUID.randomUUID()),
            rows = listOf()
        )

        assertEquals(LocalDate.of(2019, 8, 30), invoice.dueDate)
    }

    @Test
    fun `Invoice has correct default due date when last day of month is sunday`() {
        val invoice = Invoice(
            id = UUID.randomUUID(),
            status = InvoiceStatus.DRAFT,
            periodStart = LocalDate.of(2019, 5, 1),
            periodEnd = LocalDate.of(2019, 5, 31),
            agreementType = 100,
            headOfFamily = PersonData.JustId(UUID.randomUUID()),
            rows = listOf()
        )

        assertEquals(LocalDate.of(2019, 6, 28), invoice.dueDate)
    }

    @Test
    fun `Invoice has correct default invoice date`() {
        val invoice = Invoice(
            id = UUID.randomUUID(),
            status = InvoiceStatus.DRAFT,
            periodStart = LocalDate.of(2019, 1, 1),
            periodEnd = LocalDate.of(2019, 1, 31),
            agreementType = 100,
            headOfFamily = PersonData.JustId(UUID.randomUUID()),
            rows = listOf()
        )

        assertEquals(invoice.dueDate.minusDays(14), invoice.invoiceDate)
        assertEquals(LocalDate.of(2019, 2, 14), invoice.invoiceDate)
    }

    @Test
    fun `getDueDate with last day of December as period end`() {
        val result = getDueDate(LocalDate.of(2019, 12, 31))

        assertEquals(LocalDate.of(2020, 1, 31), result)
    }

    @Test
    fun `getDueDate with first day of January as period end`() {
        val result = getDueDate(LocalDate.of(2020, 1, 1))

        assertEquals(LocalDate.of(2020, 2, 28), result)
    }
}
