// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { createContext, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Loading, Result } from 'lib-common/api'
import { StaffAttendanceResponse } from 'lib-common/generated/api-types/attendance'
import { UUID } from 'lib-common/types'
import { idleTracker } from 'lib-common/utils/idleTracker'
import { useApiState } from 'lib-common/utils/useRestApi'
import { client } from '../api/client'
import { getUnitStaffAttendances } from '../api/realtimeStaffAttendances'

interface StaffAttendanceState {
  staffAttendanceResponse: Result<StaffAttendanceResponse>
  reloadStaffAttendance: () => void
}

const defaultState: StaffAttendanceState = {
  staffAttendanceResponse: Loading.of(),
  reloadStaffAttendance: () => undefined
}

export const StaffAttendanceContext =
  createContext<StaffAttendanceState>(defaultState)

export const StaffAttendanceContextProvider = React.memo(
  function StaffAttendanceContextProvider({
    children
  }: {
    children: JSX.Element
  }) {
    const { unitId } = useParams<{ unitId: UUID }>()

    const [staffAttendanceResponse, reloadStaffAttendance] = useApiState(
      () => getUnitStaffAttendances(unitId),
      [unitId]
    )

    useEffect(
      () =>
        idleTracker(client, reloadStaffAttendance, { thresholdInMinutes: 5 }),
      [reloadStaffAttendance]
    )

    const value = useMemo(
      () => ({
        staffAttendanceResponse,
        reloadStaffAttendance
      }),
      [staffAttendanceResponse, reloadStaffAttendance]
    )

    return (
      <StaffAttendanceContext.Provider value={value}>
        {children}
      </StaffAttendanceContext.Provider>
    )
  }
)
