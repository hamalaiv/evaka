// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Page } from 'playwright'
import config from 'e2e-test-common/config'
import { getApplication, resetDatabase } from 'e2e-test-common/dev-api'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import { enduserLogin } from 'e2e-playwright/utils/user'
import {
  fullPreschoolForm,
  minimalPreschoolForm
} from 'e2e-playwright/utils/application-forms'
import { newBrowserContext } from '../../browser'
import CitizenHeader from '../../pages/citizen/citizen-header'
import CitizenApplicationsPage from '../../pages/citizen/citizen-applications'

let page: Page
let header: CitizenHeader
let applicationsPage: CitizenApplicationsPage
let fixtures: AreaAndPersonFixtures

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()

  page = await (await newBrowserContext()).newPage()
  await page.goto(config.enduserUrl)
  header = new CitizenHeader(page)
  applicationsPage = new CitizenApplicationsPage(page)
})
afterEach(async () => {
  await page.close()
})

describe('Citizen preschool applications', () => {
  test('Sending incomplete preschool application gives validation error', async () => {
    await enduserLogin(page)
    await header.applicationsTab.click()
    const editorPage = await applicationsPage.createApplication(
      fixtures.enduserChildFixtureJari.id,
      'PRESCHOOL'
    )
    await editorPage.goToVerification()
    await editorPage.assertErrorsExist()
  })

  test('Minimal valid preschool application can be sent', async () => {
    await enduserLogin(page)
    await header.applicationsTab.click()
    const editorPage = await applicationsPage.createApplication(
      fixtures.enduserChildFixtureJari.id,
      'PRESCHOOL'
    )
    const applicationId = editorPage.getNewApplicationId()

    await editorPage.fillData(minimalPreschoolForm.form)
    await editorPage.verifyAndSend()

    const application = await getApplication(applicationId)
    minimalPreschoolForm.validateResult(application)
  })

  test('Full valid preschool application can be sent', async () => {
    await enduserLogin(page)
    await header.applicationsTab.click()
    const editorPage = await applicationsPage.createApplication(
      fixtures.enduserChildFixtureJari.id,
      'PRESCHOOL'
    )
    const applicationId = editorPage.getNewApplicationId()

    await editorPage.fillData(fullPreschoolForm.form)
    await editorPage.verifyAndSend()

    const application = await getApplication(applicationId)
    fullPreschoolForm.validateResult(application)
  })
})
