// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import 'testcafe'
import InvoicingPage from '../../pages/invoicing'
import {
  initializeAreaAndPersonData,
  AreaAndPersonFixtures
} from '../../dev-api/data-init'
import { feeDecisionsFixture } from '../../dev-api/fixtures'
import {
  cleanUpInvoicingDatabase,
  insertFeeDecisionFixtures,
  runPendingAsyncJobs
} from '../../dev-api'
import { logConsoleMessages } from '../../utils/fixture'
import { seppoAdminRole } from '../../config/users'

const page = new InvoicingPage()

let fixtures: AreaAndPersonFixtures
let cleanUp: () => Promise<void>

fixture('Invoicing - fee decisions')
  .meta({ type: 'regression', subType: 'feeDecisions' })
  .page(page.url)
  .before(async () => {
    ;[fixtures, cleanUp] = await initializeAreaAndPersonData()
  })
  .beforeEach(async (t) => {
    await cleanUpInvoicingDatabase()
    await insertFeeDecisionFixtures([
      feeDecisionsFixture(
        'DRAFT',
        fixtures.enduserGuardianFixture.id,
        fixtures.enduserChildFixtureKaarina.id,
        fixtures.daycareFixture.id
      )
    ])

    await t.useRole(seppoAdminRole)
    await page.navigateToDecisions(t)
  })
  .afterEach(logConsoleMessages)
  .after(async () => {
    await cleanUpInvoicingDatabase()
    await cleanUp()
  })

test('List of fee decision drafts shows at least one row', async (t) => {
  await t.expect(page.decisionTable.visible).ok()
  await t.expect(page.decisionRows.count).gt(0)
})

test('Navigate to and from decision details page', async (t) => {
  await page.openFirstDecision(t)
  await t.expect(page.decisionDetailsPage.exists).ok()

  await t.expect(page.navigateBack.exists).ok()
  await t.click(page.navigateBack)
  await t.expect(page.decisionsPage.exists).ok()
})

test('Fee decisions are toggled and confirmed', async (t) => {
  await t.expect(page.toggleAllDecisions.exists).ok()
  await t.expect(page.toggleFirstDecision.exists).ok()
  await t.expect(page.toggleAllDecisions.checked).eql(false)
  await t.expect(page.toggleFirstDecision.checked).eql(false)

  await page.toggleAllDecisions.click()
  await t.expect(page.toggleAllDecisions.checked).eql(true)
  await t.expect(page.toggleFirstDecision.checked).eql(true)

  await page.toggleAllDecisions.click()
  await t.expect(page.toggleAllDecisions.checked).eql(false)
  await t.expect(page.toggleFirstDecision.checked).eql(false)

  await page.toggleFirstDecision.click()
  await t.expect(page.toggleFirstDecision.checked).eql(true)

  await page.toggleFirstDecision.click()
  await t.expect(page.toggleFirstDecision.checked).eql(false)

  await page.toggleFirstDecision.click()
  await t.click(page.confirmDecisions)
  await runPendingAsyncJobs()

  await page.decisionsStatusFilterDraft.click()
  await page.decisionsStatusFilterSent.click()
  await t.expect(page.decisionRows.count).eql(1)
})
