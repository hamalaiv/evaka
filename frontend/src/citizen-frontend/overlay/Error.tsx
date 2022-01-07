// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faExclamation } from 'lib-icons'
import React, { useContext } from 'react'
import InfoModal from 'lib-components/molecules/modals/InfoModal'
import { OverlayContext } from './state'

function GlobalErrorDialog() {
  const { errorMessage, clearErrorMessage } = useContext(OverlayContext)
  return errorMessage ? (
    <InfoModal
      title={errorMessage.title}
      icon={faExclamation}
      iconColour={errorMessage.type === 'error' ? 'red' : 'orange'}
      text={errorMessage.text}
      resolve={{
        label: errorMessage.resolveLabel ?? 'Ok',
        action: clearErrorMessage
      }}
      close={clearErrorMessage}
    />
  ) : null
}

export default GlobalErrorDialog
