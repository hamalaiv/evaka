// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { waitUntilEqual, waitUntilTrue } from '../../../utils'
import {
  FileInput,
  TextInput,
  Page,
  Checkbox,
  Combobox,
  TreeDropdown
} from '../../../utils/page'

export default class MessagesPage {
  constructor(private readonly page: Page) {}

  #newMessageButton = this.page.find('[data-qa="new-message-btn"]')
  #sendMessageButton = this.page.find('[data-qa="send-message-btn"]')
  #closeMessageEditorButton = this.page.find(
    '[data-qa="close-message-editor-btn"]'
  )
  #discardMessageButton = this.page.find('[data-qa="discard-draft-btn"]')
  #senderSelection = new Combobox(this.page.findByDataQa('select-sender'))
  #receiverSelection = new TreeDropdown(
    this.page.find('[data-qa="select-receiver"]')
  )
  #inputTitle = new TextInput(this.page.find('[data-qa="input-title"]'))
  #inputContent = new TextInput(this.page.find('[data-qa="input-content"]'))
  #fileUpload = this.page.find('[data-qa="upload-message-attachment"]')
  #personalAccount = this.page.find('[data-qa="personal-account"]')
  #draftMessagesBoxRow = new TextInput(
    this.#personalAccount.find('[data-qa="message-box-row-DRAFTS"]')
  )
  #messageCopiesInbox = this.page.findByDataQa('message-box-row-COPIES')
  #receivedMessage = this.page.find('[data-qa="received-message-row"]')
  #draftMessage = this.page.find('[data-qa="draft-message-row"]')
  #messageContent = (index = 0) =>
    this.page.find(`[data-qa="message-content"][data-index="${index}"]`)

  #openReplyEditorButton = this.page.find(
    `[data-qa="message-reply-editor-btn"]`
  )
  discardMessageButton = this.page.find('[data-qa="message-discard-btn"]')
  #messageReplyContent = new TextInput(
    this.page.find('[data-qa="message-reply-content"]')
  )
  #urgent = new Checkbox(this.page.findByDataQa('checkbox-urgent'))
  #emptyInboxText = this.page.findByDataQa('empty-inbox-text')

  async getReceivedMessageCount() {
    return await this.page.findAll('[data-qa="received-message-row"]').count()
  }

  async isEditorVisible() {
    return (await this.page.findAll('[data-qa="input-content"]').count()) > 0
  }

  async existsSentMessage() {
    return (await this.page.findAll('[data-qa="sent-message-row"]').count()) > 0
  }

  async assertMessageIsSentForParticipants(nth: number, participants: string) {
    await this.page.findAll('[data-qa="message-box-row-SENT"]').first().click()
    await waitUntilEqual(
      () =>
        this.page
          .findAllByDataQa('sent-message-row')
          .nth(nth)
          .findByDataQa('participants').textContent,
      participants
    )
  }

  async assertReceivedMessageParticipantsContains(nth: number, str: string) {
    await this.page
      .findAllByDataQa('received-message-row')
      .nth(nth)
      .find('[data-qa="participants"]', { hasText: str })
      .waitUntilVisible()
  }

  async openInbox(index: number) {
    await this.page.findAll(':text("Saapuneet")').nth(index).click()
  }

  async openReplyEditor() {
    await this.#openReplyEditorButton.click()
  }

  async openFirstThreadReplyEditor() {
    await this.#receivedMessage.click()
    await this.#openReplyEditorButton.click()
  }

  async discardReplyEditor() {
    await this.discardMessageButton.click()
  }

  async fillReplyContent(content: string) {
    await this.#messageReplyContent.fill(content)
  }

  async assertReplyContentIsEmpty() {
    return waitUntilEqual(() => this.#messageReplyContent.textContent, '')
  }

  async sendNewMessage(message: {
    title: string
    content: string
    urgent?: boolean
    attachmentCount?: number
    sender?: string
    receiver?: string
  }) {
    const attachmentCount = message.attachmentCount ?? 0

    await this.#newMessageButton.click()
    await waitUntilTrue(() => this.isEditorVisible())
    await this.#inputTitle.fill(message.title)
    await this.#inputContent.fill(message.content)

    if (message.sender) {
      await this.#senderSelection.fillAndSelectFirst(message.sender)
    }
    if (message.receiver) {
      await this.#receiverSelection.open()
      await this.#receiverSelection.expandAll()
      await this.#receiverSelection.option(message.receiver).click()
      await this.#receiverSelection.close()
    } else {
      await this.#receiverSelection.open()
      await this.#receiverSelection.firstOption().click()
      await this.#receiverSelection.close()
    }
    if (message.urgent ?? false) {
      await this.#urgent.check()
    }

    if (attachmentCount > 0) {
      for (let i = 1; i <= attachmentCount; i++) {
        await this.addAttachment()
        await waitUntilEqual(
          () =>
            this.#fileUpload
              .findAll('[data-qa="file-download-button"]')
              .count(),
          i
        )
      }
    }
    await this.#sendMessageButton.click()
    await waitUntilEqual(() => this.isEditorVisible(), false)
  }

  async addAttachment() {
    const testFileName = 'test_file.png'
    const testFilePath = `src/e2e-test/assets/${testFileName}`
    await new FileInput(
      this.#fileUpload.find('[data-qa="btn-upload-file"]')
    ).setInputFiles(testFilePath)
  }

  async getEditorState() {
    return this.page
      .find('[data-qa="message-editor"]')
      .getAttribute('data-status')
  }

  async draftNewMessage(title: string, content: string) {
    await this.#newMessageButton.click()
    await waitUntilEqual(() => this.isEditorVisible(), true)
    await this.#inputTitle.fill(title)
    await this.#inputContent.fill(content)
    await this.#receiverSelection.open()
    await this.#receiverSelection.firstOption().click()
    await this.#receiverSelection.close()
    await this.page.keyboard.press('Enter')
    await waitUntilEqual(() => this.getEditorState(), 'clean')
  }

  async sendEditedMessage() {
    await this.#sendMessageButton.click()
    await waitUntilEqual(() => this.isEditorVisible(), false)
  }

  async closeMessageEditor() {
    await this.#closeMessageEditorButton.click()
    await waitUntilEqual(() => this.isEditorVisible(), false)
  }

  async discardMessage() {
    await this.#discardMessageButton.click()
    await waitUntilEqual(() => this.isEditorVisible(), false)
  }

  async assertMessageContent(index: number, content: string) {
    await this.#receivedMessage.click()
    await waitUntilEqual(() => this.#messageContent(index).innerText, content)
  }

  async assertDraftContent(title: string, content: string) {
    await this.#draftMessagesBoxRow.click()
    await waitUntilEqual(
      () =>
        this.#draftMessage.find('[data-qa="thread-list-item-title"]').innerText,
      title
    )
    await waitUntilEqual(
      () =>
        this.#draftMessage.find('[data-qa="thread-list-item-content"]')
          .innerText,
      content
    )
  }

  async assertNoDrafts() {
    await this.#draftMessagesBoxRow.click()
    await this.#emptyInboxText.waitUntilVisible()
  }

  async assertCopyContent(title: string, content: string) {
    await this.#messageCopiesInbox.click()
    await waitUntilEqual(
      () => this.page.findByDataQa('thread-list-item-title').innerText,
      title
    )
    await waitUntilEqual(
      () => this.page.findByDataQa('thread-list-item-content').innerText,
      content
    )
  }

  async assertNoCopies() {
    await this.#messageCopiesInbox.click()
    await this.#emptyInboxText.waitUntilVisible()
  }
}
