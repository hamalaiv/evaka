// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import * as _ from 'lodash'
import React, { useContext, useEffect, useState } from 'react'
import { Loading } from 'lib-common/api'
import { UUID } from 'lib-common/types'
import Loader from 'lib-components/atoms/Loader'
import { AddButtonRow } from 'lib-components/atoms/buttons/AddButton'
import { CollapsibleContentArea } from 'lib-components/layout/Container'
import { H2 } from 'lib-components/typography'
import { getChildBackupCares } from '../../api/child/backup-care'
import BackupCareForm from '../../components/child-information/backup-care/BackupCareForm'
import BackupCareRow from '../../components/child-information/backup-care/BackupCareRow'
import { ChildContext } from '../../state'
import { useTranslation } from '../../state/i18n'
import { UIContext } from '../../state/ui'

export interface Props {
  id: UUID
  startOpen: boolean
}

export default function BackupCare({ id, startOpen }: Props) {
  const { i18n } = useTranslation()
  const { backupCares, setBackupCares, permittedActions } =
    useContext(ChildContext)
  const { uiMode, toggleUiMode } = useContext(UIContext)

  const [open, setOpen] = useState(startOpen)

  useEffect(() => {
    void getChildBackupCares(id).then((backupCares) => {
      setBackupCares(backupCares)
    })
    return () => {
      setBackupCares(Loading.of())
    }
  }, [id, setBackupCares])

  return (
    <CollapsibleContentArea
      title={<H2 noMargin>{i18n.childInformation.backupCares.title}</H2>}
      open={open}
      toggleOpen={() => setOpen(!open)}
      opaque
      paddingVertical="L"
      data-qa="backup-cares-collapsible"
    >
      {backupCares.isLoading && <Loader />}
      {backupCares.isFailure && <div>{i18n.common.loadingFailed}</div>}
      {backupCares.isSuccess && (
        <div data-qa="backup-cares">
          {permittedActions.has('CREATE_BACKUP_CARE') && (
            <AddButtonRow
              text={i18n.childInformation.backupCares.create}
              onClick={() => toggleUiMode('create-new-backup-care')}
              disabled={uiMode === 'create-new-backup-care'}
              data-qa="backup-care-create-btn"
            />
          )}
          {uiMode === 'create-new-backup-care' && (
            <BackupCareForm childId={id} />
          )}
          {_.orderBy(backupCares.value, (x) => x.period.start, 'desc').map(
            (backupCare) => (
              <BackupCareRow
                childId={id}
                key={backupCare.id}
                backupCare={backupCare}
              />
            )
          )}
        </div>
      )}
    </CollapsibleContentArea>
  )
}
