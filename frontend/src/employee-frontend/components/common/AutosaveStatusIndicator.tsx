// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'

import { useTranslation } from 'employee-frontend/state/i18n'
import { AutosaveStatus } from 'employee-frontend/utils/use-autosave'
import { formatTime } from 'lib-common/date'
import { fontWeights, P } from 'lib-components/typography'
import { theme } from 'lib-customizations/common'

export default React.memo(function AutosaveStatusIndicator({
  status
}: {
  status: AutosaveStatus
}) {
  const { i18n } = useTranslation()

  function formatStatus(status: AutosaveStatus): string | null {
    switch (status.state) {
      case 'loading-error':
        return i18n.common.error.unknown
      case 'save-error':
        return i18n.common.error.saveFailed
      case 'loading':
      case 'loading-dirty':
      case 'saving':
      case 'saving-dirty':
      case 'dirty':
      case 'clean':
        return status.savedAt
          ? `${i18n.common.saved}\n${formatTime(status.savedAt)}`
          : null
    }
  }

  return (
    <Indicator
      preserveWhiteSpace
      noMargin
      color={theme.colors.grayscale.g70}
      data-status={status.state}
      data-qa="autosave-indicator"
    >
      {formatStatus(status)}
    </Indicator>
  )
})

const Indicator = styled(P)`
  font-weight: ${fontWeights.bold};
`
