// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  displayName: 'citizen-frontend',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner'
}
export default config
