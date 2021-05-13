// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment, useEffect, useState } from 'react'
import styled from 'styled-components'
import colors from 'lib-customizations/common'
import { Result, Loading } from 'lib-common/api'
import {
  getPairingStatus,
  PairingResponse,
  postPairing,
  postPairingResponse,
  putMobileDeviceName
} from '../../api/unit'
import InfoModal from 'lib-components/molecules/modals/InfoModal'
import InputField from 'lib-components/atoms/form/InputField'
import Loader from 'lib-components/atoms/Loader'
import { faPlus } from 'lib-icons'
import { useTranslation } from '../../state/i18n'
import { UUID } from '../../types'

interface Props {
  unitId: UUID
  closeModal: () => void
}

const Bold = styled.span`
  font-weight: 600;
`

const Flex = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const ResponseKey = styled.div`
  font-family: Montserrat, sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 30px;
  line-height: 30px;
  text-align: center;
  letter-spacing: 0.08em;
  color: ${colors.greyscale.dark};
`

export default React.memo(function MobilePairingModal({
  unitId,
  closeModal
}: Props) {
  const { i18n } = useTranslation()

  const [phase, setPhase] = useState<1 | 2 | 3>(1)
  const [responseKey, setResponseKey] = useState<string>('')
  const [deviceName, setDeviceName] = useState<string>('')
  const [pairingResponse, setPairingResponse] = useState<
    Result<PairingResponse>
  >(Loading.of())

  useEffect(() => {
    if (phase === 1) {
      void postPairing(unitId).then(setPairingResponse)
    }
  }, [phase, unitId])

  useEffect(() => {
    if (responseKey.length === 10) {
      if (pairingResponse.isSuccess) {
        void postPairingResponse(
          pairingResponse.value.id,
          pairingResponse.value.challengeKey,
          responseKey
        ).then((res) => {
          if (res.isSuccess) {
            setPairingResponse(res)
            if (res.value.status === 'READY') {
              setPhase(3)
            }
          }
        })
      }
    }
  }, [responseKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const polling = setInterval(() => {
      if (pairingResponse.isSuccess) {
        if (pairingResponse.value.status === 'WAITING_CHALLENGE') {
          void getPairingStatus(pairingResponse.value.id).then((status) => {
            if (status.isSuccess) {
              if (status.value.status === 'WAITING_RESPONSE') {
                clearInterval(polling)
                setPhase(2)
              }
            }
          })
        }
      }
    }, 1000)
    return () => clearInterval(polling)
  }, [pairingResponse])

  async function saveDeviceName() {
    if (pairingResponse.isSuccess && pairingResponse.value.mobileDeviceId) {
      await putMobileDeviceName(
        pairingResponse.value.mobileDeviceId,
        deviceName
      )
      closeModal()
    }
  }

  return (
    <Fragment>
      {phase === 1 && (
        <InfoModal
          iconColour={'blue'}
          title={i18n.unit.accessControl.mobileDevices.modalTitle}
          icon={faPlus}
          text={
            <Fragment>
              {i18n.unit.accessControl.mobileDevices.modalText1}
              <br />
              <Bold>{`${window.location.hostname}/employee/mobile`}</Bold>
              <br />
              {i18n.unit.accessControl.mobileDevices.modalText2}
            </Fragment>
          }
          resolve={{ action: closeModal, label: i18n.common.cancel }}
          data-qa="mobile-pairing-modal-phase-1"
        >
          {pairingResponse.isLoading && <Loader />}
          {pairingResponse.isFailure && <div>{i18n.common.loadingFailed}</div>}
          {pairingResponse.isSuccess && (
            <ResponseKey data-qa="challenge-key">
              {pairingResponse.value.challengeKey}
            </ResponseKey>
          )}
        </InfoModal>
      )}

      {phase === 2 && (
        <InfoModal
          iconColour={'blue'}
          title={i18n.unit.accessControl.mobileDevices.modalTitle}
          icon={faPlus}
          text={i18n.unit.accessControl.mobileDevices.modalText3}
          resolve={{ action: closeModal, label: i18n.common.cancel }}
        >
          {pairingResponse.isLoading && <Loader />}
          {pairingResponse.isFailure && <div>{i18n.common.loadingFailed}</div>}
          {pairingResponse.isSuccess && (
            <Flex>
              <InputField
                value={responseKey}
                onChange={setResponseKey}
                placeholder={i18n.common.code}
                width={'m'}
                data-qa="response-key-input"
              />
            </Flex>
          )}
        </InfoModal>
      )}

      {phase === 3 && (
        <InfoModal
          iconColour={'green'}
          title={i18n.unit.accessControl.mobileDevices.modalTitle}
          icon={faPlus}
          text={i18n.unit.accessControl.mobileDevices.modalText4}
          reject={{ action: closeModal, label: i18n.common.cancel }}
          resolve={{ action: saveDeviceName, label: i18n.common.ready }}
        >
          {pairingResponse.isLoading && <Loader />}
          {pairingResponse.isFailure && <div>{i18n.common.loadingFailed}</div>}
          {pairingResponse.isSuccess && (
            <Flex>
              {pairingResponse.value.mobileDeviceId ? (
                <InputField
                  value={deviceName}
                  onChange={setDeviceName}
                  placeholder={
                    i18n.unit.accessControl.mobileDevices.editPlaceholder
                  }
                  width={'m'}
                  data-qa="mobile-device-name-input"
                  id={pairingResponse.value.mobileDeviceId}
                />
              ) : (
                <div>{i18n.common.loadingFailed}</div>
              )}
            </Flex>
          )}
        </InfoModal>
      )}
    </Fragment>
  )
})
