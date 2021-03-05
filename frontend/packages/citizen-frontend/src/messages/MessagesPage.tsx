// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useState } from 'react'
import { Loading, Result } from '@evaka/lib-common/src/api'
import { useRestApi } from '@evaka/lib-common/src/utils/useRestApi'
import { tabletMin } from '@evaka/lib-components/src/breakpoints'
import Container from '@evaka/lib-components/src/layout/Container'
import AdaptiveFlex from '@evaka/lib-components/src/layout/AdaptiveFlex'
import { Gap } from '@evaka/lib-components/src/white-space'
import { ReceivedBulletin } from '../messages/types'
import { getBulletins, markBulletinRead } from '../messages/api'
import MessagesList from '../messages/MessagesList'
import MessageReadView from '../messages/MessageReadView'
import styled from 'styled-components'
import { HeaderState, HeaderContext } from './state'

export default React.memo(function MessagesPage() {
  const [bulletins, setBulletins] = useState<Result<ReceivedBulletin[]>>(
    Loading.of()
  )
  const [activeBulletin, setActiveBulletin] = useState<ReceivedBulletin | null>(
    null
  )

  const { refreshUnreadBulletinsCount } = useContext<HeaderState>(HeaderContext)

  const loadBulletins = useRestApi(getBulletins, setBulletins)
  useEffect(() => loadBulletins(), [])

  const openBulletin = (bulletin: ReceivedBulletin) => {
    setActiveBulletin(bulletin)

    if (bulletin.isRead) return

    void markBulletinRead(bulletin.id).then(() => {
      refreshUnreadBulletinsCount()
      setActiveBulletin((b) =>
        b?.id === bulletin.id ? { ...b, isRead: true } : b
      )

      setBulletins(
        bulletins.map((values) =>
          values.map((b) => (b.id === bulletin.id ? { ...b, isRead: true } : b))
        )
      )
    })
  }

  return (
    <Container>
      <Gap size="s" />
      <StyledFlex breakpoint={tabletMin} horizontalSpacing="L">
        <MessagesList
          bulletins={bulletins}
          activeBulletin={activeBulletin}
          onClickBulletin={openBulletin}
          onReturn={() => setActiveBulletin(null)}
        />
        {activeBulletin && <MessageReadView bulletin={activeBulletin} />}
      </StyledFlex>
    </Container>
  )
})

const StyledFlex = styled(AdaptiveFlex)`
  align-items: stretch;
`
