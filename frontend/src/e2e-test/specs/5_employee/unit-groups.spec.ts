// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import FiniteDateRange from 'lib-common/finite-date-range'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'

import { initializeAreaAndPersonData } from '../../dev-api/data-init'
import { Fixture, systemInternalUser, uuidv4 } from '../../dev-api/fixtures'
import { Child, Daycare } from '../../dev-api/types'
import {
  createDefaultServiceNeedOptions,
  resetServiceState,
  terminatePlacement
} from '../../generated/api-clients'
import { DevEmployee } from '../../generated/api-types'
import { UnitPage } from '../../pages/employee/units/unit'
import { UnitGroupsPage } from '../../pages/employee/units/unit-groups-page'
import { Page } from '../../utils/page'
import { employeeLogin } from '../../utils/user'

let page: Page
let unitPage: UnitPage
const groupId: UUID = uuidv4()
let child1Fixture: Child
let child2Fixture: Child
let child3Fixture: Child
let child1DaycarePlacementId: UUID
let child2DaycarePlacementId: UUID

let daycare: Daycare
let daycare2: Daycare
let unitSupervisor: DevEmployee
const placementStartDate = LocalDate.todayInSystemTz().subWeeks(4)
const placementEndDate = LocalDate.todayInSystemTz().addWeeks(4)

beforeEach(async () => {
  await resetServiceState()

  const fixtures = await initializeAreaAndPersonData()
  daycare = fixtures.daycareFixture

  unitSupervisor = (await Fixture.employeeUnitSupervisor(daycare.id).save())
    .data

  await createDefaultServiceNeedOptions()

  await Fixture.daycareGroup()
    .with({
      id: groupId,
      daycareId: daycare.id,
      name: 'Testailijat'
    })
    .save()

  child1Fixture = fixtures.familyWithTwoGuardians.children[0]
  child1DaycarePlacementId = uuidv4()
  await Fixture.placement()
    .with({
      id: child1DaycarePlacementId,
      childId: child1Fixture.id,
      unitId: daycare.id,
      startDate: placementStartDate,
      endDate: placementEndDate
    })
    .save()

  child2Fixture = fixtures.personFixtureChildZeroYearOld
  child2DaycarePlacementId = uuidv4()
  await Fixture.placement()
    .with({
      id: child2DaycarePlacementId,
      childId: child2Fixture.id,
      unitId: daycare.id,
      startDate: placementStartDate,
      endDate: placementEndDate
    })
    .save()

  child3Fixture = fixtures.enduserChildFixtureKaarina
  daycare2 = fixtures.daycareFixturePrivateVoucher
})

const loadUnitGroupsPage = async (): Promise<UnitGroupsPage> => {
  unitPage = new UnitPage(page)
  await unitPage.navigateToUnit(daycare.id)
  const groupsPage = await unitPage.openGroupsPage()
  await groupsPage.waitUntilVisible()
  return groupsPage
}

describe('Unit groups - unit supervisor', () => {
  beforeEach(async () => {
    page = await Page.open()
    await employeeLogin(page, unitSupervisor)
  })

  test('Children with a missing group placement is shown in missing placement list and disappears when placed to a group', async () => {
    const groupsSection = await loadUnitGroupsPage()
    await groupsSection.missingPlacementsSection.assertRowCount(2)

    await Fixture.groupPlacement()
      .with({
        daycareGroupId: groupId,
        daycarePlacementId: child1DaycarePlacementId,
        startDate: placementStartDate,
        endDate: placementEndDate
      })
      .save()

    await page.reload()
    await groupsSection.missingPlacementsSection.assertRowCount(1)
  })

  test('Child with a terminated placement is shown in terminated placement list', async () => {
    await terminatePlacement({
      body: {
        placementId: child1DaycarePlacementId,
        endDate: LocalDate.todayInSystemTz(),
        terminationRequestedDate: LocalDate.todayInSystemTz(),
        terminatedBy: unitSupervisor.id
      }
    })
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.terminatedPlacementsSection.assertRowCount(1)
  })

  test('Child with a terminated placement is shown not in terminated placement list when termination is older than 2 weeks', async () => {
    await terminatePlacement({
      body: {
        placementId: child1DaycarePlacementId,
        endDate: LocalDate.todayInSystemTz(),
        terminationRequestedDate: LocalDate.todayInSystemTz(),
        terminatedBy: unitSupervisor.id
      }
    })

    await terminatePlacement({
      body: {
        placementId: child2DaycarePlacementId,
        endDate: LocalDate.todayInSystemTz(),
        terminationRequestedDate: LocalDate.todayInSystemTz(),
        terminatedBy: unitSupervisor.id
      }
    })

    let groupsPage = await loadUnitGroupsPage()
    await groupsPage.terminatedPlacementsSection.assertRowCount(2)

    await terminatePlacement({
      body: {
        placementId: child1DaycarePlacementId,
        endDate: LocalDate.todayInSystemTz(),
        terminationRequestedDate: LocalDate.todayInSystemTz().subDays(15),
        terminatedBy: unitSupervisor.id
      }
    })
    groupsPage = await loadUnitGroupsPage()
    await groupsPage.terminatedPlacementsSection.assertRowCount(1)
  })

  test('Open groups stay open when reloading page', async () => {
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.openGroupCollapsible(groupId)
    await page.reload()
    await groupsPage.assertGroupCollapsibleIsOpen(groupId)
  })

  test('Open groups stay open when visiting other unit page tab', async () => {
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.openGroupCollapsible(groupId)
    await unitPage.openUnitInformation()
    await unitPage.openGroupsPage()
    await groupsPage.assertGroupCollapsibleIsOpen(groupId)
  })

  test('Supervisor sees child occupancy factor 1 as —', async () => {
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.missingPlacementsSection.assertRowCount(2)

    await Fixture.groupPlacement()
      .with({
        daycareGroupId: groupId,
        daycarePlacementId: child1DaycarePlacementId,
        startDate: placementStartDate,
        endDate: placementEndDate
      })
      .save()

    await page.reload()
    await groupsPage.openGroupCollapsible(groupId)
    await groupsPage.childCapacityFactorColumnHeading.waitUntilVisible()
    await groupsPage.assertChildCapacityFactor(child1Fixture.id, '—')
  })

  test('Supervisor sees numeric child occupancy factor when not equal to 1', async () => {
    await Fixture.assistanceFactor()
      .with({
        childId: child1Fixture.id,
        capacityFactor: 1.5,
        validDuring: new FiniteDateRange(placementStartDate, placementEndDate),
        modifiedBy: systemInternalUser
      })
      .save()

    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.missingPlacementsSection.assertRowCount(2)

    await Fixture.groupPlacement()
      .with({
        daycareGroupId: groupId,
        daycarePlacementId: child1DaycarePlacementId,
        startDate: placementStartDate,
        endDate: placementEndDate
      })
      .save()

    await page.reload()
    await groupsPage.openGroupCollapsible(groupId)
    await groupsPage.childCapacityFactorColumnHeading.waitUntilVisible()
    await groupsPage.assertChildCapacityFactor(child1Fixture.id, '1.50')
  })

  test('Supervisor sees backup care numeric child occupancy factor when not equal to 1', async () => {
    const child3DaycarePlacementId = uuidv4()
    await Fixture.placement()
      .with({
        id: child3DaycarePlacementId,
        childId: child3Fixture.id,
        unitId: daycare2.id,
        startDate: placementStartDate,
        endDate: placementEndDate
      })
      .save()
    await Fixture.backupCare()
      .with({
        childId: child3Fixture.id,
        unitId: daycare.id,
        groupId,
        period: new FiniteDateRange(placementStartDate, placementEndDate)
      })
      .save()
    await Fixture.assistanceFactor()
      .with({
        childId: child3Fixture.id,
        validDuring: new FiniteDateRange(placementStartDate, placementEndDate),
        capacityFactor: 1.5
      })
      .save()

    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.missingPlacementsSection.assertRowCount(2)

    await groupsPage.openGroupCollapsible(groupId)
    await groupsPage.childCapacityFactorColumnHeading.waitUntilVisible()
    await groupsPage.assertChildCapacityFactor(child3Fixture.id, '1.50')
  })

  test('Supervisor sees uncommon age factor when set', async () => {
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.missingPlacementsSection.assertRowCount(2)

    await Fixture.groupPlacement()
      .with({
        daycareGroupId: groupId,
        daycarePlacementId: child2DaycarePlacementId,
        startDate: placementStartDate,
        endDate: placementEndDate
      })
      .save()

    const specialServiceNeed = await Fixture.serviceNeedOption()
      .with({ occupancyCoefficientUnder3y: 1.89 })
      .save()

    await Fixture.serviceNeed()
      .with({
        placementId: child2DaycarePlacementId,
        optionId: specialServiceNeed.data.id,
        confirmedBy: unitSupervisor.id
      })
      .save()

    await page.reload()
    await groupsPage.openGroupCollapsible(groupId)
    await groupsPage.childCapacityFactorColumnHeading.waitUntilVisible()
    await groupsPage.assertChildCapacityFactor(child2Fixture.id, '1.89')
  })
})

describe('Unit groups - staff', () => {
  beforeEach(async () => {
    const staff = await Fixture.employeeStaff(daycare.id).save()

    page = await Page.open()
    await employeeLogin(page, staff.data)
  })

  test('Staff will not see terminated placements', async () => {
    await terminatePlacement({
      body: {
        placementId: child1DaycarePlacementId,
        endDate: LocalDate.todayInSystemTz(),
        terminationRequestedDate: LocalDate.todayInSystemTz(),
        terminatedBy: unitSupervisor.id
      }
    })
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.terminatedPlacementsSection.assertRowCount(0)
  })

  test('Staff will not see children with a missing group placement', async () => {
    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.missingPlacementsSection.assertRowCount(0)
  })

  test('Staff does not see child occupancy factor', async () => {
    await Fixture.groupPlacement()
      .with({
        daycareGroupId: groupId,
        daycarePlacementId: child1DaycarePlacementId,
        startDate: placementStartDate,
        endDate: placementEndDate
      })
      .save()

    const groupsPage = await loadUnitGroupsPage()
    await groupsPage.childCapacityFactorColumnHeading.waitUntilHidden()
    await groupsPage.assertChildOccupancyFactorColumnNotVisible()
  })
})
