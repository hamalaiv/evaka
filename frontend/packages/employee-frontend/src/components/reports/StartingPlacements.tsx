// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { fi } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import {
  Container,
  ContentArea,
  Loader,
  Table,
  Title
} from '~components/shared/alpha'
import ReturnButton from 'components/shared/atoms/buttons/ReturnButton'
import ReportDownload from '~components/reports/ReportDownload'
import {
  FilterLabel,
  FilterRow,
  RowCountInfo,
  TableScrollable
} from '~components/reports/common'
import { useTranslation, Lang, Translations } from '~state/i18n'
import { isFailure, isLoading, isSuccess, Loading, Result, Success } from '~api'
import {
  getStartingPlacementsReport,
  PlacementsReportFilters
} from '~api/reports'
import { StartingPlacementsRow } from '~types/reports'
import LocalDate from '@evaka/lib-common/src/local-date'
import SelectWithIcon from 'components/common/Select'
import { FlexRow } from 'components/common/styled/containers'

const StyledTd = styled(Table.Td)`
  white-space: nowrap;
`

const locales = {
  fi: fi
}

function monthOptions(lang: Lang) {
  const locale = locales[lang]
  const monthOptions = []
  for (let i = 1; i <= 12; i++) {
    monthOptions.push({
      id: i.toString(),
      label: String(locale.localize?.month(i - 1))
    })
  }
  return monthOptions
}

function yearOptions() {
  const currentYear = LocalDate.today().year
  const yearOptions = []
  for (let year = currentYear; year > currentYear - 5; year--) {
    yearOptions.push({
      id: year.toString(),
      label: year.toString()
    })
  }
  return yearOptions
}

function getFilename(i18n: Translations, year: number, month: number) {
  const time = LocalDate.of(year, month, 1).format('yyyy-MM')
  return `${i18n.reports.startingPlacements.reportFileName}-${time}.csv`
}

const StartingPlacements = React.memo(function StartingPlacements() {
  const { i18n, lang } = useTranslation()
  const [rows, setRows] = useState<Result<StartingPlacementsRow[]>>(Success([]))
  const today = LocalDate.today()
  const [filters, setFilters] = useState<PlacementsReportFilters>({
    year: today.year,
    month: today.month
  })

  useEffect(() => {
    setRows(Loading())
    void getStartingPlacementsReport(filters).then(setRows)
  }, [filters])

  return (
    <Container>
      <ReturnButton />
      <ContentArea opaque>
        <Title size={1}>{i18n.reports.startingPlacements.title}</Title>
        <FilterRow>
          <FilterLabel>{i18n.reports.common.period}</FilterLabel>
          <FlexRow>
            <SelectWithIcon
              options={monthOptions(lang)}
              value={filters.month.toString()}
              onChange={(e) => {
                const month = parseInt(e.target.value)
                setFilters({ ...filters, month })
              }}
            />
            <SelectWithIcon
              options={yearOptions()}
              value={filters.year.toString()}
              onChange={(e) => {
                const year = parseInt(e.target.value)
                setFilters({ ...filters, year })
              }}
            />
          </FlexRow>
        </FilterRow>
        <ReportDownload
          data={
            isSuccess(rows)
              ? rows.data.map((row) => ({
                  firstName: row.firstName,
                  lastName: row.lastName,
                  ssn: row.ssn ?? row.dateOfBirth.format(),
                  placementStart: row.placementStart.format()
                }))
              : []
          }
          headers={[
            { label: 'Lapsen sukunimi', key: 'lastName' },
            { label: 'Lapsen etunimi', key: 'firstName' },
            { label: 'Henkilötunnus', key: 'ssn' },
            { label: 'Aloittaa varhaiskasvatuksessa', key: 'placementStart' }
          ]}
          filename={getFilename(i18n, filters.year, filters.month)}
        />
        <TableScrollable>
          <Table.Head>
            <Table.Row>
              <Table.Th>{i18n.reports.common.childName}</Table.Th>
              <Table.Th>{i18n.reports.startingPlacements.ssn}</Table.Th>
              <Table.Th>
                {i18n.reports.startingPlacements.placementStart}
              </Table.Th>
            </Table.Row>
          </Table.Head>
          {isSuccess(rows) && (
            <Table.Body>
              {rows.data.map((row) => (
                <Table.Row key={row.childId}>
                  <StyledTd>
                    <Link
                      to={`/child-information/${row.childId}`}
                    >{`${row.lastName} ${row.firstName}`}</Link>
                  </StyledTd>
                  <StyledTd>{row.ssn ?? row.dateOfBirth.format()}</StyledTd>
                  <StyledTd>{row.placementStart.format()}</StyledTd>
                </Table.Row>
              ))}
            </Table.Body>
          )}
        </TableScrollable>
        {isSuccess(rows) && <RowCountInfo rowCount={rows.data.length} />}
        {isLoading(rows) && <Loader />}
        {isFailure(rows) && <span>{i18n.common.loadingFailed}</span>}
      </ContentArea>
    </Container>
  )
})

export default StartingPlacements
