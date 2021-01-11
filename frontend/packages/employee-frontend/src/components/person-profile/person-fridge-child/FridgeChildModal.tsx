// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState, useContext, useEffect } from 'react'
import LocalDate from '@evaka/lib-common/src/local-date'
import { useTranslation } from '~state/i18n'
import { UIContext } from '~state/ui'
import {
  allPropertiesTrue,
  isDateRangeValid
} from '~utils/validation/validations'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle } from '@evaka/lib-icons'
import FormModal from '@evaka/lib-components/src/molecules/modals/FormModal'
import { Parentship } from '~types/fridge'
import { UUID } from '~types'
import { Result } from '@evaka/lib-common/src/api'
import { faChild } from '@evaka/lib-icons'
import { formatName } from '~utils'
import PersonSearch from '~components/common/PersonSearch'
import {
  DatePicker,
  DatePickerClearable
} from '@evaka/lib-components/src/molecules/DatePicker'
import { addParentship, updateParentship } from '~api/parentships'
import { PersonDetails } from '~types/person'

interface Props {
  headPersonId: UUID
  onSuccess: () => void
  parentship?: Parentship
}

interface FormValidationResult {
  valid: boolean
  fields: {
    [field: string]: boolean
  }
}

export interface FridgeChildForm {
  child?: PersonDetails
  startDate: LocalDate
  endDate: LocalDate | null
}

function FridgeChildModal({ headPersonId, onSuccess, parentship }: Props) {
  const { i18n } = useTranslation()
  const { clearUiMode, setErrorMessage } = useContext(UIContext)

  const initialForm: FridgeChildForm = {
    child: parentship && parentship.child,
    startDate: parentship ? parentship.startDate : LocalDate.today(),
    endDate: parentship ? parentship.endDate : null
  }
  const [form, setForm] = useState<FridgeChildForm>(initialForm)

  const [errorStatusCode, setErrorStatusCode] = useState<number>()
  const [validationResult, setValidationResult] = useState<
    FormValidationResult
  >()

  useEffect(() => {
    const fieldsValid = {
      dateRange: isDateRangeValid(form.startDate, form.endDate),
      childId: !!form.child
    }

    setValidationResult({
      valid: allPropertiesTrue(fieldsValid),
      fields: fieldsValid
    })
  }, [form])

  const childFormActions = () => {
    if (!form.child) return

    const apiCall = parentship
      ? updateParentship(parentship.id, form.startDate, form.endDate)
      : addParentship(headPersonId, form.child.id, form.startDate, form.endDate)

    void apiCall.then((res: Result<Parentship>) => {
      if (res.isFailure) {
        if (res.statusCode === 409) {
          setErrorStatusCode(res.statusCode)
        } else {
          clearUiMode()
          setErrorMessage({
            type: 'error',
            title: parentship
              ? i18n.personProfile.fridgeChild.error.edit.title
              : i18n.personProfile.fridgeChild.error.add.title,
            text: i18n.common.tryAgain
          })
        }
      } else {
        clearUiMode()
        onSuccess()
      }
    })
  }

  const assignFridgeChildForm = (value: Partial<FridgeChildForm>) => {
    const mergedFridgeChild = { ...form, ...value }
    setForm(mergedFridgeChild)
  }

  return (
    <>
      {validationResult && (
        <FormModal
          title={
            parentship
              ? i18n.personProfile.fridgeChild.editChild
              : i18n.personProfile.fridgeChild.newChild
          }
          icon={faChild}
          iconColour={'blue'}
          resolve={{
            action: childFormActions,
            label: i18n.common.confirm,
            disabled: !validationResult.valid
          }}
          reject={{
            action: clearUiMode,
            label: i18n.common.cancel
          }}
        >
          {errorStatusCode === 409 && (
            <section className="error">
              {i18n.personProfile.fridgeChild.error.conflict}
            </section>
          )}
          <section>
            {parentship ? (
              <div>
                {formatName(
                  parentship.child.firstName,
                  parentship.child.lastName,
                  i18n
                )}
              </div>
            ) : (
              <>
                <div className="bold">
                  {i18n.personProfile.fridgeChild.searchTitle}
                </div>
                <PersonSearch
                  onResult={(person: PersonDetails | undefined) => {
                    let endDate = form.endDate
                    if (person && person.dateOfBirth) {
                      endDate = person.dateOfBirth.addYears(18)
                    }
                    assignFridgeChildForm({ child: person, endDate })
                  }}
                  onlyChildren
                />
              </>
            )}
          </section>
          <section>
            <div className="bold">{i18n.common.form.startDate}</div>
            <DatePicker
              date={form.startDate}
              onChange={(startDate) => assignFridgeChildForm({ startDate })}
              type="full-width"
            />
          </section>
          <section>
            <div className="bold">{i18n.common.form.endDate}</div>
            <DatePickerClearable
              date={form.endDate}
              onChange={(endDate) => assignFridgeChildForm({ endDate })}
              onCleared={() => assignFridgeChildForm({ endDate: null })}
              type="full-width"
            />
          </section>
          {!validationResult.fields.dateRange && (
            <div className="error">
              {i18n.validationError.dateRange}{' '}
              <FontAwesomeIcon
                size="lg"
                icon={faQuestionCircle}
                title={i18n.validationError.invertedDateRange}
              />
            </div>
          )}
        </FormModal>
      )}{' '}
    </>
  )
}

export default FridgeChildModal
