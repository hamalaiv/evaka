// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { renderResult } from 'employee-frontend/components/async-rendering'
import { Child } from 'lib-common/api-types/reservations'
import FiniteDateRange from 'lib-common/finite-date-range'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'
import { useApiState } from 'lib-common/utils/useRestApi'
import IconButton from 'lib-components/atoms/buttons/IconButton'
import { FixedSpaceColumn } from 'lib-components/layout/flex-helpers'
import { H3 } from 'lib-components/typography'
import { defaultMargins, Gap } from 'lib-components/white-space'
import colors from 'lib-customizations/common'
import { faChevronLeft, faChevronRight } from 'lib-icons'
import { getUnitAttendanceReservations } from '../../../api/unit'
import ReservationModalSingleChild from './ReservationModalSingleChild'
import ReservationsTable from './ReservationsTable'

interface Props {
  unitId: UUID
  groupId: UUID | 'no-group'
  selectedDate: LocalDate
  setSelectedDate: (date: LocalDate) => void
  isShiftCareUnit: boolean
  operationalDays: number[]
}

export default React.memo(function UnitAttendanceReservationsView({
  unitId,
  groupId,
  selectedDate,
  setSelectedDate,
  isShiftCareUnit,
  operationalDays
}: Props) {
  const dateRange = useMemo(
    () => getWeekDateRange(selectedDate),
    [selectedDate]
  )

  const [reservations, reload] = useApiState(
    () => getUnitAttendanceReservations(unitId, dateRange),
    [unitId, dateRange]
  )

  const [creatingReservationChild, setCreatingReservationChild] =
    useState<Child | null>(null)

  return (
    <>
      {renderResult(reservations, (data) => {
        const selectedGroup = data.groups.find((g) => g.group.id === groupId)

        return (
          <>
            {creatingReservationChild && (
              <ReservationModalSingleChild
                child={creatingReservationChild}
                onReload={reload}
                onClose={() => setCreatingReservationChild(null)}
                isShiftCareUnit={isShiftCareUnit}
                operationalDays={operationalDays}
              />
            )}

            <WeekPicker>
              <WeekPickerButton
                icon={faChevronLeft}
                onClick={() => setSelectedDate(selectedDate.addDays(-7))}
                size="s"
              />
              <H3 noMargin>
                {`${dateRange.start.format(
                  'dd.MM.'
                )} - ${dateRange.end.format()}`}
              </H3>
              <WeekPickerButton
                icon={faChevronRight}
                onClick={() => setSelectedDate(selectedDate.addDays(7))}
                size="s"
              />
            </WeekPicker>
            <Gap size="s" />
            <FixedSpaceColumn spacing="L">
              {selectedGroup && (
                <ReservationsTable
                  operationalDays={data.operationalDays}
                  reservations={selectedGroup.children}
                  onMakeReservationForChild={setCreatingReservationChild}
                />
              )}
              {groupId === 'no-group' && (
                <ReservationsTable
                  operationalDays={data.operationalDays}
                  reservations={data.ungrouped}
                  onMakeReservationForChild={setCreatingReservationChild}
                />
              )}
            </FixedSpaceColumn>
          </>
        )
      })}
      <Gap size="L" />
    </>
  )
})

const getWeekDateRange = (date: LocalDate) =>
  new FiniteDateRange(date.startOfWeek(), date.startOfWeek().addDays(6))

const WeekPicker = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
`

const WeekPickerButton = styled(IconButton)`
  margin: 0 ${defaultMargins.s};
  color: ${colors.greyscale.dark};
`
