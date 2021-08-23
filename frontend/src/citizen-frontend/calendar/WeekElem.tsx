import React from 'react'
import styled from 'styled-components'
import colors from 'lib-customizations/common'
import { DailyReservationData } from './api'
import DayElem from './DayElem'
import { useTranslation } from '../localization'
import { defaultMargins } from 'lib-components/white-space'

export interface WeekProps {
  weekNumber: number
  dailyReservations: DailyReservationData[]
}

export default React.memo(function WeekElem({
  weekNumber,
  dailyReservations
}: WeekProps) {
  const i18n = useTranslation()
  return (
    <div>
      <WeekDiv>
        {i18n.common.datetime.weekShort} {weekNumber}
      </WeekDiv>
      <div>
        {dailyReservations.map((d) => (
          <DayElem dailyReservations={d} key={d.date.formatIso()} />
        ))}
      </div>
    </div>
  )
})

const WeekDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${defaultMargins.s} 0 ${defaultMargins.xs};
  background-color: ${colors.brandEspoo.espooTurquoiseLight};
  color: ${colors.blues.dark};
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid ${colors.greyscale.lighter};
`
