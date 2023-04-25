// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath(files("custom-ktlint-rules/custom-ktlint-rules.jar"))
        classpath(libs.ktlint)
    }
}

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.allopen)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.flyway)

    alias(libs.plugins.versions)
    alias(libs.plugins.kotlinter)
    alias(libs.plugins.ktfmt)
    alias(libs.plugins.owasp)

    idea
}

sourceSets {
    register("integrationTest") {
        compileClasspath += main.get().output + test.get().output
        runtimeClasspath += main.get().output + test.get().output
    }
}

val integrationTestImplementation: Configuration by configurations.getting {
    extendsFrom(configurations.testImplementation.get())
}

configurations["integrationTestRuntimeOnly"].extendsFrom(configurations.testRuntimeOnly.get())

idea {
    module {
        testSourceDirs = testSourceDirs + sourceSets["integrationTest"].kotlin.srcDirs
        testResourceDirs = testResourceDirs + sourceSets["integrationTest"].resources.srcDirs
    }
}

dependencies {
    api(platform(project(":evaka-bom")))
    implementation(platform(project(":evaka-bom")))
    testImplementation(platform(project(":evaka-bom")))
    runtimeOnly(platform(project(":evaka-bom")))
    integrationTestImplementation(platform(project(":evaka-bom")))

    // Kotlin + core
    api(kotlin("stdlib"))
    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit5"))
    integrationTestImplementation(kotlin("test"))
    integrationTestImplementation(kotlin("test-junit5"))

    // Logging
    implementation("ch.qos.logback:logback-access")
    implementation("io.github.microutils:kotlin-logging-jvm")
    implementation("net.logstash.logback:logstash-logback-encoder")

    // Spring
    api("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-web-services")
    implementation("org.springframework.ws:spring-ws-security") {
        exclude("org.bouncycastle", "bcpkix-jdk15on")
        exclude("org.bouncycastle", "bcprov-jdk15on")
    }
    implementation("org.springframework.ws:spring-ws-support") {
        exclude("org.eclipse.angus", "angus-mail")
    }
    implementation("org.springframework.boot:spring-boot-devtools")

    // Database-related dependencies
    implementation("com.zaxxer:HikariCP")
    implementation("org.flywaydb:flyway-core")
    implementation("org.postgresql:postgresql")

    // JDBI
    implementation("org.jdbi:jdbi3-core") {
        exclude("org.bouncycastle", "bcprov-jdk15on")
    }
    implementation("org.jdbi:jdbi3-jackson2")
    implementation("org.jdbi:jdbi3-kotlin")
    implementation("org.jdbi:jdbi3-postgres")

    // Fuel
    implementation("com.github.kittinunf.fuel:fuel")
    implementation("com.github.kittinunf.fuel:fuel-jackson")

    // Jackson
    implementation("com.fasterxml.jackson.core:jackson-core")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    runtimeOnly("com.fasterxml.jackson.datatype:jackson-datatype-jdk8")

    // AWS SDK
    implementation("software.amazon.awssdk:s3")
    implementation("software.amazon.awssdk:sts")
    implementation("software.amazon.awssdk:ses")

    // Voltti
    implementation(project(":service-lib"))

    // Flying Saucer <=>
    implementation("org.thymeleaf:thymeleaf")
    implementation("org.thymeleaf.extras:thymeleaf-extras-java8time")
    implementation("nz.net.ultraq.thymeleaf:thymeleaf-layout-dialect")
    implementation("org.xhtmlrenderer:flying-saucer-core")
    implementation("org.xhtmlrenderer:flying-saucer-pdf-openpdf")

    // Miscellaneous
    implementation("com.github.kagkarlsson:db-scheduler")
    implementation("com.auth0:java-jwt")
    implementation("io.micrometer:micrometer-registry-jmx")
    implementation("io.opentracing:opentracing-api")
    implementation("io.opentracing:opentracing-util")
    implementation("jakarta.annotation:jakarta.annotation-api")
    implementation("org.apache.commons:commons-pool2")
    implementation("org.apache.commons:commons-text")
    implementation("org.glassfish.jaxb:jaxb-runtime")
    implementation("org.bouncycastle:bcprov-jdk18on")
    implementation("org.bouncycastle:bcpkix-jdk18on")
    implementation("org.apache.tika:tika-core")
    implementation("org.apache.commons:commons-imaging")

    // JUnit
    testImplementation("org.junit.jupiter:junit-jupiter")

    testImplementation("net.bytebuddy:byte-buddy")
    testImplementation("net.logstash.logback:logstash-logback-encoder")
    testImplementation("org.jetbrains:annotations")
    testImplementation("org.mockito:mockito-core")
    testImplementation("org.mockito:mockito-junit-jupiter")
    testImplementation("org.mockito.kotlin:mockito-kotlin")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.ws:spring-ws-test")

    integrationTestImplementation("io.javalin:javalin")
    integrationTestImplementation("org.apache.cxf:cxf-rt-frontend-jaxws")
    integrationTestImplementation("org.apache.cxf:cxf-rt-transports-http")
    integrationTestImplementation("org.apache.cxf:cxf-rt-transports-http-jetty")
    integrationTestImplementation("org.apache.cxf:cxf-rt-ws-security") {
        exclude("org.bouncycastle", "bcpkix-jdk15on")
        exclude("org.bouncycastle", "bcprov-jdk15on")
    }

    implementation(project(":sficlient"))
    implementation(project(":vtjclient"))
}

allOpen {
    annotation("org.springframework.boot.test.context.TestConfiguration")
}

allprojects {
    tasks.withType<JavaCompile> {
        sourceCompatibility = libs.versions.java.get()
        targetCompatibility = libs.versions.java.get()
    }

    tasks.withType<KotlinCompile> {
        kotlinOptions.jvmTarget = libs.versions.java.get()
        kotlinOptions.allWarningsAsErrors = true
    }

    tasks.withType<Test> {
        useJUnitPlatform()
        filter {
            isFailOnNoMatchingTests = false
        }
    }

    tasks.register("resolveDependencies") {
        description = "Resolves all dependencies"
        doLast {
            configurations
                .matching { it.isCanBeResolved }
                .map {
                    val files = it.resolve()
                    it.name to files.size
                }
                .groupBy({ (_, count) -> count }) { (name, _) -> name }
                .forEach { (count, names) ->
                    println(
                        "Resolved $count dependency files for configurations: ${names.joinToString(", ")}"
                    )
                }
        }
    }
}

tasks.withType<KotlinCompile> {
    kotlinOptions.allWarningsAsErrors = name != "compileIntegrationTestKotlin"
}

tasks.getByName<Jar>("jar") {
    archiveClassifier.set("")
}

tasks.getByName<BootJar>("bootJar") {
    archiveClassifier.set("boot")
}

tasks {
    test {
        systemProperty("spring.profiles.active", "test")
    }

    register("integrationTest", Test::class) {
        useJUnitPlatform()
        group = "verification"
        systemProperty("spring.profiles.active", "integration-test")
        testClassesDirs = sourceSets["integrationTest"].output.classesDirs
        classpath = sourceSets["integrationTest"].runtimeClasspath
        shouldRunAfter("test")
        outputs.upToDateWhen { false }
    }

    bootRun {
        mainClass.set("fi.espoo.evaka.MainKt")
        // If you want to develop against VTJ, add vtj-dev here
        systemProperty("spring.profiles.active", "local")
    }

    register("bootRunTest", org.springframework.boot.gradle.tasks.run.BootRun::class) {
        mainClass.set("fi.espoo.evaka.MainKt")
        classpath = sourceSets["main"].runtimeClasspath
        systemProperty("spring.profiles.active", "local")
        systemProperty("spring.datasource.url", "jdbc:postgresql://localhost:15432/evaka_it")
        systemProperty("spring.datasource.username", "evaka_it")
        systemProperty("spring.datasource.password", "evaka_it")
        systemProperty("flyway.username", "evaka_it")
        systemProperty("flyway.password", "evaka_it")
    }

    register("generateVapidKey", JavaExec::class) {
        description = "Generate VAPID key for use with push notifications"
        mainClass.set("fi.espoo.evaka.webpush.VapidKeyGeneratorKt")
        classpath = sourceSets["test"].runtimeClasspath
    }

    dependencyCheck {
        failBuildOnCVSS = 0.0f
        analyzers.apply {
            assemblyEnabled = false
            nodeAuditEnabled = false
            nodeEnabled = false
            nuspecEnabled = false
        }
        suppressionFile = "$projectDir/owasp-suppressions.xml"
    }
}

ktfmt {
    kotlinLangStyle()
}
