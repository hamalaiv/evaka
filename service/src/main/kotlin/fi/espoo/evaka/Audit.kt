// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka

import fi.espoo.voltti.logging.loggers.audit
import mu.KotlinLogging

enum class Audit(
    private val eventCode: String,
    private val securityEvent: Boolean = false,
    private val securityLevel: String = "low"
) {
    AbsenceCitizenCreate("evaka.absence.create"),
    AbsenceRead("evaka.absence.read"),
    AbsenceDelete("evaka.absence.delete"),
    AbsenceDeleteRange("evaka.absence.delete.range"),
    AbsenceUpdate("evaka.absence.update"),
    ApplicationAdminDetailsUpdate("evaka.application.admin-details.update"),
    ApplicationCancel("evaka.application.cancel"),
    ApplicationCreate("evaka.application.create"),
    ApplicationDelete("evaka.application.delete"),
    ApplicationRead("evaka.application.read"),
    ApplicationReadNotifications("evaka.application.read-notifications"),
    ApplicationReadDuplicates("evaka.application.read-duplicates"),
    ApplicationReadActivePlacementsByType("evaka.application.read-active-placements-by-type"),
    ApplicationReturnToSent("evaka.application.return-to-sent"),
    ApplicationReturnToWaitingPlacement("evaka.application.return-to-waiting-placement"),
    ApplicationReturnToWaitingDecision("evaka.application.return-to-waiting-decision"),
    ApplicationSearch("evaka.application.search"),
    ApplicationSend("evaka.application.send"),
    ApplicationUpdate("evaka.application.update"),
    ApplicationVerify("evaka.application.verify"),
    ApplicationsReportRead("evaka.applications-report.read"),
    AssistanceNeedDecisionsListCitizen("evaka-assistance-need-decisions-list-citizen.read"),
    AssistanceNeedDecisionsReportRead("evaka.assistance-need-decisions-report.read"),
    AssistanceNeedDecisionsReportUnreadCount("evaka.assistance-need-decision-report.unread-count"),
    AssistanceNeedsReportRead("evaka.assistance-needs-report.read"),
    AttachmentsDelete("evaka.attachments.delete"),
    AttachmentsRead("evaka.attachments.read"),
    AttachmentsUploadForApplication("evaka.attachments.upload-for-application"),
    AttachmentsUploadForIncomeStatement("evaka.attachments.upload-for-income-statement"),
    AttachmentsUploadForMessageDraft("evaka.attachments.upload-for-message-draft"),
    AttendanceReservationCitizenCreate("evaka.attendance-reservation.citizen.create"),
    AttendanceReservationCitizenRead("evaka.attendance-reservation.citizen.read"),
    AttendanceReservationEmployeeCreate("evaka.attendance-reservation.employee.create"),
    AttendanceReservationReportRead("evaka.attendance-reservation.report.read"),
    AttachmentsUploadForPedagogicalDocument("evaka.attachments.upload-for-pedagogical-document"),
    BackupCareDelete("evaka.backup-care.delete"),
    BackupCareUpdate("evaka.backup-care.update"),
    CalendarEventCreate("evaka.calendar-event.create"),
    CalendarEventDelete("evaka.calendar-event.delete"),
    CalendarEventUpdate("evaka.calendar-event.update"),
    CalendarEventsReadCitizen("evaka.calendar-event.read.citizen"),
    ChildAdditionalInformationRead("evaka.child.additional-information.read"),
    ChildAdditionalInformationUpdate("evaka.child.additional-information.update"),
    ChildAgeLanguageReportRead("evaka.child-age-language-report.read"),
    ChildAssistanceActionCreate("evaka.child.assistance-action.create"),
    ChildAssistanceActionDelete("evaka.child.assistance-action.delete"),
    ChildAssistanceActionRead("evaka.child.assistance-action.read"),
    ChildAssistanceActionUpdate("evaka.child.assistance-action.update"),
    ChildAssistanceNeedCreate("evaka.child.assistance-need.create"),
    ChildAssistanceNeedDelete("evaka.child.assistance-need.delete"),
    ChildAssistanceNeedRead("evaka.child.assistance-need.read"),
    ChildAssistanceNeedUpdate("evaka.child.assistance-need.update"),
    ChildAssistanceNeedDecisionCreate("evaka.child.assistance-need-decision.create"),
    ChildAssistanceNeedDecisionDelete("evaka.child.assistance-need-decision.delete"),
    ChildAssistanceNeedDecisionDownloadCitizen("evaka.citizen.child.assistance-need-decision.download"),
    ChildAssistanceNeedDecisionGetUnreadCountCitizen("evaka.citizen.child.assistance-need-decision.get-unread-count"),
    ChildAssistanceNeedDecisionMarkReadCitizen("evaka.citizen.child.assistance-need-decision.mark-as-read"),
    ChildAssistanceNeedDecisionRead("evaka.child.assistance-need-decision.read"),
    ChildAssistanceNeedDecisionReadCitizen("evaka.citizen.child.assistance-need-decision.read"),
    ChildAssistanceNeedDecisionUpdate("evaka.child.assistance-need-decision.update"),
    ChildAssistanceNeedDecisionsList("evaka.child.assistance-need-decision.list"),
    ChildAssistanceNeedDecisionsListCitizen("evaka.citizen.child.assistance-need-decision.list"),
    ChildAssistanceNeedDecisionSend("evaka.child.assistance-need-decision.send"),
    ChildAssistanceNeedDecisionDecide("evaka.child.assistance-need-decision.decide"),
    ChildAssistanceNeedDecisionOpened("evaka.child.assistance-need-decision.opened"),
    ChildAssistanceNeedDecisionUpdateDecisionMaker("evaka.child.assistance-need-decision.update-decision-maker"),
    ChildAssistanceNeedVoucherCoefficientCreate("evaka.child.assistance-need-voucher-coefficient.create"),
    ChildAssistanceNeedVoucherCoefficientRead("evaka.child.assistance-need-voucher-coefficient.read"),
    ChildAssistanceNeedVoucherCoefficientUpdate("evaka.child.assistance-need-voucher-coefficient.update"),
    ChildAssistanceNeedVoucherCoefficientDelete("evaka.child.assistance-need-voucher-coefficient.delete"),
    ChildAttendancesRead("evaka.child-attendances.read"),
    ChildAttendancesUpsert("evaka.child-attendances.upsert"),
    ChildAttendancesArrivalCreate("evaka.child-attendances.arrival.create"),
    ChildAttendancesDepartureRead("evaka.child-attendances.departure.read"),
    ChildAttendancesDepartureCreate("evaka.child-attendances.departure.create"),
    ChildAttendancesFullDayAbsenceCreate("evaka.child-attendances.full-day-absence.create"),
    ChildAttendancesAbsenceRangeCreate("evaka.child-attendances.absence-range.create"),
    ChildAttendancesReturnToComing("evaka.child-attendances.return-to-coming"),
    ChildAttendancesReturnToPresent("evaka.child-attendances.return-to-present"),
    ChildBackupCareCreate("evaka.child.backup-care.create"),
    ChildBackupCareRead("evaka.child.backup-care.read"),
    ChildBackupPickupCreate("evaka.child.backup-pickup.create"),
    ChildBackupPickupDelete("evaka.child.backup-pickup.delete"),
    ChildBackupPickupRead("evaka.child.backup-pickup.read"),
    ChildBackupPickupUpdate("evaka.child.backup-pickup.update"),
    ChildConsentsRead("evaka.child.consent.read"),
    ChildConsentsReadCitizen("evaka.citizen.child.consent.read"),
    ChildConsentsReadNotificationsCitizen("evaka.citizen.child.consent.read-notifications"),
    ChildConsentsUpsert("evaka.child.consent.upsert"),
    ChildConsentsInsertCitizen("evaka.citizen.child.consent.insert"),
    ChildDailyNoteCreate("evaka.child-daily-note.create"),
    ChildDailyNoteUpdate("evaka.child-daily-note.update"),
    ChildDailyNoteDelete("evaka.child-daily-note.delete"),
    ChildDailyServiceTimesDelete("evaka.child.daily-service-times.delete"),
    ChildDailyServiceTimesEdit("evaka.child.daily-service-times.edit"),
    ChildDailyServiceTimesRead("evaka.child.daily-service-times.read"),
    ChildDailyServiceTimeNotificationsRead("evaka.child.daily-service-time-notifications.read"),
    ChildDailyServiceTimeNotificationsDismiss("evaka.child.daily-service-time-notifications.dismiss"),
    ChildFeeAlterationsCreate("evaka.child.fee-alterations.create"),
    ChildFeeAlterationsDelete("evaka.child.fee-alterations.delete"),
    ChildFeeAlterationsRead("evaka.child.fee-alterations.read"),
    ChildFeeAlterationsUpdate("evaka.child.fee-alterations.update"),
    ChildrenInDifferentAddressReportRead("evaka.children-in-different-address-report.read"),
    ChildImageDelete("evaka.child.image.delete"),
    ChildImageDownload("evaka.child.image.download"),
    ChildImageUpload("evaka.child.image.upload"),
    ChildSensitiveInfoRead("evaka.child-sensitive-info.read"),
    ChildStickyNoteCreate("evaka.child-sticky-note.create"),
    ChildStickyNoteUpdate("evaka.child-sticky-note.update"),
    ChildStickyNoteDelete("evaka.child-sticky-note.delete"),
    ChildVasuDocumentsRead("evaka.child.vasu-documents.read"),
    ChildVasuDocumentsReadByGuardian("evaka.child.vasu-documents.read-by-guardian"),
    CitizenChildrenRead("evaka.citizen.children.read", securityEvent = true, securityLevel = "high"),
    CitizenChildRead("evaka.citizen.child.read", securityEvent = true, securityLevel = "high"),
    CitizenLogin("evaka.citizen.login", securityEvent = true, securityLevel = "high"),
    DaycareGroupPlacementCreate("evaka.daycare-group-placement.create"),
    DaycareGroupPlacementDelete("evaka.daycare-group-placement.delete"),
    DaycareGroupPlacementTransfer("evaka.daycare-group-placement.transfer"),
    DaycareBackupCareRead("evaka.daycare-backup-care.read"),
    DecisionAccept("evaka.decision.accept"),
    DecisionConfirmMailed("evaka.decision.confirm-mailed"),
    DecisionCreate("evaka.decision.create"),
    DecisionDownloadPdf("evaka.decision.download-pdf"),
    DecisionDraftRead("evaka.decision-draft.read"),
    DecisionDraftUpdate("evaka.decision-draft.update"),
    DecisionRead("evaka.decision.read"),
    DecisionReadByApplication("evaka.decision.read.by-application"),
    DecisionReject("evaka.decision.reject"),
    DecisionsReportRead("evaka.decisions-report.read"),
    DuplicatePeopleReportRead("evaka.duplicate-people-report.read"),
    EmployeeCreate("evaka.employee.create", securityEvent = true, securityLevel = "high"),
    EmployeeDelete("evaka.employee.delete", securityEvent = true, securityLevel = "high"),
    EmployeeGetOrCreate("evaka.employee.get-or-create", securityEvent = true, securityLevel = "high"),
    EmployeeLogin("evaka.employee.login", securityEvent = true, securityLevel = "high"),
    EmployeeRead("evaka.employee.read", securityEvent = true),
    EmployeeUpdate("evaka.employee.update", securityEvent = true, securityLevel = "high"),
    EmployeesRead("evaka.employees.read", securityEvent = true),
    EndedPlacementsReportRead("evaka.ended-placements-report.read"),
    FamilyConflictReportRead("evaka.family-conflict-report.read"),
    FamilyContactReportRead("evaka.family-contact-report.read"),
    FamilyContactsRead("evaka.family-contacts.read"),
    FamilyContactsUpdate("evaka.family-contacts.update"),
    FeeDecisionConfirm("evaka.fee-decision.confirm"),
    FeeDecisionGenerate("evaka.fee-decision.generate"),
    FeeDecisionHeadOfFamilyRead("evaka.fee-decision.head-of-family.read"),
    FeeDecisionHeadOfFamilyCreateRetroactive("evaka.fee-decision.head-of-family.create-retroactive"),
    FeeDecisionMarkSent("evaka.fee-decision.mark-sent"),
    FeeDecisionPdfRead("evaka.fee-decision-pdf.read"),
    FeeDecisionRead("evaka.fee-decision.read"),
    FeeDecisionSearch("evaka.fee-decision.search"),
    FeeDecisionSetType("evaka.fee-decision.set-type"),
    FinanceBasicsFeeThresholdsRead("evaka.finance-basics-fee-thresholds.read"),
    FinanceBasicsFeeThresholdsCreate("evaka.finance-basics-fee-thresholds.create"),
    FinanceBasicsFeeThresholdsUpdate("evaka.finance-basics-fee-thresholds.update"),
    GroupNoteCreate("evaka.group-note.create"),
    GroupNoteUpdate("evaka.group-note.update"),
    GroupNoteDelete("evaka.group-note.delete"),
    HolidayPeriodCreate("evaka.holiday-period.create"),
    HolidayPeriodRead("evaka.holiday-period.read"),
    HolidayPeriodDelete("evaka.holiday-period.delete"),
    HolidayPeriodsList("evaka.holiday-period.list"),
    HolidayPeriodUpdate("evaka.holiday-period.update"),
    HolidayQuestionnairesList("evaka.holiday-questionnaire.list"),
    HolidayQuestionnaireRead("evaka.holiday-questionnaire.read"),
    HolidayQuestionnaireCreate("evaka.holiday-questionnaire.create"),
    HolidayQuestionnaireUpdate("evaka.holiday-questionnaire.update"),
    HolidayQuestionnaireDelete("evaka.holiday-questionnaire.delete"),
    HolidayAbsenceCreate("evaka.holiday-period.absence.create"),
    IncomeStatementCreate("evaka.income-statement.create"),
    IncomeStatementCreateForChild("evaka.income-statement.child.create"),
    IncomeStatementDelete("evaka.income-statement.delete"),
    IncomeStatementDeleteOfChild("evaka.income-statement.child.delete"),
    IncomeStatementReadOfPerson("evaka.income-statement.person.read"),
    IncomeStatementReadOfChild("evaka.income-statement.child.read"),
    IncomeStatementUpdate("evaka.income-statement.update"),
    IncomeStatementUpdateForChild("evaka.income-statement.child.update"),
    IncomeStatementUpdateHandled("evaka.income-statement.handled.update"),
    IncomeStatementsAwaitingHandler("evaka.income-statements.awaiting-handler.read"),
    IncomeStatementsOfPerson("evaka.income-statements.person.read"),
    IncomeStatementsOfChild("evaka.income-statements.child.read"),
    IncomeStatementStartDates("evaka.income-statement.start-dates.read"),
    IncomeStatementStartDatesOfChild("evaka.income-statement.start-dates.child.read"),
    InvoiceCorrectionsCreate("evaka.invoice-corrections.create"),
    InvoiceCorrectionsDelete("evaka.invoice-corrections.delete"),
    InvoiceCorrectionsNoteUpdate("evaka.invoice-corrections.note.update"),
    InvoiceCorrectionsRead("evaka.invoice-corrections.read"),
    InvoicesCreate("evaka.invoices.create"),
    InvoicesDeleteDrafts("evaka.invoices.delete-drafts"),
    InvoicesDebugDiff("evaka.invoices.debug-diff"),
    InvoicesMarkSent("evaka.invoices.mark-sent"),
    InvoicesRead("evaka.invoices.read"),
    InvoicesReportRead("evaka.invoices-report.read"),
    InvoicesSearch("evaka.invoices.search"),
    InvoicesSend("evaka.invoices.send"),
    InvoicesSendByDate("evaka.invoices.send-by-date"),
    InvoicesUpdate("evaka.invoices.update"),
    MessagingBlocklistEdit("messaging.blocklist.edit"),
    MessagingBlocklistRead("messaging.blocklist.read"),
    MessagingMyAccountsRead("messaging.messages.my-accounts.read"),
    MessagingUnreadMessagesRead("messaging.messages.unread.read"),
    MessagingMarkMessagesReadWrite("messaging.messages.mark-read.write"),
    MessagingMessageReceiversRead("messaging.message.receivers.read"),
    MessagingReceivedMessagesRead("messaging.messages.received-messages.read"),
    MessagingSentMessagesRead("messaging.messages.sent-messages.read"),
    MessagingNewMessageWrite("messaging.messages.new-message.write"),
    MessagingDraftsRead("messaging.messages.drafts.read"),
    MessagingCreateDraft("messaging.messages.new-draft.write"),
    MessagingUpdateDraft("messaging.messages.update-draft.write"),
    MessagingDeleteDraft("messaging.messages.drafts.delete"),
    MessagingReplyToMessageWrite("messaging.messages.reply-to-message.write"),
    MessagingCitizenFetchReceiversForAccount("messaging.messages.fetch-receivers-for-citizen-account"),
    MessagingCitizenSendMessage("messaging.messages.citizen-send-message"),
    MissingHeadOfFamilyReportRead("evaka.missing-head-of-family-report.read"),
    MissingServiceNeedReportRead("evaka.missing-service-need-report.read"),
    MobileDevicesList("evaka.mobile-devices.list"),
    MobileDevicesRead("evaka.mobile-devices.read"),
    MobileDevicesRename("evaka.mobile-devices.rename"),
    MobileDevicesDelete("evaka.mobile-devices.delete"),
    NoteCreate("evaka.note.create"),
    NoteDelete("evaka.note.delete"),
    NoteRead("evaka.note.read"),
    NoteUpdate("evaka.note.update"),
    NotesByGroupRead("evaka.note.group.read"),
    OccupancyRead("evaka.occupancy.read"),
    OccupancyReportRead("evaka.occupancy-report.read"),
    OccupancySpeculatedRead("evaka.occupancy-speculated.read"),
    PairingInit("pairing.init", securityEvent = true),
    PairingChallenge("pairing.challenge", securityEvent = true),
    PairingResponse("pairing.response", securityEvent = true, securityLevel = "high"),
    PairingValidation("pairing.validation", securityEvent = true, securityLevel = "high"),
    PairingStatusRead("pairing.status.read"),
    ParentShipsCreate("evaka.parentships.create"),
    ParentShipsDelete("evaka.parentships.delete"),
    ParentShipsRead("evaka.parentships.read"),
    ParentShipsRetry("evaka.parentships.retry"),
    ParentShipsUpdate("evaka.parentships.update"),
    PartnerShipsCreate("evaka.partnerships.create"),
    PartnerShipsDelete("evaka.partnerships.delete"),
    PartnerShipsRead("evaka.partnerships.read"),
    PartnerShipsRetry("evaka.partnerships.retry"),
    PartnerShipsUpdate("evaka.partnerships.update"),
    PartnersInDifferentAddressReportRead("evaka.partners-in-different-address-report.read"),
    PatuReportSend("evaka.patu-report.send"),
    PaymentsCreate("evaka.payments.create"),
    PaymentsSend("evaka.payments.send"),
    PedagogicalDocumentCountUnread("evaka.pedagogical-document.count-unread"),
    PedagogicalDocumentReadByGuardian("evaka.pedagogical-document.read-by-guardian", securityEvent = true, securityLevel = "high"),
    PedagogicalDocumentRead("evaka.pedagogical-document.read", securityEvent = true, securityLevel = "high"),
    PedagogicalDocumentUpdate("evaka.pedagogical-document.update", securityEvent = true, securityLevel = "high"),
    PersonalDataUpdate("evaka.personal-data.update", securityEvent = true, securityLevel = "high"),
    PersonCreate("evaka.person.create", securityEvent = true, securityLevel = "high"),
    PersonDelete("evaka.person.delete", securityEvent = true, securityLevel = "high"),
    PersonDependantRead("evaka.person-dependant.read", securityEvent = true, securityLevel = "high"),
    PersonGuardianRead("evaka.person-guardian.read", securityEvent = true, securityLevel = "high"),
    PersonDetailsRead("evaka.person-details.read", securityEvent = true, securityLevel = "high"),
    PersonDetailsSearch("evaka.person-details.search"),
    PersonIncomeCreate("evaka.person.income.create"),
    PersonIncomeDelete("evaka.person.income.delete"),
    PersonIncomeRead("evaka.person.income.read"),
    PersonIncomeUpdate("evaka.person.income.update"),
    PersonMerge("evaka.person.merge", securityEvent = true, securityLevel = "high"),
    PersonUpdate("evaka.person.update", securityEvent = true, securityLevel = "high"),
    PersonVtjFamilyUpdate("evaka.person.vtj-update"),
    PinCodeLockedRead("evaka.pin-locked.read"),
    PinCodeUpdate("evaka.pin.update"),
    PinLogin("evaka.pin.login"),
    PisFamilyRead("evaka.pis-family.read"),
    PlacementCancel("evaka.placement.cancel"),
    PlacementCreate("evaka.placement.create"),
    PlacementSketchingReportRead("evaka.placement-sketching-report.read"),
    PlacementPlanCreate("evaka.placement-plan.create"),
    PlacementPlanRespond("evaka.placement-plan.respond"),
    PlacementPlanDraftRead("evaka.placement-plan-draft.read"),
    PlacementPlanSearch("evaka.placement-plan.search"),
    PlacementProposalCreate("evaka.placement-proposal.create"),
    PlacementProposalAccept("evaka.placement-proposal.accept"),
    PlacementSearch("evaka.placement.search"),
    PlacementUpdate("evaka.placement.update"),
    PlacementServiceNeedCreate("evaka.placement.service-need.create"),
    PlacementServiceNeedDelete("evaka.placement.service-need.delete"),
    PlacementServiceNeedUpdate("evaka.placement.service-need.update"),
    PlacementTerminate("evaka.placement.terminate"),
    PlacementChildPlacementPeriodsRead("evaka.placement.child-placement-periods.read"),
    PresenceReportRead("evaka.presence-report.read"),
    RawReportRead("evaka.raw-report.read"),
    ServiceNeedOptionsRead("evaka.service-need-options.read"),
    ServiceNeedReportRead("evaka.service-need-report.read"),
    SettingsRead("evaka.settings.read"),
    SettingsUpdate("evaka.settings.update"),
    ServiceWorkerNoteUpdate("evaka.note.service-worer.update"),
    SextetReportRead("evaka.sextet-report.read"),
    UnitStaffAttendanceRead("evaka.unit-staff-attendance.read"),
    StaffAttendanceArrivalCreate("evaka.staff-attendance.arrival.create"),
    StaffAttendanceArrivalExternalCreate("evaka.staff-attendance.arrival-external.create"),
    StaffAttendanceDepartureCreate("evaka.staff-attendance.departure.create"),
    StaffAttendanceDepartureExternalCreate("evaka.staff-attendance.departure-external.create"),
    StaffAttendanceRead("evaka.staff-attendance.read"),
    StaffAttendanceUpdate("evaka.staff-attendance.update"),
    StaffAttendanceDelete("evaka.staff-attendance.delete"),
    StaffAttendanceExternalDelete("evaka.staff-attendance.external.delete"),
    StaffOccupancyCoefficientRead("evaka.staff-occupancy-coefficient.read"),
    StaffOccupancyCoefficientUpsert("evaka.staff-occupancy-coefficient.upsert"),
    StartingPlacementsReportRead("evaka.starting-placements-report.read"),
    UnitAclCreate("evaka.unit-acl.create"),
    UnitAclDelete("evaka.unit-acl.delete"),
    UnitAclRead("evaka.unit-acl.read"),
    UnitAttendanceReservationsRead("evaka.unit-attendance-reservations.read"),
    UnitCalendarEventsRead("evaka.unit.calendar-events.read"),
    UnitFeaturesRead("evaka.unit.features.read"),
    UnitFeaturesUpdate("evaka.unit.features.update"),
    UnitGroupAclUpdate("evaka.unit-group-acl.update"),
    UnitGroupsCreate("evaka.unit.groups.create"),
    UnitGroupsUpdate("evaka.unit.groups.update"),
    UnitGroupsDelete("evaka.unit.groups.delete"),
    UnitGroupsSearch("evaka.unit.groups.search"),
    UnitGroupsCaretakersCreate("evaka.unit.groups.caretakers.create"),
    UnitGroupsCaretakersDelete("evaka.unit.groups.caretakers.delete"),
    UnitGroupsCaretakersRead("evaka.unit.groups.caretakers.read"),
    UnitGroupsCaretakersUpdate("evaka.unit.groups.caretakers.update"),
    UnitCreate("evaka.unit.create"),
    UnitRead("evaka.unit.read"),
    UnitSearch("evaka.unit.search"),
    UnitUpdate("evaka.unit.update"),
    UnitStatisticsCreate("evaka.unit.statistics.create"),
    UnitView("evaka.unit.view"),
    VardaReportRead("evaka.varda-report.read"),
    VasuDocumentCreate("evaka.vasu-document.create"),
    VasuDocumentRead("evaka.vasu-document.read"),
    VasuDocumentReadByGuardian("evaka.vasu-document.read-by-guardian"),
    VasuDocumentGivePermissionToShareByGuardian("evaka.vasu-document.give-permission-to-share-by-guardian"),
    VasuDocumentUpdate("evaka.vasu-document.update"),
    VasuDocumentEventCreate("evaka.vasu-document-event.create"),
    VasuDocumentEditFollowupEntry("evaka.vasu-document.edit-followup"),
    VasuTemplateCreate("evaka.vasu-template.create"),
    VasuTemplateCopy("evaka.vasu-template.copy"),
    VasuTemplateEdit("evaka.vasu-template.edit"),
    VasuTemplateDelete("evaka.vasu-template.delete"),
    VasuTemplateRead("evaka.vasu-template.read"),
    VasuTemplateUpdate("evaka.vasu-template.update"),
    VoucherValueDecisionHeadOfFamilyCreateRetroactive("evaka.value-decision.head-of-family.create-retroactive"),
    VoucherValueDecisionHeadOfFamilyRead("evaka.value-decision.head-of-family.read"),
    VoucherValueDecisionMarkSent("evaka.value-decision.mark-sent"),
    VoucherValueDecisionRead("evaka.value-decision.read"),
    VoucherValueDecisionSearch("evaka.value-decision.search"),
    VoucherValueDecisionSend("evaka.value-decision.send"),
    VoucherValueDecisionSetType("evaka.value-decision.set-type"),
    VtjRequest("evaka.vtj.request", securityEvent = true, securityLevel = "high");

    fun log(targetId: Any? = null, objectId: Any? = null) {
        logger.audit(
            mapOf(
                "eventCode" to eventCode,
                "targetId" to targetId,
                "objectId" to objectId,
                "securityLevel" to securityLevel,
                "securityEvent" to securityEvent
            )
        ) { eventCode }
    }
}

private val logger = KotlinLogging.logger {}
