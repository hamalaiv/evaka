// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import * as fs from 'fs/promises'

import axios, {
  AxiosHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import FormData from 'form-data'
import { BaseError } from 'make-error-cause'

import FiniteDateRange from 'lib-common/finite-date-range'
import {
  FeeDecision,
  FeeThresholds,
  IncomeNotification,
  Invoice
} from 'lib-common/generated/api-types/invoicing'
import { DailyReservationRequest } from 'lib-common/generated/api-types/reservations'
import { OfficialLanguage } from 'lib-common/generated/api-types/shared'
import { CurriculumType } from 'lib-common/generated/api-types/vasu'
import HelsinkiDateTime from 'lib-common/helsinki-date-time'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'

import config from '../config'
import { MockVtjDataset, VoucherValueDecision } from '../generated/api-types'

import { PersonBuilder } from './fixtures'
import {
  Application,
  Child,
  Daycare,
  PersonDetail,
  PlacementPlan
} from './types'

export class DevApiError extends BaseError {
  constructor(cause: unknown) {
    if (axios.isAxiosError(cause)) {
      const message = `${cause.message}: ${formatRequest(
        cause.config
      )}\n${formatResponse(cause.response)}`
      super(message, cause)
    } else if (cause instanceof Error) {
      super('Dev API error', cause)
    } else {
      super('Dev API error')
    }
  }
}

function clockHeader(now: HelsinkiDateTime): AxiosHeaders {
  return new AxiosHeaders({
    EvakaMockedTime: now.formatIso()
  })
}

function formatRequest(config: InternalAxiosRequestConfig | undefined): string {
  if (!config || !config.url) return ''
  const url = new URL(config.url, config.baseURL)
  return `${String(config.method)} ${url.pathname}${url.search}${url.hash}`
}

function formatResponse(response: AxiosResponse | undefined): string {
  if (!response) return '[no response]'
  if (!response.data) return '[no response body]'
  if (typeof response.data === 'string') return response.data
  return JSON.stringify(response.data, null, 2)
}

export const devClient = axios.create({
  baseURL: config.devApiGwUrl
})

export async function insertApplications(
  fixture: Application[]
): Promise<void> {
  try {
    await devClient.post(`/applications`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

type ApplicationActionSimple =
  | 'move-to-waiting-placement'
  | 'cancel-application'
  | 'set-verified'
  | 'set-unverified'
  | 'create-default-placement-plan'
  | 'confirm-placement-without-decision'
  | 'send-decisions-without-proposal'
  | 'send-placement-proposal'
  | 'confirm-decision-mailed'

export async function execSimpleApplicationAction(
  applicationId: string,
  action: ApplicationActionSimple,
  mockedTime: HelsinkiDateTime
): Promise<void> {
  try {
    await devClient.post(
      `/applications/${applicationId}/actions/${action}`,
      null,
      {
        headers: clockHeader(mockedTime)
      }
    )
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function execSimpleApplicationActions(
  applicationId: string,
  actions: ApplicationActionSimple[],
  mockedTime: HelsinkiDateTime
): Promise<void> {
  for (const action of actions) {
    await execSimpleApplicationAction(applicationId, action, mockedTime)
    await runPendingAsyncJobs(mockedTime)
  }
}

export async function insertPlacementPlan(
  fixture: PlacementPlan
): Promise<void> {
  try {
    await devClient.post(`/placement-plan/${fixture.applicationId}`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertDaycareFixtures(fixture: Daycare[]): Promise<void> {
  try {
    await devClient.post(
      `/daycares`,
      fixture.map(
        ({
          streetAddress,
          postalCode,
          postOffice,
          decisionDaycareName,
          decisionPreschoolName,
          decisionHandler,
          decisionHandlerAddress,
          ...daycare
        }) => ({
          ...daycare,
          visitingAddress: {
            streetAddress,
            postalCode,
            postOffice
          },
          decisionCustomization: {
            daycareName: decisionDaycareName,
            preschoolName: decisionPreschoolName,
            handler: decisionHandler,
            handlerAddress: decisionHandlerAddress
          }
        })
      )
    )
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertChildFixtures(fixture: Child[]): Promise<void> {
  try {
    await devClient.post(`/children`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export function insertReservationFixtures(
  fixtures: DailyReservationRequest[]
): Promise<void> {
  try {
    return devClient.post(`/reservations`, fixtures)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertParentshipFixtures(
  fixtures: {
    childId: UUID
    headOfChildId: UUID
    startDate: LocalDate
    endDate: LocalDate | null
  }[]
): Promise<void> {
  try {
    await devClient.post(`/parentship`, fixtures)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function createDecisionPdf(id: string): Promise<void> {
  try {
    await devClient.post(`/decisions/${id}/actions/create-pdf`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function rejectDecisionByCitizen(id: string): Promise<void> {
  try {
    await devClient.post(`/decisions/${id}/actions/reject-by-citizen`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertFeeDecisionFixtures(
  fixture: FeeDecision[]
): Promise<void> {
  try {
    await devClient.post(`/fee-decisions`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertVoucherValueDecisionFixtures(
  fixture: VoucherValueDecision[]
): Promise<void> {
  try {
    await devClient.post(`/value-decisions`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertInvoiceFixtures(fixture: Invoice[]): Promise<void> {
  try {
    await devClient.post(`/invoices`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertFeeThresholds(
  fixture: FeeThresholds
): Promise<void> {
  try {
    await devClient.post('/fee-thresholds', fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export interface IncomeStatementFixture {
  type: string
  startDate: LocalDate
  endDate: LocalDate | null
  otherInfo?: string
  attachmentIds?: UUID[]
}

export async function insertIncomeStatements(
  personId: UUID,
  data: IncomeStatementFixture[]
): Promise<void> {
  try {
    await devClient.post(`/income-statements`, { personId, data })
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertIncomeNotification(fixture: IncomeNotification) {
  try {
    await devClient.post('/income-notifications', fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertPersonFixture(
  fixture: PersonDetail
): Promise<string> {
  try {
    const { data } = await devClient.post<UUID>(`/person/create`, fixture)
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertChildFixture(
  fixture: PersonDetail
): Promise<string> {
  try {
    const { data } = await devClient.post<UUID>(`/child`, fixture)
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function runPendingAsyncJobs(
  mockedTime: HelsinkiDateTime
): Promise<void> {
  try {
    await devClient.post(`/run-jobs`, null, {
      headers: clockHeader(mockedTime)
    })
  } catch (e) {
    throw new DevApiError(e)
  }
}

export const vtjDependants = (
  guardian: PersonDetail | PersonBuilder,
  ...dependants: (PersonDetail | PersonBuilder)[]
): MockVtjDataset => {
  const guardianSsn = 'data' in guardian ? guardian.data.ssn : guardian.ssn
  if (!guardianSsn) throw new Error('Guardian must have SSN')
  return {
    persons: [],
    guardianDependants: {
      [guardianSsn]: dependants.map((d) => {
        const ssn = 'data' in d ? d.data.ssn : d.ssn
        if (!ssn) throw new Error('Dependant must have SSN')
        return ssn
      })
    }
  }
}

export async function insertPedagogicalDocumentAttachment(
  pedagogicalDocumentId: string,
  employeeId: string,
  fileName: string,
  filePath: string
): Promise<string> {
  const file = await fs.readFile(`${filePath}/${fileName}`)
  const form = new FormData()
  form.append('file', file, fileName)
  form.append('employeeId', employeeId)
  try {
    return await devClient
      .post<string>(
        `/pedagogical-document-attachment/${pedagogicalDocumentId}`,
        form,
        { headers: form.getHeaders() }
      )
      .then((res) => res.data)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertVasuTemplateFixture(
  body: Partial<{
    name: string
    valid: FiniteDateRange
    type: CurriculumType
    language: OfficialLanguage
  }> = {}
): Promise<UUID> {
  try {
    const { data } = await devClient.post<UUID>('/vasu/template', body)
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}
