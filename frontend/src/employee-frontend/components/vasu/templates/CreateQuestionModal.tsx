// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'
import {
  VasuQuestion,
  VasuQuestionType,
  vasuQuestionTypes
} from 'lib-common/api-types/vasu'
import IconButton from 'lib-components/atoms/buttons/IconButton'
import InlineButton from 'lib-components/atoms/buttons/InlineButton'
import Combobox from 'lib-components/atoms/dropdowns/Combobox'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import InputField from 'lib-components/atoms/form/InputField'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import FormModal from 'lib-components/molecules/modals/FormModal'
import { Label } from 'lib-components/typography'
import { faTrash } from 'lib-icons'
import { useTranslation } from '../../../state/i18n'

interface Props {
  onSave: (question: VasuQuestion) => void
  onCancel: () => void
}

export default React.memo(function CreateQuestionModal({
  onCancel,
  onSave
}: Props) {
  const { i18n } = useTranslation()
  const t = i18n.vasuTemplates.questionModal
  const [type, setType] =
    useState<Exclude<VasuQuestionType, 'PARAGRAPH'>>('TEXT')
  const [name, setName] = useState('')
  const [options, setOptions] = useState([''])
  const [multiline, setMultiline] = useState(false)
  const [minSelections, setMinSelections] = useState(0)
  const [keys, setKeys] = useState([''])
  const [info, setInfo] = useState('')
  const [trackedInEvents, setTrackedInEvents] = useState(false)
  const [nameInEvents, setNameInEvents] = useState('')

  function createQuestion(): VasuQuestion {
    switch (type) {
      case 'TEXT':
        return {
          type: 'TEXT',
          ophKey: null,
          name: name,
          info: info,
          multiline: multiline,
          value: ''
        }
      case 'CHECKBOX':
        return {
          type: 'CHECKBOX',
          ophKey: null,
          name: name,
          info: info,
          value: false
        }
      case 'RADIO_GROUP':
        return {
          type: 'RADIO_GROUP',
          ophKey: null,
          name: name,
          info: info,
          options: options.map((opt) => ({
            key: opt,
            name: opt
          })),
          value: null
        }
      case 'MULTISELECT':
        return {
          type: 'MULTISELECT',
          ophKey: null,
          name: name,
          info: info,
          options: options.map((opt) => ({
            key: opt,
            name: opt
          })),
          minSelections: minSelections,
          maxSelections: null,
          value: []
        }
      case 'MULTI_FIELD':
        return {
          type: 'MULTI_FIELD',
          ophKey: null,
          name,
          info,
          keys: keys.map((key) => ({ name: key })),
          value: keys.map(() => '')
        }
      case 'MULTI_FIELD_LIST':
        return {
          type: 'MULTI_FIELD_LIST',
          ophKey: null,
          name,
          info,
          keys: keys.map((key) => ({ name: key })),
          value: []
        }
      case 'DATE':
        return {
          type: 'DATE',
          ophKey: null,
          name,
          info,
          trackedInEvents,
          nameInEvents: trackedInEvents ? nameInEvents : '',
          value: null
        }
      case 'FOLLOWUP':
        return {
          type: 'FOLLOWUP',
          ophKey: null,
          name: name,
          info: info,
          title: '',
          value: []
        }
    }
  }

  return (
    <FormModal
      title={t.title}
      resolveAction={() => onSave(createQuestion())}
      resolveLabel={i18n.common.confirm}
      rejectAction={onCancel}
      rejectLabel={i18n.common.cancel}
    >
      <FixedSpaceColumn>
        <FixedSpaceColumn spacing="xxs">
          <Label>{t.type}</Label>
          <Combobox
            items={[...vasuQuestionTypes]}
            selectedItem={type}
            onChange={(value) => {
              if (value) setType(value)
            }}
            getItemLabel={(option) => i18n.vasuTemplates.questionTypes[option]}
          />
        </FixedSpaceColumn>

        <FixedSpaceColumn spacing="xxs">
          <Label>{t.name}</Label>
          <InputField value={name} onChange={setName} width="full" />
        </FixedSpaceColumn>

        {type === 'TEXT' && (
          <FixedSpaceColumn spacing="xxs">
            <Checkbox
              label={t.multiline}
              checked={multiline}
              onChange={setMultiline}
            />
          </FixedSpaceColumn>
        )}

        {(type === 'RADIO_GROUP' || type === 'MULTISELECT') && (
          <FixedSpaceColumn spacing="xxs">
            <Label>{t.options}</Label>
            {options.map((opt, i) => (
              <FixedSpaceRow spacing="xs" key={`opt-${i}`}>
                <InputField
                  value={opt}
                  onChange={(val) =>
                    setOptions([
                      ...options.slice(0, i),
                      val,
                      ...options.slice(i + 1)
                    ])
                  }
                  width="m"
                />
                <IconButton
                  icon={faTrash}
                  disabled={options.length < 2}
                  onClick={(e) => {
                    e.preventDefault()
                    setOptions([
                      ...options.slice(0, i),
                      ...options.slice(i + 1)
                    ])
                  }}
                />
              </FixedSpaceRow>
            ))}
            <InlineButton
              onClick={() => setOptions([...options, ''])}
              text={t.addNewOption}
            />
          </FixedSpaceColumn>
        )}

        {type === 'MULTISELECT' && (
          <FixedSpaceColumn spacing="xxs">
            <Label>{t.minSelections}</Label>
            <InputField
              value={minSelections.toString(10)}
              onChange={(v) => setMinSelections(parseInt(v))}
              type="number"
              step={1}
              min={0}
              width="s"
            />
          </FixedSpaceColumn>
        )}

        {(type === 'MULTI_FIELD' || type === 'MULTI_FIELD_LIST') && (
          <FixedSpaceColumn spacing="xxs">
            <Label>{t.keys}</Label>
            {keys.map((key, i) => (
              <FixedSpaceRow spacing="xs" key={`key-${i}`}>
                <InputField
                  value={key}
                  onChange={(val) =>
                    setKeys([...keys.slice(0, i), val, ...keys.slice(i + 1)])
                  }
                  width="m"
                />
                <IconButton
                  icon={faTrash}
                  disabled={keys.length < 2}
                  onClick={(e) => {
                    e.preventDefault()
                    setOptions([...keys.slice(0, i), ...keys.slice(i + 1)])
                  }}
                />
              </FixedSpaceRow>
            ))}
            <InlineButton
              onClick={() => setKeys([...keys, ''])}
              text={t.addNewKey}
            />
          </FixedSpaceColumn>
        )}

        {type === 'DATE' && (
          <FixedSpaceColumn spacing="xxs">
            <Checkbox
              label={t.dateIsTrackedInEvents}
              checked={trackedInEvents}
              onChange={setTrackedInEvents}
            />
            {trackedInEvents && (
              <InputField
                value={nameInEvents}
                onChange={setNameInEvents}
                width="m"
              />
            )}
          </FixedSpaceColumn>
        )}

        <FixedSpaceColumn spacing="xxs">
          <Label>{t.info}</Label>
          <InputField value={info} onChange={setInfo} width="full" />
        </FixedSpaceColumn>
      </FixedSpaceColumn>
    </FormModal>
  )
})
