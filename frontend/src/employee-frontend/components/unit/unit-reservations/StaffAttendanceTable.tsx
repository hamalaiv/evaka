// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import classNames from 'classnames'
import { isSameDay } from 'date-fns'
import { groupBy, sortBy } from 'lodash'
import React, { useMemo, useState, useEffect } from 'react'
import styled from 'styled-components'

import EllipsisMenu from 'employee-frontend/components/common/EllipsisMenu'
import { Result, Success } from 'lib-common/api'
import { OperationalDay } from 'lib-common/api-types/reservations'
import { formatTime } from 'lib-common/date'
import {
  Attendance,
  EmployeeAttendance,
  ExternalAttendance,
  UpdateStaffAttendanceRequest,
  UpdateExternalAttendanceRequest
} from 'lib-common/generated/api-types/attendance'
import { TimeRange } from 'lib-common/generated/api-types/reservations'
import LocalDate from 'lib-common/local-date'
import { validateTimeRange } from 'lib-common/reservations'
import { UUID } from 'lib-common/types'
import { Table, Tbody } from 'lib-components/layout/Table'
import { fontWeights } from 'lib-components/typography'
import { BaseProps } from 'lib-components/utils'
import { defaultMargins } from 'lib-components/white-space'

import { useTranslation } from '../../../state/i18n'
import { formatName } from '../../../utils'

import {
  AttendanceTableHeader,
  DayTd,
  DayTr,
  EditStateIndicator,
  NameTd,
  NameWrapper,
  StyledTd,
  TimeRangeEditor
} from './attendance-elements'
import { TimeRangeWithErrors } from './reservation-table-edit-state'

interface Props {
  operationalDays: OperationalDay[]
  staffAttendances: EmployeeAttendance[]
  extraAttendances: ExternalAttendance[]
  saveAttendance: (body: UpdateStaffAttendanceRequest) => Promise<Result<void>>
  saveExternalAttendance: (
    body: UpdateExternalAttendanceRequest
  ) => Promise<Result<void>>
}

export default React.memo(function StaffAttendanceTable({
  staffAttendances,
  extraAttendances,
  operationalDays,
  saveAttendance,
  saveExternalAttendance
}: Props) {
  const { i18n } = useTranslation()

  const staffRows = useMemo(
    () =>
      sortBy(
        staffAttendances.map(({ firstName, lastName, ...rest }) => ({
          ...rest,
          name: formatName(firstName.split(/\s/)[0], lastName, i18n, true)
        })),
        (attendance) => attendance.name
      ),
    [i18n, staffAttendances]
  )

  const extraRowsGroupedByName = useMemo(
    () =>
      sortBy(
        Object.entries(groupBy(extraAttendances, (a) => a.name)).map(
          ([name, attendances]) => ({
            name,
            attendances
          })
        ),
        (attendance) => attendance.name
      ),
    [extraAttendances]
  )

  return (
    <Table>
      <AttendanceTableHeader operationalDays={operationalDays} />
      <Tbody>
        {staffRows.map(({ attendances, employeeId, name }, index) => (
          <AttendanceRow
            key={`${employeeId}-${index}`}
            rowIndex={index}
            name={name}
            operationalDays={operationalDays}
            attendances={attendances}
            saveAttendance={saveAttendance}
          />
        ))}
        {extraRowsGroupedByName.map((row, index) => (
          <AttendanceRow
            key={`${row.name}-${index}`}
            rowIndex={index}
            name={row.name}
            operationalDays={operationalDays}
            attendances={row.attendances}
            saveAttendance={saveExternalAttendance}
          />
        ))}
      </Tbody>
    </Table>
  )
})

interface AttendanceRowProps extends BaseProps {
  rowIndex: number
  name: string
  operationalDays: OperationalDay[]
  attendances: Attendance[]
  saveAttendance?: (body: UpdateStaffAttendanceRequest) => Promise<Result<void>>
}

type TimeRangeWithErrorsAndIds = TimeRangeWithErrors & {
  id?: UUID
  groupId?: UUID
}
const emptyTimeRange: TimeRangeWithErrorsAndIds = {
  startTime: '',
  endTime: '',
  errors: {
    startTime: undefined,
    endTime: undefined
  },
  lastSavedState: {
    startTime: '',
    endTime: ''
  },
  id: undefined,
  groupId: undefined
}

const AttendanceRow = React.memo(function AttendanceRow({
  rowIndex,
  name,
  operationalDays,
  attendances,
  saveAttendance
}: AttendanceRowProps) {
  const [editing, setEditing] = useState<boolean>(false)
  const [values, setValues] = useState<
    Array<{ date: LocalDate; timeRanges: TimeRangeWithErrorsAndIds[] }>
  >([])
  const [saveRequestStatus, setSaveRequestStatus] = useState<Result<void>>(
    Success.of()
  )

  useEffect(
    () =>
      setValues(
        operationalDays.map((day) => {
          const attendancesOnDay = attendances.filter((a) =>
            isSameDay(a.arrived, day.date.toSystemTzDate())
          )
          return {
            date: day.date,
            timeRanges:
              attendancesOnDay.length > 0
                ? attendancesOnDay.map((attendance) => {
                    const startTime = formatTime(attendance.arrived)
                    const endTime = attendance.departed
                      ? formatTime(attendance.departed)
                      : ''
                    return {
                      id: attendance.id,
                      groupId: attendance.groupId,
                      startTime,
                      endTime,
                      errors: {
                        startTime: undefined,
                        endTime: undefined
                      },
                      lastSavedState: {
                        startTime,
                        endTime
                      }
                    }
                  })
                : [emptyTimeRange]
          }
        })
      ),
    [operationalDays, attendances]
  )

  const updateValue = (
    date: LocalDate,
    rangeIx: number,
    updatedRange: TimeRange
  ) => {
    setValues(
      values.map((val) => {
        return val.date === date
          ? {
              ...val,
              timeRanges: val.timeRanges.map((range, ix) => {
                return ix === rangeIx
                  ? {
                      ...range,
                      ...updatedRange,
                      errors: validateTimeRange(updatedRange)
                    }
                  : range
              })
            }
          : val
      })
    )
  }

  return (
    <DayTr>
      <NameTd partialRow={false} rowIndex={rowIndex}>
        <NameWrapper>{name}</NameWrapper>
      </NameTd>
      {values.map(({ date, timeRanges }) => (
        <DayTd
          key={date.formatIso()}
          className={classNames({ 'is-today': date.isToday() })}
          partialRow={false}
          rowIndex={rowIndex}
        >
          {timeRanges.map((range, rangeIx) => (
            <AttendanceCell key={`${date.formatIso()}-${rangeIx}`}>
              {editing && range.id ? (
                <TimeRangeEditor
                  timeRange={range}
                  update={(updatedValue) =>
                    updateValue(date, rangeIx, updatedValue)
                  }
                  save={() => {
                    if (saveAttendance && range.id && range.groupId) {
                      return saveAttendance({
                        attendanceId: range.id,
                        arrived: date.toSystemTzDateAtTime(range.startTime),
                        departed:
                          range.endTime !== ''
                            ? date.toSystemTzDateAtTime(range.endTime)
                            : null
                      }).then(setSaveRequestStatus)
                    }
                    return Promise.resolve()
                  }}
                />
              ) : (
                <>
                  <AttendanceTime>
                    {range.startTime === '' ? '–' : range.startTime}
                  </AttendanceTime>
                  <AttendanceTime>
                    {range.endTime === '' ? '–' : range.endTime}
                  </AttendanceTime>
                </>
              )}
            </AttendanceCell>
          ))}
        </DayTd>
      ))}
      <StyledTd partialRow={false} rowIndex={rowIndex} rowSpan={1}>
        {editing ? (
          <EditStateIndicator
            status={saveRequestStatus}
            stopEditing={() => setEditing(false)}
          />
        ) : (
          <RowMenu onEdit={() => setEditing(true)} />
        )}
      </StyledTd>
    </DayTr>
  )
})

const AttendanceCell = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-evenly;
  padding: ${defaultMargins.xs};
  gap: ${defaultMargins.xs};
`

const AttendanceTime = styled.span`
  font-weight: ${fontWeights.semibold};
`

type RowMenuProps = {
  onEdit: () => void
}
const RowMenu = React.memo(function RowMenu({ onEdit }: RowMenuProps) {
  const { i18n } = useTranslation()
  return (
    <EllipsisMenu
      items={[
        {
          id: 'edit-row',
          label: i18n.unit.attendanceReservations.editRow,
          onClick: onEdit
        }
      ]}
    />
  )
})