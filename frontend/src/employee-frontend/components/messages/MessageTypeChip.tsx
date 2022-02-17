// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'
import { MessageType } from 'lib-common/generated/api-types/messaging'
import { StaticChip } from 'lib-components/atoms/Chip'
import { colors } from 'lib-customizations/common'
import { useTranslation } from '../../state/i18n'

// TODO is the 20px line-height in StaticChip unintentional?
const Chip = styled(StaticChip)`
  line-height: 16px;
`

const chipColors = {
  MESSAGE: colors.accents.a4violet,
  BULLETIN: colors.main.m1
}

export function MessageTypeChip({ type }: { type: MessageType }) {
  const { i18n } = useTranslation()
  return <Chip color={chipColors[type]}>{i18n.messages.types[type]}</Chip>
}
