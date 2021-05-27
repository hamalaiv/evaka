// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Loading, Paged, Result, Success } from 'lib-common/api'
import { UUID } from 'lib-common/types'
import { useRestApi } from 'lib-common/utils/useRestApi'
import _ from 'lodash'
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  getMessageAccount,
  getReceivedMessages,
  getUnreadMessagesCount,
  markThreadRead,
  replyToThread,
  ReplyToThreadParams
} from './api'
import { MessageAccount, MessageThread, ReplyResponse } from './types'

const initialThreadState: ThreadsState = {
  threads: [],
  selectedThread: undefined,
  loadingResult: Loading.of(),
  currentPage: 0,
  pages: Infinity
}

interface ThreadsState {
  threads: MessageThread[]
  selectedThread: UUID | undefined
  loadingResult: Result<void>
  currentPage: number
  pages: number
}

export interface MessagePageState {
  account: Result<MessageAccount>
  loadAccount: () => void
  threads: MessageThread[]
  threadLoadingResult: Result<void>
  loadMoreThreads: () => void
  selectedThread: MessageThread | undefined
  selectThread: (thread: MessageThread | undefined) => void
  sendReply: (params: ReplyToThreadParams) => void
  replyState: Result<void> | undefined
  unreadMessagesCount: number | undefined
  refreshUnreadMessagesCount: () => void
}

const defaultState: MessagePageState = {
  account: Loading.of(),
  loadAccount: () => undefined,
  threads: [],
  threadLoadingResult: Loading.of(),
  loadMoreThreads: () => undefined,
  selectedThread: undefined,
  selectThread: () => undefined,
  sendReply: () => undefined,
  replyState: undefined,
  unreadMessagesCount: undefined,
  refreshUnreadMessagesCount: () => undefined
}

export const MessageContext = createContext<MessagePageState>(defaultState)

const markMatchingThreadRead = (
  threads: MessageThread[],
  id: UUID
): MessageThread[] =>
  threads.map((t) =>
    t.id === id
      ? {
          ...t,
          messages: t.messages.map((m) => ({
            ...m,
            readAt: m.readAt || new Date()
          }))
        }
      : t
  )

export const MessageContextProvider = React.memo(
  function MessageContextProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<Result<MessageAccount>>(Loading.of())
    const loadAccount = useRestApi(getMessageAccount, setAccount)

    const [threads, setThreads] = useState<ThreadsState>(initialThreadState)

    const setMessagesResult = useCallback(
      (result: Result<Paged<MessageThread>>) =>
        setThreads((state) =>
          result.mapAll({
            loading() {
              return state
            },
            failure() {
              return {
                ...state,
                loadingResult: result.map(() => undefined)
              }
            },
            success({ data, pages }) {
              return {
                ...state,
                threads: [...state.threads, ...data],
                loadingResult: Success.of(undefined),
                pages
              }
            }
          })
        ),
      []
    )

    const loadMessages = useRestApi(getReceivedMessages, setMessagesResult)
    useEffect(() => {
      if (threads.currentPage > 0) {
        setThreads((state) => ({ ...state, loadingResult: Loading.of() }))
        loadMessages(threads.currentPage)
      }
    }, [loadMessages, threads.currentPage])

    const loadMoreThreads = useCallback(() => {
      if (threads.currentPage < threads.pages) {
        setThreads((state) => ({
          ...state,
          currentPage: state.currentPage + 1
        }))
      }
    }, [threads.currentPage, threads.pages])

    useEffect(() => {
      if (account.isSuccess) {
        setThreads((state) => ({ ...state, currentPage: 1 }))
      }
    }, [account])

    const [replyState, setReplyState] = useState<Result<void>>()
    const setReplyResponse = useCallback((res: Result<ReplyResponse>) => {
      setReplyState(res.map(() => undefined))
      if (res.isSuccess) {
        const {
          value: { message, threadId }
        } = res
        setThreads((state) => {
          const [[old], rest] = _.partition(
            state.threads,
            (t) => t.id === threadId
          )
          return {
            ...state,
            threads: [
              {
                ...old,
                messages: [...old.messages, message]
              },
              ...rest
            ]
          }
        })
      }
    }, [])
    const reply = useRestApi(replyToThread, setReplyResponse)
    const sendReply = useCallback(reply, [reply])

    const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>()
    const setUnreadResult = useCallback((res: Result<number>) => {
      if (res.isSuccess) {
        setUnreadMessagesCount(res.value)
      }
    }, [])
    const refreshUnreadMessagesCount = useRestApi(
      getUnreadMessagesCount,
      setUnreadResult
    )

    const selectThread = useCallback(
      (thread: MessageThread | undefined) => {
        if (!thread) {
          return setThreads((state) => ({
            ...state,
            selectedThread: undefined
          }))
        }

        const hasUnreadMessages =
          !!account?.isSuccess &&
          thread.messages.some(
            (m) => !m.readAt && m.senderId !== account.value.id
          )

        setThreads((state) => {
          return {
            ...state,
            threads: markMatchingThreadRead(state.threads, thread.id),
            selectedThread: thread.id
          }
        })

        if (hasUnreadMessages) {
          void markThreadRead(thread.id).then(() => {
            refreshUnreadMessagesCount()
          })
        }
      },
      [account, refreshUnreadMessagesCount]
    )

    const selectedThread = useMemo(
      () =>
        threads.selectedThread
          ? threads.threads.find((t) => t.id === threads.selectedThread)
          : undefined,
      [threads.selectedThread, threads.threads]
    )

    const value = useMemo(
      () => ({
        account,
        loadAccount,
        threads: threads.threads,
        threadLoadingResult: threads.loadingResult,
        loadMoreThreads,
        selectedThread,
        selectThread,
        replyState,
        sendReply,
        unreadMessagesCount,
        refreshUnreadMessagesCount
      }),
      [
        account,
        loadAccount,
        threads.threads,
        threads.loadingResult,
        selectedThread,
        loadMoreThreads,
        selectThread,
        replyState,
        sendReply,
        unreadMessagesCount,
        refreshUnreadMessagesCount
      ]
    )

    return (
      <MessageContext.Provider value={value}>
        {children}
      </MessageContext.Provider>
    )
  }
)
