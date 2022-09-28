// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useEffect, useState } from 'react'

import { isLoading } from 'lib-common/api'
import { CollapsibleContentArea } from 'lib-components/layout/Container'
import { H2 } from 'lib-components/typography'

import PersonDetails from '../../components/person-shared/PersonDetails'
import { useTranslation } from '../../state/i18n'
import { PersonContext, PersonState } from '../../state/person'
import { TitleContext, TitleState } from '../../state/title'
import { renderResult } from '../async-rendering'

export default React.memo(function PersonFridgeHead() {
  const { i18n } = useTranslation()
  const { person, setPerson, permittedActions } =
    useContext<PersonState>(PersonContext)
  const { setTitle, formatTitleName } = useContext<TitleState>(TitleContext)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (person.isSuccess) {
      const name = formatTitleName(
        person.value.firstName,
        person.value.lastName
      )
      setTitle(`${name} | ${i18n.titles.customers}`)
    }
  }, [formatTitleName, i18n.titles.customers, person, setTitle])

  return (
    <div data-qa="person-info-section" data-isloading={isLoading(person)}>
      <CollapsibleContentArea
        title={<H2>{i18n.personProfile.personDetails}</H2>}
        open={open}
        toggleOpen={() => setOpen(!open)}
        opaque
        paddingVertical="L"
        data-qa="person-info-collapsible"
      >
        {renderResult(person, (person) => (
          <PersonDetails
            person={person}
            isChild={false}
            onUpdateComplete={setPerson}
            permittedActions={permittedActions}
          />
        ))}
      </CollapsibleContentArea>
    </div>
  )
})
