---
name: Android toolchain
description: Durable Android build and runtime constraints for this workspace
---

Use OpenJDK 21 for Capacitor Android builds because the generated Capacitor Gradle configuration compiles Java source level 21. A release bundle can be produced with API 36 and the installed SDK packages, but the container's sdkmanager has repeatedly crashed with SIGBUS while installing an Android emulator system image, so runtime verification may require a physical device or an externally provisioned emulator.

**Why:** Java 17 rejects the generated source level, while Java 19 failed during Android JDK image transformation; emulator installation also exhausted temporary quota and then crashed in the JVM.

**How to apply:** Build Android artifacts with JDK 21 and verify on a connected Android device when no local emulator is available. Do not treat a successful Gradle/AAB build as proof of device runtime behavior.