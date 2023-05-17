// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useMemo } from 'react'

import {
  boolean,
  localOpenEndedDateRange,
  string
} from 'lib-common/form/fields'
import { object, oneOf, required, validated } from 'lib-common/form/form'
import { useForm, useFormFields } from 'lib-common/form/hooks'
import { nonEmpty } from 'lib-common/form/validators'
import {
  DocumentLanguage,
  DocumentType
} from 'lib-common/generated/api-types/document'
import { useMutationResult } from 'lib-common/query'
import { SelectF } from 'lib-components/atoms/dropdowns/Select'
import { CheckboxF } from 'lib-components/atoms/form/Checkbox'
import { InputFieldF } from 'lib-components/atoms/form/InputField'
import { DateRangePickerF } from 'lib-components/molecules/date-picker/DateRangePicker'
import { AsyncFormModal } from 'lib-components/molecules/modals/FormModal'
import { Label } from 'lib-components/typography'
import { Gap } from 'lib-components/white-space'

import { useTranslation } from '../../../state/i18n'
import { createDocumentTemplateMutation } from '../queries'

const documentTemplateForm = object({
  name: validated(string(), nonEmpty),
  type: required(oneOf<DocumentType>()),
  language: required(oneOf<DocumentLanguage>()),
  confidential: boolean(),
  legalBasis: string(),
  validity: required(localOpenEndedDateRange)
})

interface Props {
  onClose: () => void
}

export default React.memo(function TemplateModal({ onClose }: Props) {
  const { i18n, lang } = useTranslation()

  const { mutateAsync: createDocumentTemplate } = useMutationResult(
    createDocumentTemplateMutation
  )

  const typeOptions = useMemo(
    () =>
      ['PEDAGOGICAL_REPORT' as const, 'PEDAGOGICAL_ASSESSMENT' as const].map(
        (option) => ({
          domValue: option,
          value: option,
          label: i18n.documentTemplates.documentTypes[option]
        })
      ),
    [i18n.documentTemplates]
  )

  const languageOptions = useMemo(
    () =>
      ['FI' as const, 'SV' as const].map((option) => ({
        domValue: option,
        value: option,
        label: i18n.documentTemplates.languages[option]
      })),
    [i18n.documentTemplates]
  )

  const form = useForm(
    documentTemplateForm,
    () => ({
      name: '',
      type: {
        domValue: 'PEDAGOGICAL_ASSESSMENT',
        options: typeOptions
      },
      language: {
        domValue: 'FI',
        options: languageOptions
      },
      confidential: true,
      legalBasis: '',
      validity: {
        startDate: null,
        endDate: null
      }
    }),
    {
      ...i18n.validationErrors
    }
  )

  const { name, type, language, confidential, legalBasis, validity } =
    useFormFields(form)

  return (
    <AsyncFormModal
      title={i18n.documentTemplates.templateModal.title}
      resolveAction={() => createDocumentTemplate(form.value())}
      onSuccess={onClose}
      resolveLabel={i18n.common.confirm}
      rejectAction={onClose}
      rejectLabel={i18n.common.cancel}
      resolveDisabled={!form.isValid()}
    >
      <Label>{i18n.documentTemplates.templateModal.name}</Label>
      <InputFieldF bind={name} hideErrorsBeforeTouched />
      <Gap />
      <Label>{i18n.documentTemplates.templateModal.validity}</Label>
      <DateRangePickerF bind={validity} locale={lang} />
      <Gap />
      <Label>{i18n.documentTemplates.templateModal.type}</Label>
      <SelectF bind={type} />
      <Gap />
      <Label>{i18n.documentTemplates.templateModal.language}</Label>
      <SelectF bind={language} />
      <Gap />
      <Label>{i18n.documentTemplates.templateModal.legalBasis}</Label>
      <InputFieldF bind={legalBasis} hideErrorsBeforeTouched />
      <Gap />
      <CheckboxF
        bind={confidential}
        label={i18n.documentTemplates.templateModal.confidential}
      />
    </AsyncFormModal>
  )
})