// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.messaging.bulletin

import fi.espoo.evaka.daycare.domain.Language
import fi.espoo.evaka.emailclient.IEmailClient
import fi.espoo.evaka.shared.async.AsyncJobRunner
import fi.espoo.evaka.shared.async.SendUnreadBulletinNotificationEmail
import fi.espoo.evaka.shared.db.Database
import mu.KotlinLogging
import org.jdbi.v3.core.kotlin.mapTo
import org.springframework.core.env.Environment
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.OffsetDateTime
import java.util.UUID

private val logger = KotlinLogging.logger { }

@Service
class BulletinNotificationEmailService(
    private val asyncJobRunner: AsyncJobRunner,
    private val emailClient: IEmailClient,
    env: Environment
) {
    init {
        asyncJobRunner.sendBulletinNotificationEmail = ::sendBulletinNotification
    }

    val fromAddress = env.getRequiredProperty("mail_reply_to_address")

    data class BulletinReceiver(
        val id: UUID,
        val receiverId: UUID,
        val receiverEmail: String,
        val language: String?
    )

    fun getBulletinNotificationReceivers(tx: Database.Transaction, bulletinId: UUID): List<BulletinReceiver> {
        return tx.createQuery(
            """
            SELECT
                bi.id,
                bi.receiver_id,
                g.email receiver_email,
                g.language
            FROM bulletin_instance bi
            JOIN person g ON bi.receiver_id = g.id
            WHERE bi.bulletin_id = :bulletinId
            AND bi.read_at IS NULL
            AND bi.notification_sent_at IS NULL
            AND g.email IS NOT NULL
            """.trimIndent()
        )
            .bind("bulletinId", bulletinId)
            .mapTo<BulletinReceiver>()
            .toList()
    }

    fun scheduleSendingBulletinNotifications(tx: Database.Transaction, bulletinId: UUID) {
        val bulletinNotifications = getBulletinNotificationReceivers(tx, bulletinId)

        bulletinNotifications.forEach { notification ->
            if (!notification.receiverEmail.isNullOrBlank()) {
                asyncJobRunner.plan(
                    tx,
                    payloads = listOf(
                        SendUnreadBulletinNotificationEmail(
                            id = notification.id,
                            receiverId = notification.receiverId,
                            receiverEmail = notification.receiverEmail,
                            language = notification.language
                        )
                    ),
                    runAt = Instant.now(),
                    retryCount = 10
                )
            } else {
                logger.warn("Could not send bulletin notification email to guardian ${notification.receiverId}: missing email")
            }
        }
    }

    fun sendBulletinNotification(db: Database, msg: SendUnreadBulletinNotificationEmail) {
        db.transaction { tx ->
            val lang = getLanguage(msg.language)

            emailClient.sendEmail(
                traceId = msg.id.toString(),
                toAddress = msg.receiverEmail,
                fromAddress = fromAddress,
                getSubject(lang),
                getHtml(lang),
                getText(lang)
            )

            // Mark as sent
            tx.createUpdate(
                """
                UPDATE bulletin_instance 
                SET notification_sent_at = :sent_at
                WHERE id = :id
                """.trimIndent()
            )
                .bind("id", msg.id)
                .bind("sent_at", OffsetDateTime.now())
                .execute()
        }
    }

    private fun getLanguage(languageStr: String?): Language = when (languageStr) {
        "sv", "SV" -> Language.sv
        "en", "EN" -> Language.en
        else -> Language.fi
    }

    private fun getSubject(language: Language): String {
        val postfix = if (System.getenv("VOLTTI_ENV") == "prod") "" else " [${System.getenv("VOLTTI_ENV")}]"

        return when (language) {
            Language.en -> "Uusi tiedote eVakassa$postfix"
            Language.sv -> "Uusi tiedote eVakassa$postfix"
            else -> "New bulletin in eVaka$postfix"
        }
    }

    private fun getHtml(language: Language): String {
        return when (language) {
            Language.en -> """
<p>Sinulle on uusi viesti</p>
            """.trimIndent()
            Language.sv -> """
<p>Sinulle on uusi viesti</p>                
            """.trimIndent()
            else -> """
<p>Sinulle on uusi viesti</p>                
            """.trimIndent()
        }
    }

    private fun getText(language: Language): String {
        return when (language) {
            Language.en -> """
Sinulle on uusi viesti
            """.trimIndent()
            Language.sv -> """
Sinulle on uusi viesti
            """.trimIndent()
            else -> """
Sinulle on uusi viesti
            """.trimIndent()
        }
    }
}
