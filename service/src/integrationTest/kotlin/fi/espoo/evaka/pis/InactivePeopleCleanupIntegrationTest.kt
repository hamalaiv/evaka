// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.pis

import fi.espoo.evaka.PureJdbiTest
import fi.espoo.evaka.application.ApplicationType
import fi.espoo.evaka.application.syncApplicationOtherGuardians
import fi.espoo.evaka.incomestatement.IncomeStatementType
import fi.espoo.evaka.messaging.MessageType
import fi.espoo.evaka.messaging.getCitizenMessageAccount
import fi.espoo.evaka.messaging.insertMessage
import fi.espoo.evaka.messaging.insertMessageContent
import fi.espoo.evaka.messaging.insertRecipients
import fi.espoo.evaka.messaging.insertThread
import fi.espoo.evaka.messaging.upsertEmployeeMessageAccount
import fi.espoo.evaka.pis.service.blockGuardian
import fi.espoo.evaka.pis.service.deleteGuardianRelationship
import fi.espoo.evaka.pis.service.insertGuardian
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.IncomeStatementId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.dev.DevDaycare
import fi.espoo.evaka.shared.dev.DevEmployee
import fi.espoo.evaka.shared.dev.DevGuardian
import fi.espoo.evaka.shared.dev.DevIncomeStatement
import fi.espoo.evaka.shared.dev.DevPerson
import fi.espoo.evaka.shared.dev.DevPersonType
import fi.espoo.evaka.shared.dev.insert
import fi.espoo.evaka.shared.dev.insertTestApplication
import fi.espoo.evaka.shared.dev.insertTestParentship
import fi.espoo.evaka.shared.dev.insertTestPartnership
import fi.espoo.evaka.shared.dev.insertTestPlacement
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.testAdult_1
import fi.espoo.evaka.testAdult_2
import fi.espoo.evaka.testArea
import fi.espoo.evaka.testChild_1
import fi.espoo.evaka.testChild_2
import fi.espoo.evaka.testDaycare
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class InactivePeopleCleanupIntegrationTest : PureJdbiTest(resetDbBeforeEach = true) {
    private val testDate = LocalDate.of(2020, 3, 1)
    private val testUnit = testDaycare

    @BeforeEach
    fun beforeEach() {
        db.transaction {
            it.insert(testArea)
            it.insert(DevDaycare(id = testUnit.id, name = testUnit.name, areaId = testArea.id))
        }
    }

    @Test
    fun `adult with no family is cleaned up`() {
        db.transaction { tx -> tx.insert(testAdult_1, DevPersonType.RAW_ROW) }

        assertCleanedUpPeople(testDate, setOf(testAdult_1.id))
    }

    @Test
    fun `guardian and their child are cleaned up when neither have archive data`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.RAW_ROW)
            tx.insertGuardian(testAdult_1.id, testChild_1.id)
        }

        assertCleanedUpPeople(testDate, setOf(testAdult_1.id, testChild_1.id))
    }

    @Test
    fun `blocked guardian is not cleaned up without any archived data`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.RAW_ROW)
            tx.blockGuardian(testChild_1.id, testAdult_1.id)
        }

        assertCleanedUpPeople(testDate, setOf(testChild_1.id))
    }

    @Test
    fun `head of family and their child are cleaned up when neither have archive data`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.RAW_ROW)
            tx.insertTestParentship(childId = testChild_1.id, headOfChild = testAdult_1.id)
        }

        assertCleanedUpPeople(testDate, setOf(testAdult_1.id, testChild_1.id))
    }

    @Test
    fun `head of family and their partner are cleaned up when neither have archive data`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testAdult_2, DevPersonType.RAW_ROW)
            tx.insertTestPartnership(adult1 = testAdult_1.id, adult2 = testAdult_2.id)
        }

        assertCleanedUpPeople(testDate, setOf(testAdult_1.id, testAdult_2.id))
    }

    @Test
    fun `adult with no family that has logged in recently is not cleaned up`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.execute {
                sql(
                    "UPDATE person SET last_login = ${bind(testDate.minusMonths(2))} WHERE id = ${bind(testAdult_1.id)}"
                )
            }
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `guardian and their child are not cleaned up when guardian has logged in recently`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.RAW_ROW)
            tx.insertGuardian(testAdult_1.id, testChild_1.id)
            tx.execute {
                sql(
                    "UPDATE person SET last_login = ${bind(testDate.minusDays(14))} WHERE id = ${bind(testAdult_1.id)}"
                )
            }
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `adult who is saved in the application other guardian table is not cleaned up`() {
        lateinit var otherGuardian: PersonId
        db.transaction { tx ->
            val applicationOwner = tx.insert(DevPerson(), DevPersonType.RAW_ROW)
            otherGuardian = tx.insert(DevPerson(), DevPersonType.RAW_ROW)
            val child = tx.insert(DevPerson(), DevPersonType.RAW_ROW)
            tx.insert(DevGuardian(guardianId = applicationOwner, childId = child))
            tx.insert(DevGuardian(guardianId = otherGuardian, childId = child))
            val application =
                tx.insertTestApplication(
                    type = ApplicationType.DAYCARE,
                    guardianId = applicationOwner,
                    childId = child
                )
            tx.syncApplicationOtherGuardians(application, testDate)
            tx.deleteGuardianRelationship(childId = child, guardianId = otherGuardian)
        }
        assertCleanedUpPeople(testDate, setOf())

        db.transaction { tx ->
            tx.createUpdate {
                    sql(
                        "DELETE FROM application_other_guardian WHERE guardian_id = ${bind(otherGuardian)}"
                    )
                }
                .execute()
        }
        assertCleanedUpPeople(testDate, setOf(otherGuardian))
    }

    @Test
    fun `head of family and their child are not cleaned up when child has a placement`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.CHILD)
            tx.insertTestParentship(headOfChild = testAdult_1.id, childId = testChild_1.id)
            tx.insertTestPlacement(childId = testChild_1.id, unitId = testUnit.id)
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `family with two children is not cleaned up when one of the children has a placement`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.CHILD)
            tx.insert(testChild_2, DevPersonType.CHILD)
            tx.insertTestParentship(headOfChild = testAdult_1.id, childId = testChild_1.id)
            tx.insertTestParentship(headOfChild = testAdult_1.id, childId = testChild_2.id)
            tx.insertTestPlacement(childId = testChild_1.id, unitId = testUnit.id)
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `family with two children and two adults is not cleaned up when one of the children has a placement`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testAdult_2, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.CHILD)
            tx.insert(testChild_2, DevPersonType.CHILD)
            tx.insertTestPartnership(adult1 = testAdult_1.id, adult2 = testAdult_2.id)
            tx.insertTestParentship(headOfChild = testAdult_1.id, childId = testChild_1.id)
            tx.insertTestParentship(headOfChild = testAdult_1.id, childId = testChild_2.id)
            tx.insertTestPlacement(childId = testChild_1.id, unitId = testUnit.id)
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `family with two children with separate heads of family is not cleaned up when one of the children has a placement`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(testAdult_2, DevPersonType.RAW_ROW)
            tx.insert(testChild_1, DevPersonType.CHILD)
            tx.insert(testChild_2, DevPersonType.CHILD)
            tx.insertTestPartnership(adult1 = testAdult_1.id, adult2 = testAdult_2.id)
            tx.insertTestParentship(headOfChild = testAdult_1.id, childId = testChild_1.id)
            tx.insertTestParentship(headOfChild = testAdult_2.id, childId = testChild_2.id)
            tx.insertTestPlacement(childId = testChild_1.id, unitId = testUnit.id)
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `adult with income statement is not cleaned up`() {
        db.transaction { tx ->
            tx.insert(testAdult_1, DevPersonType.RAW_ROW)
            tx.insert(
                DevIncomeStatement(
                    IncomeStatementId(UUID.randomUUID()),
                    testAdult_1.id,
                    LocalDate.now(),
                    IncomeStatementType.INCOME,
                    42
                )
            )
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    @Test
    fun `adult with received messages is cleaned up`() {
        val now = HelsinkiDateTime.now()
        db.transaction { tx ->
            val supervisorId = EmployeeId(UUID.randomUUID())
            tx.insert(
                DevEmployee(id = supervisorId, firstName = "Firstname", lastName = "Supervisor")
            )
            val employeeAccount = tx.upsertEmployeeMessageAccount(supervisorId)

            tx.insert(testAdult_1, DevPersonType.ADULT)
            val personAccount = tx.getCitizenMessageAccount(testAdult_1.id)

            val contentId = tx.insertMessageContent("content", employeeAccount)
            val threadId =
                tx.insertThread(
                    MessageType.MESSAGE,
                    "title",
                    urgent = false,
                    sensitive = false,
                    isCopy = false
                )
            val messageId =
                tx.insertMessage(
                    now = now,
                    contentId = contentId,
                    threadId = threadId,
                    sender = employeeAccount,
                    sentAt = now,
                    recipientNames = listOf("recipient name"),
                    municipalAccountName = "Espoo",
                    serviceWorkerAccountName = "Espoon palveluohjaus"
                )
            tx.insertRecipients(listOf(messageId to setOf(personAccount)))
        }

        assertCleanedUpPeople(testDate, setOf(testAdult_1.id))
    }

    @Test
    fun `adult with sent messages is not cleaned up`() {
        val now = HelsinkiDateTime.now()
        db.transaction { tx ->
            val supervisorId = EmployeeId(UUID.randomUUID())
            tx.insert(
                DevEmployee(id = supervisorId, firstName = "Firstname", lastName = "Supervisor")
            )
            val employeeAccount = tx.upsertEmployeeMessageAccount(supervisorId)

            tx.insert(testAdult_1, DevPersonType.ADULT)
            val personAccount = tx.getCitizenMessageAccount(testAdult_1.id)

            val contentId = tx.insertMessageContent("content", personAccount)
            val threadId =
                tx.insertThread(
                    MessageType.MESSAGE,
                    "title",
                    urgent = false,
                    sensitive = false,
                    isCopy = false
                )
            val messageId =
                tx.insertMessage(
                    now = now,
                    contentId = contentId,
                    threadId = threadId,
                    sender = personAccount,
                    sentAt = now,
                    recipientNames = listOf("employee name"),
                    municipalAccountName = "Espoo",
                    serviceWorkerAccountName = "Espoon palveluohjaus"
                )
            tx.insertRecipients(listOf(messageId to setOf(employeeAccount)))
        }

        assertCleanedUpPeople(testDate, setOf())
    }

    private fun assertCleanedUpPeople(queryDate: LocalDate, cleanedUpPeople: Set<PersonId>) {
        val result = db.transaction { cleanUpInactivePeople(it, queryDate) }

        assertEquals(cleanedUpPeople, result)
    }
}
