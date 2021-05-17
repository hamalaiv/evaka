// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Loading, Paged, Result } from 'lib-common/api'
import { useRestApi } from 'lib-common/utils/useRestApi'
import { ContentArea } from 'lib-components/layout/Container'
import Pagination from 'lib-components/Pagination'
import { H1, H2 } from 'lib-components/typography'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { UUID } from '../../../lib-common/types'
import { useTranslation } from '../../state/i18n'
import { getReceivedMessages, markThreadRead } from './api'
import { ReceivedMessages } from './ReceivedMessages'
import { SingleThreadView } from './SingleThreadView'
import { MessageThread } from './types'
import { AccountView } from './types-view'

const PAGE_SIZE = 20

const MessagesContainer = styled(ContentArea)`
  overflow: hidden;
`

const markMessagesReadIfThreadIdMatches = (id: UUID) => (t: MessageThread) =>
  t.id === id
    ? {
        ...t,
        messages: t.messages.map((m) => ({
          ...m,
          readAt: m.readAt ?? new Date()
        }))
      }
    : t

export default React.memo(function MessagesList({
  account,
  view
}: AccountView) {
  const { i18n } = useTranslation()

  const [page, setPage] = useState<number>(1)
  const [pages, setPages] = useState<number>()
  const [receivedMessages, setReceivedMessages] = useState<
    Result<MessageThread[]>
  >(Loading.of())
  const [selectedThread, setSelectedThread] = useState<MessageThread>()

  const setMessagesResult = useCallback(
    (result: Result<Paged<MessageThread>>) => {
      setReceivedMessages(result.map((r) => r.data))
      if (result.isSuccess) {
        setPages(result.value.pages)
      }
    },
    []
  )

  const loadReceivedMessages = useRestApi(
    getReceivedMessages,
    setMessagesResult
  )

  // reset view and load messages if account, view or page changes
  useEffect(() => {
    setSelectedThread(undefined)
    switch (view) {
      case 'RECEIVED':
        loadReceivedMessages(account.id, page, PAGE_SIZE)
        break
      case 'SENT':
        setReceivedMessages(Loading.of())
    }
  }, [account.id, view, page, loadReceivedMessages])

  const onSelectThread = useCallback(
    (thread: MessageThread) => {
      setSelectedThread(thread)

      const hasUnreadMessages = thread.messages.some((m) => !m.readAt)
      if (hasUnreadMessages) {
        setReceivedMessages((prev) =>
          prev.map((t: MessageThread[]) =>
            t.map(markMessagesReadIfThreadIdMatches(thread.id))
          )
        )
        void markThreadRead(account.id, thread.id)
      }
    },
    [account.id]
  )

  if (selectedThread) {
    return (
      <SingleThreadView
        goBack={() => setSelectedThread(undefined)}
        thread={selectedThread}
      />
    )
  }

  return (
    <MessagesContainer opaque>
      <H1>{i18n.messages.messageList.titles[view]}</H1>
      {!account.personal && <H2>{account.name}</H2>}
      {view === 'RECEIVED' ? (
        <ReceivedMessages
          messages={receivedMessages}
          onSelectThread={onSelectThread}
        />
      ) : (
        <div>TODO sent messages</div>
      )}
      <Pagination
        pages={pages}
        currentPage={page}
        setPage={setPage}
        label={i18n.common.page}
      />
    </MessagesContainer>
  )
})
