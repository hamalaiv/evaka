// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { v4 as uuidv4 } from 'uuid'

import { string } from 'lib-common/form/fields'
import { mapped, object, validated, value } from 'lib-common/form/form'
import { BoundForm, useForm, useFormFields } from 'lib-common/form/hooks'
import { StateOf } from 'lib-common/form/types'
import { nonEmpty } from 'lib-common/form/validators'
import {
  AnsweredQuestion,
  Question
} from 'lib-common/generated/api-types/document'
import { CheckboxF } from 'lib-components/atoms/form/Checkbox'
import { InputFieldF } from 'lib-components/atoms/form/InputField'
import { FixedSpaceColumn } from 'lib-components/layout/flex-helpers'
import { Label } from 'lib-components/typography'

import { useTranslation } from '../../../state/i18n'

import {
  DocumentQuestionDescriptor,
  QuestionType,
  TemplateQuestionDescriptor
} from './types'

const questionType: QuestionType = 'CHECKBOX'

type ApiQuestion = Question.CheckboxQuestion

const templateForm = object({
  id: validated(string(), nonEmpty),
  label: validated(string(), nonEmpty)
})

type TemplateForm = typeof templateForm

const getTemplateInitialValues = (
  question?: ApiQuestion
): StateOf<TemplateForm> => ({
  id: question?.id ?? uuidv4(),
  label: question?.label ?? ''
})

type Answer = boolean

const getAnswerInitialValue = (): Answer => false

const questionForm = mapped(
  object({
    template: templateForm,
    answer: value<Answer>()
  }),
  (output): AnsweredQuestion => ({
    questionId: output.template.id,
    answer: output.answer,
    type: questionType
  })
)

type QuestionForm = typeof questionForm

const View = React.memo(function View({
  bind,
  readOnly
}: {
  bind: BoundForm<QuestionForm>
  readOnly: boolean
}) {
  const { template, answer } = useFormFields(bind)
  const { label } = useFormFields(template)
  return <CheckboxF bind={answer} label={label.state} disabled={readOnly} />
})

const Preview = React.memo(function Preview({
  bind
}: {
  bind: BoundForm<TemplateForm>
}) {
  const { i18n } = useTranslation()
  const mockBind = useForm(
    questionForm,
    () => ({
      template: bind.state,
      answer: getAnswerInitialValue()
    }),
    i18n.validationErrors
  )

  return <View bind={mockBind} readOnly={false} />
})

const TemplateView = React.memo(function TemplateView({
  bind
}: {
  bind: BoundForm<TemplateForm>
}) {
  const { i18n } = useTranslation()
  const { label } = useFormFields(bind)

  return (
    <FixedSpaceColumn>
      <Label>{i18n.documentTemplates.templateQuestions.label}</Label>
      <InputFieldF bind={label} hideErrorsBeforeTouched />
    </FixedSpaceColumn>
  )
})

const templateQuestionDescriptor: TemplateQuestionDescriptor<
  typeof questionType,
  typeof templateForm,
  ApiQuestion
> = {
  form: templateForm,
  getInitialState: (question?: ApiQuestion) => ({
    branch: questionType,
    state: getTemplateInitialValues(question)
  }),
  Component: TemplateView,
  PreviewComponent: Preview
}

const documentQuestionDescriptor: DocumentQuestionDescriptor<
  typeof questionType,
  typeof questionForm,
  ApiQuestion,
  Answer
> = {
  form: questionForm,
  getInitialState: (question: ApiQuestion, answer?: Answer) => ({
    branch: questionType,
    state: {
      template: getTemplateInitialValues(question),
      answer: answer ?? getAnswerInitialValue()
    }
  }),
  Component: View
}

export default {
  template: templateQuestionDescriptor,
  document: documentQuestionDescriptor
}