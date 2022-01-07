// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import { UUID } from 'lib-common/types'
import StickyFooter from 'lib-components/layout/StickyFooter'
import { defaultMargins, Gap } from 'lib-components/white-space'
import { VasuStateTransitionButtons } from './VasuStateTransitionButtons'
import { VasuContainer } from './components/VasuContainer'
import { BasicsSection } from './sections/BasicsSection'
import { DynamicSections } from './sections/DynamicSections'
import { VasuEvents } from './sections/VasuEvents'
import { VasuHeader } from './sections/VasuHeader'
import { useVasu } from './use-vasu'

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: ${defaultMargins.s};
`

export default React.memo(function VasuPage({
  match
}: RouteComponentProps<{ id: UUID }>) {
  const { id } = match.params

  const { vasu, content, translations } = useVasu(id)

  const dynamicSectionsOffset = 1

  return (
    <VasuContainer gapSize="zero" data-qa="vasu-preview">
      {vasu && (
        <>
          <VasuHeader document={vasu} />
          <BasicsSection
            sectionIndex={0}
            type={vasu.type}
            basics={vasu.basics}
            childLanguage={vasu.basics.childLanguage}
            templateRange={vasu.templateRange}
            translations={translations}
          />
          <DynamicSections
            sections={content.sections}
            sectionIndex={dynamicSectionsOffset}
            state={vasu.documentState}
            translations={translations}
          />
          <Gap size={'s'} />
          <VasuEvents document={vasu} content={content} />
        </>
      )}
      <StickyFooter>
        <FooterContainer>
          {vasu && (
            <VasuStateTransitionButtons
              childId={vasu.basics.child.id}
              documentId={vasu.id}
              state={vasu.documentState}
            />
          )}
        </FooterContainer>
      </StickyFooter>
    </VasuContainer>
  )
})
