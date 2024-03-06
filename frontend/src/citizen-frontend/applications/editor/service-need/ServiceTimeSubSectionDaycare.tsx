// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo } from 'react'
import styled from 'styled-components'

import { Result } from 'lib-common/api'
import HelsinkiDateTime from 'lib-common/helsinki-date-time'
import { UUID } from 'lib-common/types'
import useRouteParams from 'lib-common/useRouteParams'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import Radio from 'lib-components/atoms/form/Radio'
import TimeInput from 'lib-components/atoms/form/TimeInput'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import ExpandingInfo from 'lib-components/molecules/ExpandingInfo'
import FileUpload from 'lib-components/molecules/FileUpload'
import { H3, Label, P } from 'lib-components/typography'
import { defaultMargins, Gap } from 'lib-components/white-space'
import { featureFlags } from 'lib-customizations/citizen'

import {
  deleteAttachment,
  getAttachmentUrl,
  saveApplicationAttachment
} from '../../../attachments'
import { errorToInputInfo } from '../../../input-info-helper'
import { useLang, useTranslation } from '../../../localization'

import { ServiceNeedSectionProps } from './ServiceNeedSection'

const Hyphenbox = styled.div`
  padding-top: 36px;
`

type ServiceTimeSubSectionProps = Omit<ServiceNeedSectionProps, 'type'>

const applicationType = 'DAYCARE'

export default React.memo(function ServiceTimeSubSectionDaycare({
  formData,
  updateFormData,
  errors,
  verificationRequested,
  serviceNeedOptions
}: ServiceTimeSubSectionProps) {
  const [lang] = useLang()
  const t = useTranslation()
  const { applicationId } = useRouteParams(['applicationId'])

  const fullTimeOptions = useMemo(
    () =>
      serviceNeedOptions?.filter(
        (opt) => opt.validPlacementType === 'DAYCARE'
      ) ?? [],
    [serviceNeedOptions]
  )
  const partTimeOptions = useMemo(
    () =>
      serviceNeedOptions?.filter(
        (opt) => opt.validPlacementType === 'DAYCARE_PART_TIME'
      ) ?? [],
    [serviceNeedOptions]
  )

  const updateServiceNeed = (partTime: boolean) => {
    let serviceNeedOption = formData.serviceNeedOption
    if (partTime && partTimeOptions.length > 0) {
      serviceNeedOption = partTimeOptions[0]
    } else if (!partTime && fullTimeOptions.length > 0) {
      serviceNeedOption = fullTimeOptions[0]
    }
    updateFormData({
      partTime,
      serviceNeedOption
    })
  }

  const uploadExtendedCareAttachment = (
    file: File,
    onUploadProgress: (percentage: number) => void
  ): Promise<Result<UUID>> =>
    saveApplicationAttachment(
      applicationId,
      file,
      'EXTENDED_CARE',
      onUploadProgress
    ).then((result) => {
      result.isSuccess &&
        updateFormData({
          shiftCareAttachments: [
            ...formData.shiftCareAttachments,
            {
              id: result.value,
              name: file.name,
              contentType: file.type,
              updated: HelsinkiDateTime.now(),
              receivedAt: HelsinkiDateTime.now(),
              type: 'EXTENDED_CARE',
              uploadedByEmployee: null,
              uploadedByPerson: null
            }
          ]
        })
      return result
    })

  const deleteExtendedCareAttachment = (id: UUID) =>
    deleteAttachment(id).then((result) => {
      result.isSuccess &&
        updateFormData({
          shiftCareAttachments: formData.shiftCareAttachments.filter(
            (file) => file.id !== id
          )
        })
      return result
    })

  function renderServiceNeedSelection() {
    return (
      <FixedSpaceColumn>
        <Radio
          id="service-need-part-time-true"
          label={t.applications.editor.serviceNeed.partTime.true}
          checked={formData.partTime}
          data-qa="partTime-input-true"
          onChange={() =>
            updateFormData({
              partTime: true,
              serviceNeedOption: partTimeOptions[0] ?? null
            })
          }
        />
        {formData.partTime && partTimeOptions.length > 0 && (
          <SubRadios>
            <FixedSpaceColumn spacing="xs">
              {partTimeOptions.map((opt) => (
                <Radio
                  key={opt.id}
                  label={
                    (lang === 'fi' && opt.nameFi) ||
                    (lang === 'sv' && opt.nameSv) ||
                    (lang === 'en' && opt.nameEn) ||
                    opt.id
                  }
                  checked={formData.serviceNeedOption?.id === opt.id}
                  onChange={() => updateFormData({ serviceNeedOption: opt })}
                  data-qa={`part-time-option-${opt.id}`}
                />
              ))}
            </FixedSpaceColumn>
          </SubRadios>
        )}
        <Radio
          id="service-need-part-time-false"
          label={t.applications.editor.serviceNeed.partTime.false}
          checked={!formData.partTime}
          data-qa="partTime-input-false"
          onChange={() => updateServiceNeed(false)}
        />
        {!formData.partTime && fullTimeOptions.length > 0 && (
          <SubRadios>
            <FixedSpaceColumn spacing="xs">
              {fullTimeOptions.map((opt) => (
                <Radio
                  key={opt.id}
                  label={
                    (lang === 'fi' && opt.nameFi) ||
                    (lang === 'sv' && opt.nameSv) ||
                    (lang === 'en' && opt.nameEn) ||
                    opt.id
                  }
                  checked={formData.serviceNeedOption?.id === opt.id}
                  onChange={() => updateFormData({ serviceNeedOption: opt })}
                  data-qa={`full-time-option-${opt.id}`}
                />
              ))}
            </FixedSpaceColumn>
          </SubRadios>
        )}
      </FixedSpaceColumn>
    )
  }

  function renderServiceNeedDailyTimeSelection() {
    return (
      featureFlags.daycareApplication.dailyTimes && (
        <>
          <ExpandingInfo
            info={
              t.applications.editor.serviceNeed.dailyTime.instructions[
                applicationType
              ]
            }
            inlineChildren
          >
            <Label>
              {t.applications.editor.serviceNeed.dailyTime
                .usualArrivalAndDeparture[applicationType] + ' *'}
            </Label>
          </ExpandingInfo>

          <Gap size="s" />

          <FixedSpaceRow spacing="s">
            <FixedSpaceColumn spacing="xs">
              <Label htmlFor="daily-time-starts">
                {t.applications.editor.serviceNeed.dailyTime.starts}
              </Label>
              <TimeInput
                id="daily-time-starts"
                value={formData.startTime}
                data-qa="startTime-input"
                onChange={(value) => updateFormData({ startTime: value })}
                info={errorToInputInfo(errors.startTime, t.validationErrors)}
                hideErrorsBeforeTouched={!verificationRequested}
              />
            </FixedSpaceColumn>

            <Hyphenbox>–</Hyphenbox>

            <FixedSpaceColumn spacing="xs">
              <Label htmlFor="daily-time-ends">
                {t.applications.editor.serviceNeed.dailyTime.ends}
              </Label>
              <TimeInput
                id="daily-time-ends"
                value={formData.endTime}
                data-qa="endTime-input"
                onChange={(value) => updateFormData({ endTime: value })}
                info={errorToInputInfo(errors.endTime, t.validationErrors)}
                hideErrorsBeforeTouched={!verificationRequested}
              />
            </FixedSpaceColumn>
          </FixedSpaceRow>
        </>
      )
    )
  }

  return (
    <>
      <H3>
        {t.applications.editor.serviceNeed.dailyTime.label[applicationType]}
      </H3>

      <Gap size="s" />

      {renderServiceNeedSelection()}

      <Gap size="m" />

      {renderServiceNeedDailyTimeSelection()}

      <Gap size="L" />

      <ExpandingInfo
        data-qa="shiftcare-instructions"
        info={t.applications.editor.serviceNeed.shiftCare.instructions}
        margin="xs"
      >
        <Checkbox
          checked={formData.shiftCare}
          data-qa="shiftCare-input"
          label={t.applications.editor.serviceNeed.shiftCare.label}
          onChange={(checked) =>
            updateFormData({
              shiftCare: checked
            })
          }
        />
      </ExpandingInfo>

      {formData.shiftCare && (
        <>
          <Gap size="s" />

          <P fitted data-qa="shiftcare-attachments-message">
            {
              t.applications.editor.serviceNeed.shiftCare.attachmentsMessage
                .text
            }
          </P>

          <Gap size="s" />

          <strong>
            {
              t.applications.editor.serviceNeed.shiftCare.attachmentsMessage
                .subtitle
            }
          </strong>

          <Gap size="s" />

          <FileUpload
            files={formData.shiftCareAttachments}
            onUpload={uploadExtendedCareAttachment}
            onDelete={deleteExtendedCareAttachment}
            getDownloadUrl={getAttachmentUrl}
          />
        </>
      )}
    </>
  )
})

const SubRadios = styled.div`
  margin-bottom: ${defaultMargins.s};
  margin-left: ${defaultMargins.XL};
`
