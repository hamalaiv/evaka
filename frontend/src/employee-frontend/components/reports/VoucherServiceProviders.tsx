// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useMemo, useState } from 'react'
import ReactSelect from 'react-select'
import styled from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import { range } from 'lodash'
import { faSearch } from 'lib-icons'
import { Container, ContentArea } from 'lib-components/layout/Container'
import Loader from 'lib-components/atoms/Loader'
import Title from 'lib-components/atoms/Title'
import { Th, Tr, Td, Thead, Tbody } from 'lib-components/layout/Table'
import { reactSelectStyles } from '../../components/common/Select'
import { useTranslation } from '../../state/i18n'
import { Loading, Result, Success } from 'lib-common/api'
import { VoucherServiceProviderReport } from '../../types/reports'
import {
  getVoucherServiceProvidersReport,
  VoucherServiceProvidersFilters
} from '../../api/reports'
import ReturnButton from 'lib-components/atoms/buttons/ReturnButton'
import InputField from 'lib-components/atoms/form/InputField'
import ReportDownload from '../../components/reports/ReportDownload'
import { formatDate } from '../../utils/date'
import { SelectOptionProps } from '../../components/common/Select'
import { fi } from 'date-fns/locale'
import { CareArea } from '../../types/unit'
import { getAreas } from '../../api/daycare'
import {
  FilterLabel,
  FilterRow,
  TableScrollable
} from '../../components/reports/common'
import { FlexRow } from '../../components/common/styled/containers'
import { formatCents } from '../../utils/money'
import { useSyncQueryParams } from '../../utils/useSyncQueryParams'
import { defaultMargins } from 'lib-components/white-space'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import colors from 'lib-customizations/common'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLockAlt } from 'lib-icons'
import HorizontalLine from 'lib-components/atoms/HorizontalLine'
import { UserContext } from 'employee-frontend/state/user'

const StyledTd = styled(Td)`
  white-space: nowrap;
`

const FilterWrapper = styled.div`
  width: 100%;
`

const LockedDate = styled(FixedSpaceRow)`
  float: right;
  color: ${colors.greyscale.dark};
  margin-bottom: ${defaultMargins.xs};
`

const monthOptions: SelectOptionProps[] = range(0, 12).map((num) => ({
  value: String(num + 1),
  label: String(fi.localize?.month(num))
}))

const minYear = new Date().getFullYear() - 4
// Max year is next year if current date is in December and current year otherwise
const maxYear = new Date().getFullYear() + (new Date().getMonth() == 11 ? 1 : 0)
const yearOptions: SelectOptionProps[] = range(maxYear, minYear - 1, -1).map(
  (num) => ({
    value: String(num),
    label: String(num)
  })
)

function getFilename(year: number, month: number, areaName: string) {
  const time = formatDate(new Date(year, month - 1, 1), 'yyyy-MM')
  return `${time}-${areaName}.csv`.replace(/ /g, '_')
}

function VoucherServiceProviders() {
  const location = useLocation()
  const { i18n } = useTranslation()
  const { roles } = useContext(UserContext)
  const [report, setReport] = useState<Result<VoucherServiceProviderReport>>(
    Success.of({ locked: null, rows: [] })
  )
  const [areas, setAreas] = useState<CareArea[]>([])
  const [filters, setFilters] = useState<VoucherServiceProvidersFilters>(() => {
    const { search } = location
    const queryParams = new URLSearchParams(search)
    const year = Number(queryParams.get('year'))
    const month = Number(queryParams.get('month'))

    return {
      year:
        year >= minYear && year <= maxYear ? year : new Date().getFullYear(),
      month: month >= 1 && month <= 12 ? month : new Date().getMonth() + 1,
      areaId: queryParams.get('areaId') ?? ''
    }
  })
  const [unitFilter, setUnitFilter] = useState<string>(() => {
    const { search } = location
    const queryParams = new URLSearchParams(search)
    return queryParams.get('unit') ?? ''
  })

  const memoizedFilters = useMemo(
    () => ({
      year: filters.year.toString(),
      month: filters.month.toString(),
      areaId: filters.areaId ?? '',
      unit: unitFilter
    }),
    [filters, unitFilter]
  )
  useSyncQueryParams(memoizedFilters)
  const query = new URLSearchParams(memoizedFilters).toString()

  useEffect(() => {
    void getAreas().then((res) => res.isSuccess && setAreas(res.value))
  }, [])

  const allAreas = !roles.find((r) =>
    ['ADMIN', 'FINANCE_ADMIN', 'DIRECTOR'].includes(r)
  )
  useEffect(() => {
    if (!allAreas && filters.areaId == '') return

    setReport(Loading.of())
    void getVoucherServiceProvidersReport({
      ...filters,
      areaId: filters.areaId || undefined
    }).then(setReport)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const months = monthOptions
  const years = yearOptions

  const mappedData = report
    .map((rs) =>
      rs.rows
        .filter(({ unit }) =>
          unit.name.toLowerCase().includes(unitFilter.toLowerCase())
        )
        .map(({ unit, childCount, monthlyPaymentSum }) => ({
          unitId: unit.id,
          unitName: unit.name,
          areaName: unit.areaName,
          childCount: childCount,
          sum: formatCents(monthlyPaymentSum, true)
        }))
    )
    .getOrElse(undefined)

  return (
    <Container>
      <ReturnButton label={i18n.common.goBack} data-qa={'return-button'} />
      <ContentArea opaque>
        <Title size={1}>{i18n.reports.voucherServiceProviders.title}</Title>
        <FilterRow>
          <FilterLabel>{i18n.reports.common.period}</FilterLabel>
          <FlexRow>
            <FilterWrapper data-qa="select-month">
              <ReactSelect
                options={months}
                value={months.find(
                  (opt) => opt.value === filters.month.toString()
                )}
                onChange={(value) => {
                  if (value && 'value' in value) {
                    const month = parseInt(value.value)
                    setFilters({ ...filters, month })
                  }
                }}
                styles={reactSelectStyles}
              />
            </FilterWrapper>
            <FilterWrapper data-qa="select-year">
              <ReactSelect
                options={years}
                value={years.find(
                  (opt) => opt.value === filters.year.toString()
                )}
                onChange={(value) => {
                  if (value && 'value' in value) {
                    const year = parseInt(value.value)
                    setFilters({ ...filters, year })
                  }
                }}
                styles={reactSelectStyles}
              />
            </FilterWrapper>
          </FlexRow>
        </FilterRow>
        {!allAreas && (
          <>
            <FilterRow>
              <FilterLabel>{i18n.reports.common.careAreaName}</FilterLabel>
              <FilterWrapper data-qa="select-area">
                <ReactSelect
                  options={[
                    ...areas.map((area) => ({
                      value: area.id,
                      label: area.name
                    }))
                  ]}
                  value={
                    areas
                      .filter(({ id }) => id === filters.areaId)
                      .map((area) => ({ value: area.id, label: area.name }))[0]
                  }
                  onChange={(value) => {
                    if (value && 'value' in value) {
                      setFilters({ ...filters, areaId: value.value })
                    }
                  }}
                  styles={reactSelectStyles}
                  placeholder={i18n.reports.common.careAreaName}
                />
              </FilterWrapper>
            </FilterRow>
            <FilterRow>
              <FilterLabel>{i18n.reports.common.unitName}</FilterLabel>
              <FilterWrapper data-qa="unit-name-input">
                <InputField
                  value={unitFilter}
                  onChange={(value) => setUnitFilter(value)}
                  placeholder={
                    i18n.reports.voucherServiceProviders.filters.unitPlaceholder
                  }
                  icon={faSearch}
                />
              </FilterWrapper>
            </FilterRow>
          </>
        )}

        {report.isSuccess && report.value.locked && (
          <LockedDate spacing="xs" alignItems="center">
            <FontAwesomeIcon icon={faLockAlt} />
            <span>
              {`${
                i18n.reports.voucherServiceProviders.locked
              }: ${report.value.locked.format()}`}
            </span>
          </LockedDate>
        )}

        <HorizontalLine slim />

        {report.isLoading && <Loader />}
        {report.isFailure && <span>{i18n.common.loadingFailed}</span>}
        {mappedData && (allAreas || filters.areaId) && (
          <>
            <ReportDownload
              data={mappedData}
              headers={[
                { label: i18n.reports.common.careAreaName, key: 'areaName' },
                { label: i18n.reports.common.unitName, key: 'unitName' },
                {
                  label: i18n.reports.voucherServiceProviders.childCount,
                  key: 'childCount'
                },
                {
                  label: i18n.reports.voucherServiceProviders.unitVoucherSum,
                  key: 'sum'
                }
              ]}
              filename={getFilename(
                filters.year,
                filters.month,
                areas.find((area) => area.id === filters.areaId)?.name ?? ''
              )}
              data-qa={'download-csv'}
            />
            <TableScrollable>
              <Thead>
                <Tr>
                  <Th>{i18n.reports.common.careAreaName}</Th>
                  <Th>{i18n.reports.common.unitName}</Th>
                  <Th>{i18n.reports.voucherServiceProviders.childCount}</Th>
                  <Th>{i18n.reports.voucherServiceProviders.unitVoucherSum}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {mappedData.map((row) => (
                  <Tr
                    key={row.unitId}
                    data-qa={row.unitId}
                    className={'reportRow'}
                  >
                    <StyledTd>{row.areaName}</StyledTd>
                    <StyledTd>
                      <Link
                        to={`/reports/voucher-service-providers/${row.unitId}?${query}`}
                      >
                        {row.unitName}
                      </Link>
                    </StyledTd>
                    <StyledTd data-qa={'child-count'}>
                      {row.childCount}
                    </StyledTd>
                    <StyledTd data-qa={'child-sum'}>{row.sum}</StyledTd>
                  </Tr>
                ))}
              </Tbody>
            </TableScrollable>
          </>
        )}
      </ContentArea>
    </Container>
  )
}

export default VoucherServiceProviders
