// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import DateRange from 'lib-common/date-range'
import {
  ChildDocumentSummary,
  ChildDocumentCreateRequest,
  ChildDocumentDetails,
  DocumentContent
} from 'lib-common/generated/api-types/document'
import { JsonOf } from 'lib-common/json'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'

import { client } from '../client'

export async function getChildDocuments(
  childId: UUID
): Promise<ChildDocumentSummary[]> {
  return client
    .get<JsonOf<ChildDocumentSummary[]>>('/child-documents', {
      params: { childId }
    })
    .then((res) => res.data)
}

export async function getChildDocument(
  id: UUID
): Promise<ChildDocumentDetails> {
  return client
    .get<JsonOf<ChildDocumentDetails>>(`/child-documents/${id}`)
    .then((res) => ({
      ...res.data,
      child: {
        ...res.data.child,
        dateOfBirth: LocalDate.parseNullableIso(res.data.child.dateOfBirth)
      },
      template: {
        ...res.data.template,
        validity: DateRange.parseJson(res.data.template.validity)
      }
    }))
}

export async function postChildDocument(
  body: ChildDocumentCreateRequest
): Promise<UUID> {
  return client
    .post<JsonOf<UUID>>('/child-documents', body)
    .then((res) => res.data)
}

export async function putChildDocumentContent(
  id: UUID,
  body: DocumentContent
): Promise<void> {
  return client
    .put<JsonOf<void>>(`/child-documents/${id}/content`, body)
    .then((res) => res.data)
}

export async function putChildDocumentPublish(id: UUID): Promise<void> {
  return client
    .put<JsonOf<void>>(`/child-documents/${id}/publish`)
    .then((res) => res.data)
}
