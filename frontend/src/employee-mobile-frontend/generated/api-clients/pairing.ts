// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable import/order, prettier/prettier, @typescript-eslint/no-namespace, @typescript-eslint/no-redundant-type-constituents */

import { JsonCompatible } from 'lib-common/json'
import { JsonOf } from 'lib-common/json'
import { MobileDevice } from 'lib-common/generated/api-types/pairing'
import { Pairing } from 'lib-common/generated/api-types/pairing'
import { PairingStatusRes } from 'lib-common/generated/api-types/pairing'
import { PinLoginRequest } from 'lib-common/generated/api-types/pairing'
import { PinLoginResponse } from 'lib-common/generated/api-types/pairing'
import { PostPairingChallengeReq } from 'lib-common/generated/api-types/pairing'
import { RenameRequest } from 'lib-common/generated/api-types/pairing'
import { UUID } from 'lib-common/types'
import { client } from '../../client'
import { deserializeJsonPairing } from 'lib-common/generated/api-types/pairing'
import { uri } from 'lib-common/uri'


/**
* Generated from fi.espoo.evaka.pairing.MobileDevicesController.deleteMobileDevice
*/
export async function deleteMobileDevice(
  request: {
    id: UUID
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/mobile-devices/${request.id}`.toString(),
    method: 'DELETE'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.pairing.MobileDevicesController.getMobileDevices
*/
export async function getMobileDevices(
  request: {
    unitId: UUID
  }
): Promise<MobileDevice[]> {
  const { data: json } = await client.request<JsonOf<MobileDevice[]>>({
    url: uri`/mobile-devices`.toString(),
    method: 'GET',
    params: {
      unitId: request.unitId
    }
  })
  return json
}


/**
* Generated from fi.espoo.evaka.pairing.MobileDevicesController.pinLogin
*/
export async function pinLogin(
  request: {
    body: PinLoginRequest
  }
): Promise<PinLoginResponse> {
  const { data: json } = await client.request<JsonOf<PinLoginResponse>>({
    url: uri`/mobile-devices/pin-login`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PinLoginRequest>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.pairing.MobileDevicesController.putMobileDeviceName
*/
export async function putMobileDeviceName(
  request: {
    id: UUID,
    body: RenameRequest
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/mobile-devices/${request.id}/name`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<RenameRequest>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.pairing.PairingsController.getPairingStatus
*/
export async function getPairingStatus(
  request: {
    id: UUID
  }
): Promise<PairingStatusRes> {
  const { data: json } = await client.request<JsonOf<PairingStatusRes>>({
    url: uri`/public/pairings/${request.id}/status`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.pairing.PairingsController.postPairingChallenge
*/
export async function postPairingChallenge(
  request: {
    body: PostPairingChallengeReq
  }
): Promise<Pairing> {
  const { data: json } = await client.request<JsonOf<Pairing>>({
    url: uri`/public/pairings/challenge`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PostPairingChallengeReq>
  })
  return deserializeJsonPairing(json)
}