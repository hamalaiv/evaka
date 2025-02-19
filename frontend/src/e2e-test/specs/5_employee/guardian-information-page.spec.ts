// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import LocalDate from 'lib-common/local-date'

import { insertApplications, insertInvoiceFixtures } from '../../dev-api'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from '../../dev-api/data-init'
import {
  applicationFixture,
  createDaycarePlacementFixture,
  daycareFixture,
  daycareGroupFixture,
  decisionFixture,
  enduserChildFixtureJari,
  enduserChildFixtureKaarina,
  enduserGuardianFixture,
  familyWithTwoGuardians,
  Fixture,
  invoiceFixture,
  uuidv4
} from '../../dev-api/fixtures'
import {
  createDaycareGroups,
  createDaycarePlacements,
  createDecisions,
  deleteDaycareCostCenter,
  resetServiceState
} from '../../generated/api-clients'
import GuardianInformationPage from '../../pages/employee/guardian-information'
import { Page } from '../../utils/page'
import { employeeLogin } from '../../utils/user'

let fixtures: AreaAndPersonFixtures
let page: Page

beforeEach(async () => {
  await resetServiceState()
  fixtures = await initializeAreaAndPersonData()
  await createDaycareGroups({ body: [daycareGroupFixture] })

  const admin = await Fixture.employeeAdmin().save()

  const daycarePlacementFixture = createDaycarePlacementFixture(
    uuidv4(),
    fixtures.enduserChildFixtureJari.id,
    daycareFixture.id
  )
  const application = applicationFixture(
    enduserChildFixtureJari,
    enduserGuardianFixture
  )

  const application2 = {
    ...applicationFixture(
      enduserChildFixtureKaarina,
      familyWithTwoGuardians.guardian,
      enduserGuardianFixture
    ),
    id: uuidv4()
  }

  const startDate = LocalDate.of(2021, 8, 16)
  await createDaycarePlacements({ body: [daycarePlacementFixture] })
  await insertApplications([application, application2])
  await createDecisions({
    body: [
      {
        ...decisionFixture(application.id, startDate, startDate),
        employeeId: admin.data.id
      },
      {
        ...decisionFixture(application2.id, startDate, startDate),
        employeeId: admin.data.id,
        id: uuidv4()
      }
    ]
  })

  page = await Page.open()
  await employeeLogin(page, admin.data)
})

describe('Employee - Guardian Information', () => {
  test('guardian information is shown', async () => {
    const guardianPage = new GuardianInformationPage(page)
    await guardianPage.navigateToGuardian(fixtures.enduserGuardianFixture.id)

    const personInfoSection = guardianPage.getCollapsible('personInfo')
    await personInfoSection.assertPersonInfo(
      enduserGuardianFixture.lastName,
      enduserGuardianFixture.firstName,
      enduserGuardianFixture.ssn ?? ''
    )

    const expectedChildName = `${enduserChildFixtureJari.lastName} ${enduserChildFixtureJari.firstName}`
    const dependantsSection = await guardianPage.openCollapsible('dependants')
    await dependantsSection.assertContainsDependantChild(
      enduserChildFixtureJari.id
    )

    const applicationsSection =
      await guardianPage.openCollapsible('applications')
    await applicationsSection.assertApplicationCount(1)
    await applicationsSection.assertApplicationSummary(
      0,
      expectedChildName,
      daycareFixture.name
    )

    const decisionsSection = await guardianPage.openCollapsible('decisions')
    await decisionsSection.assertDecisionCount(2)
    await decisionsSection.assertDecision(
      0,
      expectedChildName,
      daycareFixture.name,
      'Odottaa vastausta'
    )

    await decisionsSection.assertDecision(
      1,
      `${enduserChildFixtureKaarina.lastName} ${enduserChildFixtureKaarina.firstName}`,
      daycareFixture.name,
      'Odottaa vastausta'
    )
  })

  test('Invoices are listed on the admin UI guardian page', async () => {
    await insertInvoiceFixtures([
      invoiceFixture(
        fixtures.enduserGuardianFixture.id,
        fixtures.enduserChildFixtureJari.id,
        fixtures.careAreaFixture.id,
        fixtures.daycareFixture.id,
        'DRAFT',
        LocalDate.of(2020, 1, 1),
        LocalDate.of(2020, 1, 31)
      )
    ])

    const guardianPage = new GuardianInformationPage(page)
    await guardianPage.navigateToGuardian(fixtures.enduserGuardianFixture.id)

    const invoiceSection = await guardianPage.openCollapsible('invoices')
    await invoiceSection.assertInvoiceCount(1)
    await invoiceSection.assertInvoice(0, '01.01.2020', '31.01.2020', 'Luonnos')
  })

  test('Invoice correction can be created and deleted', async () => {
    await Fixture.fridgeChild()
      .with({
        headOfChild: fixtures.enduserGuardianFixture.id,
        childId: fixtures.enduserChildFixtureJari.id,
        startDate: LocalDate.of(2020, 1, 1),
        endDate: LocalDate.of(2020, 12, 31)
      })
      .save()
    const guardianPage = new GuardianInformationPage(page)
    await guardianPage.navigateToGuardian(fixtures.enduserGuardianFixture.id)

    const invoiceCorrectionsSection =
      await guardianPage.openCollapsible('invoiceCorrections')
    const newRow = await invoiceCorrectionsSection.addNewInvoiceCorrection()
    await newRow.productSelect.selectOption('DAYCARE_DISCOUNT')
    await newRow.description.fill('Virheen korjaus')
    await newRow.unitSelect.fillAndSelectFirst(daycareFixture.name)
    await newRow.startDate.fill('01.01.2020')
    await newRow.endDate.fill('05.01.2020')
    await newRow.amount.fill('5')
    await newRow.price.fill('12')
    await newRow.totalPrice.assertTextEquals('60 €')
    const noteModal = await newRow.addNote()
    await noteModal.note.fill('Testimuistiinpano')
    await noteModal.submit()
    await invoiceCorrectionsSection.saveButton.click()

    await invoiceCorrectionsSection.invoiceCorrectionRows.assertCount(1)
    const row = invoiceCorrectionsSection.lastRow()
    await row.productSelect.assertTextEquals('Alennus (maksup.)')
    await row.description.assertTextEquals('Virheen korjaus')
    await row.unitSelect.assertTextEquals(daycareFixture.name)
    await row.period.assertTextEquals('01.01.2020 - 05.01.2020')
    await row.amount.assertTextEquals('5')
    await row.unitPrice.assertTextEquals('12 €')
    await row.totalPrice.assertTextEquals('60 €')
    await row.status.assertTextEquals('Ei vielä laskulla')
    await row.noteIcon.hover()
    await row.noteTooltip.assertTextEquals('Testimuistiinpano')

    await row.deleteButton.click()
    await invoiceCorrectionsSection.invoiceCorrectionRows.assertCount(0)
  })

  test('Invoice corrections show only units with cost center', async () => {
    await Fixture.fridgeChild()
      .with({
        headOfChild: fixtures.enduserGuardianFixture.id,
        childId: fixtures.enduserChildFixtureJari.id,
        startDate: LocalDate.of(2020, 1, 1),
        endDate: LocalDate.of(2020, 12, 31)
      })
      .save()

    const guardianPage = new GuardianInformationPage(page)
    await guardianPage.navigateToGuardian(fixtures.enduserGuardianFixture.id)

    const invoiceCorrectionsSection =
      await guardianPage.openCollapsible('invoiceCorrections')
    await invoiceCorrectionsSection.invoiceCorrectionRows.assertCount(0)
    let row = await invoiceCorrectionsSection.addNewInvoiceCorrection()
    await row.clickAndAssertUnitVisibility(daycareFixture.name, true)

    await deleteDaycareCostCenter({ daycareId: daycareFixture.id })
    await guardianPage.navigateToGuardian(fixtures.enduserGuardianFixture.id)
    await guardianPage.openCollapsible('invoiceCorrections')
    await invoiceCorrectionsSection.invoiceCorrectionRows.assertCount(0)
    row = await invoiceCorrectionsSection.addNewInvoiceCorrection()
    await row.clickAndAssertUnitVisibility(daycareFixture.name, false)
  })
})
