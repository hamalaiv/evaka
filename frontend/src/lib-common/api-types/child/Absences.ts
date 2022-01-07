// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { AbsenceCareType, AbsenceType } from 'lib-common/generated/enums'
import { JsonOf } from 'lib-common/json'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'
import { EvakaUserType } from '../../generated/api-types/user'

export interface Absence {
  id: UUID
  childId: UUID
  date: LocalDate
  absenceType: AbsenceType
  careType: AbsenceCareType
  modifiedByType: EvakaUserType
  modifiedAt: Date
}

export const deserializeAbsence = (absence: JsonOf<Absence>): Absence => ({
  ...absence,
  date: LocalDate.parseIso(absence.date),
  modifiedAt: new Date(absence.modifiedAt)
})
