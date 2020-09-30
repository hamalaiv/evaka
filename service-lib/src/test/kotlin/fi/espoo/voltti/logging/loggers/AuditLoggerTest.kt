// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.voltti.logging.loggers

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.spi.ILoggingEvent
import fi.espoo.voltti.logging.utils.clearTestMessages
import fi.espoo.voltti.logging.utils.getTestAppender
import fi.espoo.voltti.logging.utils.getTestMessages
import fi.espoo.voltti.logging.utils.setupTestAppender
import mu.KLogger
import mu.KotlinLogging
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.springframework.test.context.junit4.SpringRunner

private val logger = KotlinLogging.logger {}.also(KLogger::setupTestAppender)
private val message = "audit message"

@RunWith(SpringRunner::class)
class AuditLoggerTest {
    @After
    fun clear() {
        logger.clearTestMessages()
    }

    @Test
    fun `audit log message logged`() {
        logger.audit { message }
        assertEquals(message, logger.getTestMessages().first())
    }

    @Test
    fun `log message added`() {
        logger.audit { message }

        val event = logger.getTestAppender().getEvents().first()
        assertEquals(message, event.message)
    }

    @Test
    fun `log added with audit marker`() {
        logger.audit { message }
        logger.audit(Throwable()) { message }
        logger.audit(emptyMap()) { message }

        logger.getTestAppender().getEvents().forEach { event ->
            assertEquals(AUDIT_MARKER, event.marker)
        }
    }

    @Test
    fun `log added as warn level log entry`() {
        logger.audit { message }

        val event = logger.getTestAppender().getEvents().first()
        assertEquals(Level.WARN, event.level)
    }

    @Test
    fun `arguments added to log entry`() {
        val args = mapOf("argKey" to "argVal")
        logger.audit(args) { message }

        val event = logger.getTestAppender().getEvents().first()
        compareArgs(args, event)
    }

    @Test
    fun `throwable logged`() {
        val throwableMessage = "Throwable message"
        val t = Throwable(throwableMessage)
        logger.audit(t) { message }

        val proxied = logger.getTestAppender().getEvents().first().throwableProxy

        assertEquals(throwableMessage, proxied.message)
    }

    private fun compareArgs(expectedArgs: Map<String, String>, event: ILoggingEvent) {
        assertEquals(expectedArgs.toString(), event.argumentArray.first().toString())
    }
}
