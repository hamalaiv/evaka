// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { GroupInfo } from 'lib-common/generated/api-types/attendance'
import {
  AuthorizedMessageAccount,
  DraftContent,
  SentMessage
} from 'lib-common/generated/api-types/messaging'
import { useQueryResult } from 'lib-common/query'
import { UUID } from 'lib-common/types'
import Button from 'lib-components/atoms/buttons/Button'
import { ContentArea } from 'lib-components/layout/Container'
import { Tabs } from 'lib-components/molecules/Tabs'
import { defaultMargins } from 'lib-components/white-space'
import { faPlus } from 'lib-icons'

import { routes } from '../App'
import { renderResult } from '../async-rendering'
import BottomNavbar, { bottomNavBarHeight } from '../common/BottomNavbar'
import { PageWithNavigation } from '../common/PageWithNavigation'
import TopBar from '../common/TopBar'
import { useTranslation } from '../common/i18n'
import { UnitOrGroup, toUnitOrGroup } from '../common/unit-or-group'
import { unitInfoQuery } from '../units/queries'

import DraftMessagesList from './DraftMessagesList'
import MessageEditor from './MessageEditor'
import ReceivedThreadsList from './ReceivedThreadsList'
import SentMessagesList from './SentMessagesList'
import { ReceivedThreadView, SentMessageView } from './ThreadView'
import { recipientsQuery } from './queries'
import { MessageContext } from './state'

type Tab = 'received' | 'sent' | 'drafts'

type UiState =
  | { type: 'list' }
  | { type: 'receivedThread'; threadId: UUID }
  | { type: 'sentMessage'; message: SentMessage }
  | { type: 'newMessage'; draft: DraftContent | undefined }

export default function MessagesPage({
  unitOrGroup
}: {
  unitOrGroup: UnitOrGroup
}) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  const unitId = unitOrGroup.unitId
  const unitInfoResponse = useQueryResult(unitInfoQuery({ unitId }))

  const { groupAccounts, selectedAccount } = useContext(MessageContext)

  const recipients = useQueryResult(recipientsQuery(), {
    enabled: selectedAccount !== undefined
  })

  const threadListTabs = useMemo(
    () => [
      {
        id: 'received',
        onClick: () => setActiveTab('received'),
        label: i18n.messages.tabs.received
      },
      {
        id: 'sent',
        onClick: () => setActiveTab('sent'),
        label: i18n.messages.tabs.sent
      },
      {
        id: 'drafts',
        onClick: () => setActiveTab('drafts'),
        label: i18n.messages.tabs.drafts
      }
    ],
    [i18n]
  )
  const [activeTab, setActiveTab] = useState<Tab>('received')
  const [uiState, setUiState] = useState<UiState>({ type: 'list' })

  const selectReceivedThread = useCallback(
    (threadId: UUID) => setUiState({ type: 'receivedThread', threadId }),
    []
  )

  const selectSentMessage = useCallback(
    (message: SentMessage) => setUiState({ type: 'sentMessage', message }),
    []
  )

  const selectDraftMessage = useCallback(
    (draft: DraftContent) => setUiState({ type: 'newMessage', draft }),
    []
  )

  const changeGroup = useCallback(
    (group: GroupInfo | undefined) => {
      if (group)
        navigate(
          routes.messages(toUnitOrGroup({ unitId, groupId: group.id })).value
        )
    },
    [navigate, unitId]
  )
  const onBack = useCallback(() => setUiState({ type: 'list' }), [])

  return selectedAccount
    ? ((selectedAccount: AuthorizedMessageAccount) => {
        switch (uiState.type) {
          case 'list':
            return (
              <PageWithNavigation
                selected="messages"
                selectedGroup={
                  selectedAccount?.daycareGroup
                    ? {
                        id: selectedAccount.daycareGroup.id,
                        name: selectedAccount.daycareGroup.name,
                        utilization: 0
                      }
                    : undefined
                }
                unitOrGroup={unitOrGroup}
                onChangeGroup={changeGroup}
                allowedGroupIds={groupAccounts.flatMap(
                  (ga) => ga.daycareGroup?.id || []
                )}
                includeSelectAll={false}
              >
                <ContentArea
                  opaque
                  paddingVertical="zero"
                  paddingHorizontal="zero"
                  data-qa="messages-page-content-area"
                >
                  <Tabs mobile active={activeTab} tabs={threadListTabs} />
                  {activeTab === 'received' ? (
                    <ReceivedThreadsList
                      onSelectThread={selectReceivedThread}
                    />
                  ) : activeTab === 'sent' ? (
                    <SentMessagesList onSelectMessage={selectSentMessage} />
                  ) : (
                    <DraftMessagesList onSelectDraft={selectDraftMessage} />
                  )}
                  <HoverButton
                    primary
                    onClick={() =>
                      setUiState({ type: 'newMessage', draft: undefined })
                    }
                    data-qa="new-message-btn"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    {i18n.messages.newMessage}
                  </HoverButton>
                </ContentArea>
              </PageWithNavigation>
            )
          case 'receivedThread':
          case 'sentMessage': {
            return (
              <ContentArea
                opaque={false}
                fullHeight
                paddingHorizontal="zero"
                paddingVertical="zero"
                data-qa="messages-page-content-area"
              >
                {uiState.type === 'receivedThread' ? (
                  <ReceivedThreadView
                    unitId={unitId}
                    threadId={uiState.threadId}
                    onBack={onBack}
                    accountId={selectedAccount.account.id}
                  />
                ) : (
                  <SentMessageView
                    unitId={unitId}
                    account={selectedAccount.account}
                    message={uiState.message}
                    onBack={onBack}
                  />
                )}
              </ContentArea>
            )
          }
          case 'newMessage':
            return renderResult(recipients, (availableRecipients) => (
              <MessageEditor
                unitId={unitId}
                availableRecipients={availableRecipients}
                account={selectedAccount.account}
                draft={uiState.draft}
                onClose={() => setUiState({ type: 'list' })}
              />
            ))
        }
      })(selectedAccount)
    : renderResult(unitInfoResponse, (unit) => (
        <ContentArea
          opaque
          paddingVertical="zero"
          paddingHorizontal="zero"
          data-qa="messages-page-content-area"
        >
          <TopBar title={unit.name} unitId={unitId} />
          {groupAccounts.length === 0 ? (
            <NoAccounts data-qa="info-no-account-access">
              {i18n.messages.noAccountAccess}
            </NoAccounts>
          ) : (
            <Navigate
              to={routes.unreadMessages(unitOrGroup).value}
              replace={true}
            />
          )}
          <BottomNavbar selected="messages" unitOrGroup={unitOrGroup} />
        </ContentArea>
      ))
}

const NoAccounts = styled.div`
  padding: ${defaultMargins.m} ${defaultMargins.s};
`

const HoverButton = styled(Button)`
  position: fixed;
  bottom: calc(${defaultMargins.s} + ${bottomNavBarHeight}px);
  right: ${defaultMargins.s};
  border-radius: 40px;
  box-shadow: 0 4px 4px 0 ${(p) => p.theme.colors.grayscale.g15};
`
