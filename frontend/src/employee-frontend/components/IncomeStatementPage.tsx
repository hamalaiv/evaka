import React from 'react'
import { RouteComponentProps } from 'react-router'
import { UUID } from '../types'
import { Translations, useTranslation } from '../state/i18n'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { H1, H2, H3, Label } from 'lib-components/typography'
import { defaultMargins, Gap } from 'lib-components/white-space'
import Container, { ContentArea } from 'lib-components/layout/Container'
import styled from 'styled-components'
import { useRestApi } from 'lib-common/utils/useRestApi'
import { getIncomeStatement } from '../api/income-statement'
import {
  Accountant,
  Entrepreneur,
  EstimatedIncome,
  Gross,
  Income,
  IncomeStatement
} from 'lib-common/api-types/incomeStatement'
import { combine, Loading, Result } from 'lib-common/api'
import Loader from 'lib-components/atoms/Loader'
import ErrorSegment from 'lib-components/atoms/state/ErrorSegment'
import HorizontalLine from 'lib-components/atoms/HorizontalLine'
import { Attachment } from 'lib-common/api-types/attachment'
import { PersonContext } from '../state/person'
import { getPersonDetails } from '../api/person'
import { getAttachmentBlob } from '../api/attachments'
import FileDownloadButton from 'lib-components/molecules/FileDownloadButton'

export default React.memo(function IncomeStatementPage({
  match
}: RouteComponentProps<{ personId: UUID; incomeStatementId: UUID }>) {
  const { personId, incomeStatementId } = match.params
  const { i18n } = useTranslation()
  const [incomeStatement, setIncomeStatement] = React.useState<
    Result<IncomeStatement>
  >(Loading.of())

  const { person, setPerson } = React.useContext(PersonContext)
  const loadPerson = useRestApi(getPersonDetails, setPerson)
  const loadIncomeStatement = useRestApi(getIncomeStatement, setIncomeStatement)

  React.useEffect(() => {
    loadPerson(personId)
    loadIncomeStatement(personId, incomeStatementId)
  }, [loadPerson, loadIncomeStatement, personId, incomeStatementId])

  return combine(person, incomeStatement).mapAll({
    loading() {
      return <Loader />
    },
    failure() {
      return <ErrorSegment />
    },
    success([person, incomeStatement]) {
      return (
        <Container>
          <Gap size="s" />
          <ContentArea opaque>
            <H1>{i18n.incomeStatement.title}</H1>
            <H2>
              {person.firstName} {person.lastName}
            </H2>
            <Row
              label={i18n.incomeStatement.startDate}
              value={incomeStatement.startDate.format()}
            />
            <Row
              label={i18n.incomeStatement.feeBasis}
              value={i18n.incomeStatement.statementTypes[incomeStatement.type]}
            />
            {incomeStatement.type === 'INCOME' && (
              <IncomeInfo incomeStatement={incomeStatement} />
            )}
          </ContentArea>
        </Container>
      )
    }
  })
})

function IncomeInfo({ incomeStatement }: { incomeStatement: Income }) {
  const { i18n } = useTranslation()
  const yesno = makeYesNo(i18n)
  return (
    <>
      {incomeStatement.gross && (
        <>
          <HorizontalLine />
          <GrossIncome gross={incomeStatement.gross} />
        </>
      )}
      {incomeStatement.entrepreneur && (
        <>
          <HorizontalLine />
          <EntrepreneurIncome entrepreneur={incomeStatement.entrepreneur} />
        </>
      )}
      <HorizontalLine />
      <H2>{i18n.incomeStatement.otherInfoTitle}</H2>
      <Row
        label={i18n.incomeStatement.student}
        value={yesno(incomeStatement.student)}
      />
      <Row
        label={i18n.incomeStatement.alimonyPayer}
        value={yesno(incomeStatement.alimonyPayer)}
      />
      <Row
        label={i18n.incomeStatement.otherInfo}
        value={incomeStatement.otherInfo || '-'}
      />
      <HorizontalLine />
      <Attachments attachments={incomeStatement.attachments} />
    </>
  )
}

function GrossIncome({ gross }: { gross: Gross }) {
  const { i18n } = useTranslation()
  return (
    <>
      <H2>{i18n.incomeStatement.grossTitle}</H2>
      <Row
        label={i18n.incomeStatement.incomeSource}
        value={
          gross.incomeSource === 'INCOMES_REGISTER'
            ? i18n.incomeStatement.incomesRegister
            : i18n.incomeStatement.attachmentsAndKela
        }
      />
      {gross.estimatedIncome && (
        <Row
          label={i18n.incomeStatement.grossEstimatedIncome}
          value={<EstimatedIncome estimatedIncome={gross.estimatedIncome} />}
        />
      )}
      <Row
        label={i18n.incomeStatement.otherIncome}
        value={
          <>
            {gross.otherIncome.map((incomeType) => (
              <Item key={incomeType}>
                {i18n.incomeStatement.otherIncomeTypes[incomeType]}
              </Item>
            ))}
          </>
        }
      />
    </>
  )
}

function EstimatedIncome({
  estimatedIncome
}: {
  estimatedIncome: EstimatedIncome
}) {
  const { i18n } = useTranslation()
  return (
    <FixedSpaceRow>
      <FixedSpaceColumn>
        <Label>{i18n.incomeStatement.estimatedMonthlyIncome}</Label>
        <div>{estimatedIncome.estimatedMonthlyIncome}</div>
      </FixedSpaceColumn>
      <FixedSpaceColumn>
        <Label>{i18n.incomeStatement.timeRange}</Label>
        <div>
          {estimatedIncome.incomeStartDate.format()} -{' '}
          {estimatedIncome.incomeEndDate?.format()}
        </div>
      </FixedSpaceColumn>
    </FixedSpaceRow>
  )
}

function EntrepreneurIncome({ entrepreneur }: { entrepreneur: Entrepreneur }) {
  const { i18n } = useTranslation()
  const yesno = makeYesNo(i18n)

  return (
    <>
      <H2>{i18n.incomeStatement.entrepreneurTitle}</H2>
      <Row
        label={i18n.incomeStatement.fullTimeLabel}
        value={
          entrepreneur.fullTime
            ? i18n.incomeStatement.fullTime
            : i18n.incomeStatement.partTime
        }
      />
      <Row
        label={i18n.incomeStatement.startOfEntrepreneurship}
        value={entrepreneur.startOfEntrepreneurship.format()}
      />
      <Row
        label={i18n.incomeStatement.spouseWorksInCompany}
        value={yesno(entrepreneur.spouseWorksInCompany)}
      />
      <Row
        label={i18n.incomeStatement.startupGrant}
        value={yesno(entrepreneur.startupGrant)}
      />
      <Row
        label={i18n.incomeStatement.kelaInspectionConsent}
        value={yesno(true)}
      />
      <H3>{i18n.incomeStatement.companyInfoTitle}</H3>
      <Row
        label={i18n.incomeStatement.companyType}
        value={
          <>
            {entrepreneur.selfEmployed && (
              <Item>{i18n.incomeStatement.selfEmployed}</Item>
            )}
            {entrepreneur.limitedCompany && (
              <Item>{i18n.incomeStatement.limitedCompany}</Item>
            )}
            {entrepreneur.partnership && (
              <Item>{i18n.incomeStatement.partnership}</Item>
            )}
            {entrepreneur.lightEntrepreneur && (
              <Item>{i18n.incomeStatement.lightEntrepreneur}</Item>
            )}
          </>
        }
      />
      <Row label={i18n.incomeStatement.incomeSource} value="" />
      {entrepreneur.selfEmployed && (
        <Row
          light
          label={i18n.incomeStatement.selfEmployed}
          value={
            <>
              {entrepreneur.selfEmployed.attachments && (
                <Item>{i18n.incomeStatement.selfEmployedAttachments}</Item>
              )}
              {entrepreneur.selfEmployed.estimatedIncome && (
                <EstimatedIncome
                  estimatedIncome={entrepreneur.selfEmployed.estimatedIncome}
                />
              )}
            </>
          }
        />
      )}
      {entrepreneur.limitedCompany && (
        <Row
          light
          label={i18n.incomeStatement.limitedCompany}
          value={
            entrepreneur.limitedCompany.incomeSource === 'INCOMES_REGISTER'
              ? i18n.incomeStatement.limitedCompanyIncomesRegister
              : i18n.incomeStatement.limitedCompanyAttachments
          }
        />
      )}
      {entrepreneur.partnership && (
        <Row
          light
          label={i18n.incomeStatement.partnership}
          value={i18n.incomeStatement.attachments}
        />
      )}
      {entrepreneur.lightEntrepreneur && (
        <Row
          light
          label={i18n.incomeStatement.lightEntrepreneur}
          value={i18n.incomeStatement.attachments}
        />
      )}
      {entrepreneur.accountant && (
        <AccountantInfo accountant={entrepreneur.accountant} />
      )}
    </>
  )
}

function AccountantInfo({ accountant }: { accountant: Accountant }) {
  const { i18n } = useTranslation()
  return (
    <>
      <H3>{i18n.incomeStatement.accountantTitle}</H3>
      <Row label={i18n.incomeStatement.accountant} value={accountant.name} />
      <Row label={i18n.incomeStatement.email} value={accountant.email} />
      <Row label={i18n.incomeStatement.phone} value={accountant.phone} />
      <Row label={i18n.incomeStatement.address} value={accountant.address} />
    </>
  )
}

function Attachments({ attachments }: { attachments: Attachment[] }) {
  const { i18n } = useTranslation()
  return (
    <>
      <H2>{i18n.incomeStatement.attachmentsTitle}</H2>
      {attachments.length === 0 ? (
        <p>{i18n.incomeStatement.noAttachments}</p>
      ) : (
        <Row
          label={`${i18n.incomeStatement.attachments}:`}
          value={attachments.map((attachment) => (
            <FileDownloadButton
              key={attachment.id}
              file={attachment}
              fileFetchFn={getAttachmentBlob}
              onFileUnavailable={() => undefined}
            />
          ))}
        />
      )}
    </>
  )
}

function Row({
  label,
  light,
  value
}: {
  label: string
  light?: boolean
  value: React.ReactNode
}) {
  return (
    <>
      <FixedSpaceRow>
        <LabelColumn light={light}>{label}</LabelColumn>
        <div>{value}</div>
      </FixedSpaceRow>
      <Gap size="s" />
    </>
  )
}

function makeYesNo(i18n: Translations) {
  return (value: boolean): string => {
    return value ? i18n.common.yes : i18n.common.no
  }
}

const LabelColumn = styled(Label)<{ light?: boolean }>`
  flex: 0 0 auto;
  width: 250px;
  ${(p) => (p.light ? 'font-weight: 400;' : '')}
`

const Item = styled.div`
  margin-bottom: ${defaultMargins.xs};
`
