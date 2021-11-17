// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import axios, { AxiosError } from 'axios'
import { isAutomatedTest, mockNow } from 'lib-common/utils/helpers'

export const API_URL = '/api/application'

export const client = axios.create({
  baseURL: API_URL
})

if (isAutomatedTest) {
  client.interceptors.request.use((config) => {
    const evakaMockedTime = mockNow()
    if (evakaMockedTime) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config.params = { ...config.params, evakaMockedTime }
    }
    return config
  })
}

client.interceptors.response.use(undefined, async (err: AxiosError) => {
  if (err.response && err.response.status == 401) {
    window.location.replace('/')
  }

  return Promise.reject(err)
})
