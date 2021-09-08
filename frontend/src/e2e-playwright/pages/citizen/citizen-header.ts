// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { RawElement } from 'e2e-playwright/utils/element'
import { Page } from 'playwright'

export default class CitizenHeader {
  constructor(private readonly page: Page) {}

  #languageMenuToggle = new RawElement(
    this.page,
    '[data-qa="button-select-language"]'
  )
  #languageOptionList = new RawElement(this.page, '[data-qa="select-lang"]')
  applicationsTab = new RawElement(this.page, '[data-qa="nav-applications"]')
  decisionsTab = new RawElement(this.page, '[data-qa="nav-decisions"]')
  incomeTab = this.page.locator('[data-qa="nav-income"]')

  async selectLanguage(lang: 'fi' | 'sv' | 'en') {
    await this.#languageMenuToggle.click()
    await this.#languageOptionList.find(`[data-qa="lang-${lang}"]`).click()
  }
}
