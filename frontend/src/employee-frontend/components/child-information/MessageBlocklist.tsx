// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useState } from 'react'
import { UUID } from 'lib-common/types'
import { useApiState } from 'lib-common/utils/useRestApi'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import { CollapsibleContentArea } from 'lib-components/layout/Container'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { H2, P } from 'lib-components/typography'
import { getChildRecipients, updateChildRecipient } from '../../api/person'
import { ChildContext } from '../../state'
import { useTranslation } from '../../state/i18n'
import { UIContext } from '../../state/ui'
import { formatPersonName } from '../../utils'
import { renderResult } from '../async-rendering'

interface Props {
  id: UUID
  startOpen: boolean
}

export default React.memo(function MessageBlocklist({ id, startOpen }: Props) {
  const { i18n } = useTranslation()

  const { setErrorMessage } = useContext(UIContext)
  const { permittedActions } = useContext(ChildContext)
  const [recipients, loadData] = useApiState(() => getChildRecipients(id), [id])
  const [open, setOpen] = useState(startOpen)

  const onChange = async (personId: UUID, checked: boolean) => {
    const res = await updateChildRecipient(id, personId, !checked)
    if (res.isFailure) {
      setErrorMessage({
        type: 'error',
        title: i18n.common.error.unknown,
        text: i18n.common.error.saveFailed,
        resolveLabel: i18n.common.ok
      })
    }
    loadData()
  }

  return (
    <div className="child-message-blocklist">
      <CollapsibleContentArea
        title={<H2 noMargin>{i18n.childInformation.messaging.title}</H2>}
        open={open}
        toggleOpen={() => setOpen(!open)}
        opaque
        paddingVertical="L"
        data-qa="child-message-blocklist-collapsible"
      >
        <P>{i18n.childInformation.messaging.info}</P>
        {renderResult(recipients, (recipients) => (
          <Table>
            <Thead>
              <Tr>
                <Th>{i18n.childInformation.messaging.name}</Th>
                <Th>{i18n.childInformation.messaging.notBlocklisted}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recipients.map((recipient) => (
                <Tr
                  key={recipient.personId}
                  data-qa={`recipient-${recipient.personId}`}
                >
                  <Td>{formatPersonName(recipient, i18n, true)}</Td>
                  <Td>
                    <Checkbox
                      label={formatPersonName(recipient, i18n, true)}
                      hiddenLabel
                      checked={!recipient.blocklisted}
                      data-qa={'blocklist-checkbox'}
                      disabled={!permittedActions.has('UPDATE_CHILD_RECIPIENT')}
                      onChange={(checked) =>
                        onChange(recipient.personId, checked)
                      }
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ))}
      </CollapsibleContentArea>
    </div>
  )
})
