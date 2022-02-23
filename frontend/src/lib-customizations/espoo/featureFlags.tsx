// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FeatureFlags } from 'lib-customizations/types'

import { env, Env } from './env'

type Features = {
  default: FeatureFlags
} & {
  [k in Env]: FeatureFlags
}

const features: Features = {
  default: {
    assistanceActionOtherEnabled: true,
    daycareApplication: {
      dailyTimesEnabled: true
    },
    groupsTableServiceNeedsEnabled: false,
    evakaLogin: true,
    financeBasicsPage: true,
    preschoolEnabled: true,
    urgencyAttachmentsEnabled: true,
    adminSettingsEnabled: false,
    experimental: {
      ai: true,
      messageAttachments: true,
      realtimeStaffAttendance: false,
      personalDetailsPage: true,
      mobileMessages: true,
      leops: true,
      placementTermination: true
    }
  },
  staging: {
    assistanceActionOtherEnabled: true,
    daycareApplication: {
      dailyTimesEnabled: true
    },
    groupsTableServiceNeedsEnabled: false,
    evakaLogin: true,
    financeBasicsPage: true,
    preschoolEnabled: true,
    urgencyAttachmentsEnabled: true,
    adminSettingsEnabled: false,
    experimental: {
      ai: true,
      messageAttachments: true,
      realtimeStaffAttendance: true,
      personalDetailsPage: true,
      mobileMessages: true,
      leops: true,
      placementTermination: true
    }
  },
  prod: {
    assistanceActionOtherEnabled: true,
    daycareApplication: {
      dailyTimesEnabled: true
    },
    groupsTableServiceNeedsEnabled: false,
    evakaLogin: true,
    financeBasicsPage: true,
    preschoolEnabled: true,
    urgencyAttachmentsEnabled: true,
    adminSettingsEnabled: false,
    experimental: {
      ai: false,
      messageAttachments: true,
      realtimeStaffAttendance: false,
      personalDetailsPage: false,
      mobileMessages: false,
      leops: false,
      placementTermination: false
    }
  }
}

const featureFlags = features[env()]

export default featureFlags
