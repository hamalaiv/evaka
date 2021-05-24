// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { BaseError } from 'make-error-cause'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import config from '../config'
import {
  Application,
  ApplicationEmail,
  BackupCare,
  CareArea,
  Child,
  Daycare,
  DaycareCaretakers,
  DaycareGroup,
  DaycareGroupPlacement,
  DaycareDailyNote,
  DaycarePlacement,
  Decision,
  DecisionFixture,
  deserializeDecision,
  DevPricing,
  EmployeeDetail,
  FeeDecision,
  Invoice,
  PersonDetail,
  PlacementPlan,
  SuomiFiMessage,
  UUID,
  VoucherValueDecision,
  VtjPerson,
  FamilyContact,
  BackupPickup,
  FridgeChild,
  FridgePartner,
  EmployeePin,
  UserRole
} from './types'
import { JsonOf } from 'lib-common/json'
import {
  ApplicationDetails,
  deserializeApplicationDetails
} from 'lib-common/api-types/application/ApplicationDetails'

export class DevApiError extends BaseError {
  constructor(cause: Error) {
    let message: string
    if (axios.isAxiosError(cause)) {
      message = `${cause.message}: ${formatRequest(
        cause.config
      )}\n${formatResponse(cause.response)}`
    } else {
      message = 'Dev API error'
    }
    super(message, cause)
  }
}

function formatRequest(config: AxiosRequestConfig): string {
  if (!config.url) return ''
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
    const appWithFormStrings = fixture.map((application) => ({
      ...application,
      form: JSON.stringify(application.form)
    }))
    await devClient.post(`/applications`, appWithFormStrings)
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
  action: ApplicationActionSimple
): Promise<void> {
  try {
    await devClient.post(`/applications/${applicationId}/actions/${action}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function createPlacementPlan(
  applicationId: string,
  body: { unitId: string; period: { start: string; end: string } }
): Promise<void> {
  try {
    await devClient.post(
      `/applications/${applicationId}/actions/create-placement-plan`,
      body
    )
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function execSimpleApplicationActions(
  applicationId: string,
  actions: ApplicationActionSimple[]
): Promise<void> {
  for (const action of actions) {
    await execSimpleApplicationAction(applicationId, action)
  }
}

export async function deleteApplication(applicationId: string): Promise<void> {
  try {
    await devClient.delete(`/applications/${applicationId}`)
  } catch (err) {
    console.log(
      `Warning: could not clean up application ${applicationId} after test: ${String(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        err.stack || err.message
      )}`
    )
  }
}

export async function insertPlacementPlan(
  applicationId: string,
  fixture: PlacementPlan
): Promise<void> {
  try {
    await devClient.post(`/placement-plan/${applicationId}`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertCareAreaFixtures(
  fixture: CareArea[]
): Promise<void> {
  try {
    await devClient.post(`/care-areas`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

/*
  Causes the following things to be deleted:
  - care area by given id
  - all clubs and daycares on that care area
  - all addresses related to deleted daycares
  - daycare_placements for all deleted daycares
 */
export async function deleteCareAreaFixture(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/care-areas/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertDaycareFixtures(fixture: Daycare[]): Promise<void> {
  try {
    await devClient.post(
      `/daycares`,
      fixture.map((it) => ({
        id: it.id,
        areaId: it.careAreaId,
        name: it.name,
        type: it.type,
        costCenter: it.costCenter,
        visitingAddress: {
          streetAddress: it.streetAddress,
          postalCode: it.postalCode,
          postOffice: it.postOffice
        },
        decisionCustomization: {
          daycareName: it.decisionDaycareName,
          preschoolName: it.decisionPreschoolName,
          handler: it.decisionHandler,
          handlerAddress: it.decisionHandlerAddress
        },
        openingDate: it.openingDate,
        closingDate: it.closingDate,
        daycareApplyPeriod: it.daycareApplyPeriod,
        preschoolApplyPeriod: it.preschoolApplyPeriod,
        clubApplyPeriod: it.clubApplyPeriod,
        providerType: it.providerType,
        roundTheClock: it.roundTheClock,
        location: it.location,
        language: it.language
      }))
    )
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteDaycare(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/daycares/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertDaycareGroupFixtures(
  fixture: DaycareGroup[]
): Promise<void> {
  try {
    await devClient.post(`/daycare-groups`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteDaycareGroup(id: string): Promise<void> {
  try {
    await devClient.delete(`/daycare-groups/${id}`)
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

export function insertDaycareCaretakerFixtures(
  fixtures: DaycareCaretakers[]
): Promise<void> {
  try {
    return devClient.post(`/daycare-caretakers`, fixtures)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteChildFixture(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/children/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertDaycarePlacementFixtures(
  fixture: DaycarePlacement[]
): Promise<void> {
  try {
    await devClient.post(`/daycare-placements`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertDaycareGroupPlacementFixtures(
  fixture: DaycareGroupPlacement[]
): Promise<void> {
  try {
    await devClient.post(`/daycare-group-placements`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertBackupCareFixtures(
  fixture: BackupCare[]
): Promise<void> {
  try {
    await devClient.post(`/backup-cares`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteEmployeeFixture(externalId: string): Promise<void> {
  try {
    await devClient.delete(`/employee/external-id/${externalId}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteEmployeeById(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/employee/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteEmployeeByExternalId(
  externalId: UUID
): Promise<void> {
  try {
    await devClient.delete(`/employee/external-id/${externalId}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deletePersonBySsn(ssn: string): Promise<void> {
  try {
    await devClient.delete(`/person/ssn/${ssn}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deletePersonFixture(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/person/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertParentshipFixtures(
  fixtures: {
    childId: UUID
    headOfChildId: UUID
    startDate: string
    endDate: string | null
  }[]
): Promise<void> {
  try {
    await devClient.post(`/parentship`, fixtures)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteMessages(): Promise<void> {
  try {
    await devClient.delete(`/message/delete-all`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteMessageAccounts(): Promise<void> {
  try {
    await devClient.delete(`/message-account/delete-all`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function upsertMessageAccounts(): Promise<void> {
  try {
    await devClient.post(`/message-account/upsert-all`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function setAclForDaycares(
  externalId: string,
  daycareId: UUID,
  role?: UserRole
): Promise<void> {
  try {
    await devClient.put(`/daycares/${daycareId}/acl`, { externalId, role })
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteAclForDaycare(
  externalId: string,
  daycareId: UUID
): Promise<void> {
  try {
    await devClient.delete(`/daycares/${daycareId}/acl/${externalId}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function resetDatabase(): Promise<void> {
  try {
    await devClient.post(`/reset-db`, null)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function cleanUpInvoicingDatabase(): Promise<void> {
  try {
    await devClient.post(`/clean-up`, null)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertDecisionFixtures(
  fixture: DecisionFixture[]
): Promise<void> {
  try {
    await devClient.post(`/decisions`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteDecisionFixture(id: string): Promise<void> {
  try {
    await devClient.delete(`/decisions/${id}`)
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

export async function insertPricing(fixture: DevPricing): Promise<void> {
  try {
    await devClient.post('/pricing', fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deletePricing(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/pricing/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function clearPricing(): Promise<void> {
  try {
    await devClient.post(`/pricing/clean-up`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteIncomesByPerson(id: UUID): Promise<void> {
  try {
    await devClient.delete(`/incomes/person/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

// returns the id of the upserted person
export async function upsertPersonFixture(
  fixture: PersonDetail
): Promise<string> {
  try {
    const { data } = await devClient.post<{ id: UUID }>(`/person`, fixture)
    return data.id
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertEmployeeFixture(
  fixture: EmployeeDetail
): Promise<string> {
  try {
    const { data } = await devClient.post<UUID>(`/employee`, fixture)
    return data
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

export async function runPendingAsyncJobs(): Promise<void> {
  try {
    await devClient.post(`/run-jobs`, null)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export function getMessages(): Promise<SuomiFiMessage[]> {
  try {
    return devClient.get<SuomiFiMessage[]>(`/messages`).then((res) => res.data)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function cleanUpMessages(): Promise<void> {
  try {
    await devClient.post(`/messages/clean-up`, null)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export type PersonDetailWithDependantsAndGuardians = PersonDetail & {
  dependants?: PersonDetailWithDependantsAndGuardians[]
  guardians?: PersonDetailWithDependantsAndGuardians[]
}

const toVtjPerson = (
  person: PersonDetailWithDependantsAndGuardians
): VtjPerson => ({
  firstNames: person.firstName,
  lastName: person.lastName,
  socialSecurityNumber: person.ssn || '',
  address: {
    streetAddress: person.streetAddress || '',
    postalCode: person.postalCode || '',
    postOffice: person.postOffice || '',
    streetAddressSe: person.streetAddress || '',
    postOfficeSe: person.postalCode || ''
  },
  dependants: person.dependants?.map(toVtjPerson) ?? [],
  guardians: person.guardians?.map(toVtjPerson) ?? [],
  dateOfDeath: null,
  nationalities: [],
  nativeLanguage: null,
  residenceCode:
    person.residenceCode ??
    `${person.streetAddress ?? ''}${person.postalCode ?? ''}${
      person.postOffice ?? ''
    }`.replace(' ', ''),
  restrictedDetails: {
    enabled: person.restrictedDetailsEnabled || false,
    endDate: person.restrictedDetailsEndDate || null
  }
})

export async function insertVtjPersonFixture(
  fixture: PersonDetailWithDependantsAndGuardians
): Promise<void> {
  const vtjPerson = toVtjPerson(fixture)
  try {
    await devClient.post<VtjPerson>(`/vtj-persons`, vtjPerson)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function getVtjPerson(ssn: string): Promise<VtjPerson> {
  try {
    const { data } = await devClient.get<VtjPerson>(`/vtj-persons/${ssn}`)
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteVtjPerson(ssn: string): Promise<void> {
  try {
    await devClient.delete(`/vtj-persons/${ssn}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export function personToVtjPerson(
  person: PersonDetail,
  dependants: PersonDetail[],
  guardians: PersonDetail[]
): VtjPerson {
  return {
    address: {
      streetAddress: person.streetAddress || null,
      postalCode: person.postalCode || null,
      postOffice: person.postOffice || null,
      streetAddressSe: null,
      postOfficeSe: null
    },
    dateOfDeath: null,
    dependants: dependants.map((dependant) =>
      personToVtjPerson(dependant, [], [])
    ),
    firstNames: person.firstName,
    guardians: guardians.map((guardian) => personToVtjPerson(guardian, [], [])),
    lastName: person.lastName,
    nationalities: [
      {
        countryName: 'Suomi',
        countryCode: 'FIN'
      }
    ],
    nativeLanguage: {
      languageName: 'suomi',
      code: 'fi'
    },
    residenceCode: null,
    restrictedDetails: null,
    socialSecurityNumber: person.ssn || 'e2e-fixture-ssn-missing'
  }
}

export async function getSentEmails(): Promise<ApplicationEmail> {
  try {
    const { data } = await devClient.get<ApplicationEmail>(
      `/application-emails/`
    )
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function cleanUpApplicationEmails(): Promise<void> {
  try {
    await devClient.post(`/application-emails/clean-up`, null)
  } catch (e) {
    throw new DevApiError(e)
  }
}

type PairingStatus =
  | 'WAITING_CHALLENGE'
  | 'WAITING_RESPONSE'
  | 'READY'
  | 'PAIRED'

export interface PairingResponse {
  id: UUID
  unitId: UUID
  challengeKey: string
  responseKey: string | null
  expires: Date
  status: PairingStatus
  mobileDeviceId: UUID | null
}

export async function postPairingChallenge(
  challengeKey: string
): Promise<PairingResponse> {
  try {
    const { data } = await devClient.post<PairingResponse>(
      `/mobile/pairings/challenge`,
      {
        challengeKey
      }
    )
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function postPairingResponse(
  pairingId: UUID,
  challengeKey: string,
  responseKey: string
): Promise<PairingResponse> {
  try {
    const { data } = await devClient.post<PairingResponse>(
      `/mobile/pairings/${pairingId}/response`,
      {
        challengeKey,
        responseKey
      }
    )
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function postPairing(unitId: UUID): Promise<PairingResponse> {
  try {
    const { data } = await devClient.post<PairingResponse>(`/mobile/pairings`, {
      unitId
    })
    return data
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deletePairing(pairingId: string): Promise<void> {
  try {
    await devClient.delete(`/mobile/pairings/${pairingId}`)
  } catch (err) {
    console.log(
      `Warning: could not clean up pairing ${pairingId} after test: ${String(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        err.stack || err.message
      )}`
    )
  }
}

interface MobileDevice {
  id: UUID
  unitId: UUID
  name: string
  deleted: boolean
  longTermToken: UUID
}

export async function postMobileDevice(
  mobileDevice: MobileDevice
): Promise<void> {
  try {
    await devClient.post<PairingResponse>(`/mobile/devices`, mobileDevice)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteMobileDevice(deviceId: string): Promise<void> {
  try {
    await devClient.delete(`/mobile/devices/${deviceId}`)
  } catch (err) {
    console.log(
      `Warning: could not clean up mobile device ${deviceId} after test: ${String(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        err.stack || err.message
      )}`
    )
  }
}

export async function getDecisionsByApplication(
  applicationId: string
): Promise<Decision[]> {
  try {
    const { data } = await devClient.get<JsonOf<Decision[]>>(
      `/applications/${applicationId}/decisions`
    )
    return data.map(deserializeDecision)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function getApplication(
  applicationId: string
): Promise<ApplicationDetails> {
  try {
    const { data } = await devClient.get<JsonOf<ApplicationDetails>>(
      `/applications/${applicationId}`
    )
    return deserializeApplicationDetails(data)
  } catch (e) {
    throw new DevApiError(e)
  }
}

interface DigitransitAutocomplete {
  features: DigitransitFeature[]
}

export interface DigitransitFeature {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    name: string
    postalcode?: string
    locality?: string
    localadmin?: string
  }
}

export async function putDigitransitAutocomplete(
  mockResponse: DigitransitAutocomplete
): Promise<void> {
  try {
    await devClient.put('/digitransit/autocomplete', mockResponse)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function postDaycareDailyNote(
  note: DaycareDailyNote
): Promise<void> {
  try {
    await devClient.post<PairingResponse>(`/messaging/daycare-daily-note`, note)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteAttendances(): Promise<void> {
  try {
    await devClient.delete(`/attendances`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteDaycareDailyNotes(): Promise<void> {
  try {
    await devClient.delete(`/daycare-daily-notes`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteAbsences(): Promise<void> {
  try {
    await devClient.delete(`/absences`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertFamilyContacts(
  fixture: FamilyContact[]
): Promise<void> {
  try {
    await devClient.post(`/family-contact`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteFamilyContact(id: string): Promise<void> {
  try {
    await devClient.delete(`/family-contact/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertBackupPickups(
  fixture: BackupPickup[]
): Promise<void> {
  try {
    await devClient.post(`/backup-pickup`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteBackupPickup(id: string): Promise<void> {
  try {
    await devClient.delete(`/backup-pickup/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertFridgeChildren(
  fixture: FridgeChild[]
): Promise<void> {
  try {
    await devClient.post(`/fridge-child`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteFridgeChild(id: string): Promise<void> {
  try {
    await devClient.delete(`/fridge-child/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertFridgePartners(
  fixture: FridgePartner[]
): Promise<void> {
  try {
    await devClient.post(`/fridge-partner`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteFridgePartner(id: string): Promise<void> {
  try {
    await devClient.delete(`/fridge-partner/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function insertEmployeePins(
  fixture: EmployeePin[]
): Promise<void> {
  try {
    await devClient.post(`/employee-pin`, fixture)
  } catch (e) {
    throw new DevApiError(e)
  }
}

export async function deleteEmployeePin(id: string): Promise<void> {
  try {
    await devClient.delete(`/employee-pin/${id}`)
  } catch (e) {
    throw new DevApiError(e)
  }
}
