# Precision Calculator Android release

The Android wrapper is built with Capacitor and packages the existing calculator UI as a local, offline-first WebView application. The web build is the source of truth; Android does not contain a second calculator implementation.

## Install dependencies

From the repository root:

```bash
pnpm install
```

The calculator package is also npm-installable when used on its own:

```bash
cd artifacts/simple-calculator
npm install
```

## Run the web version

From the repository root:

```bash
pnpm --filter @workspace/simple-calculator run dev
```

For a production web build:

```bash
cd artifacts/simple-calculator
npm run build
```

The production files are written to `artifacts/simple-calculator/dist/public`.

## Sync Android

Always build before syncing so Android receives the latest production web assets:

```bash
cd artifacts/simple-calculator
npm run build
npx cap sync android
```

The combined npm script is:

```bash
npm run android:sync
```

## Open Android Studio

```bash
cd artifacts/simple-calculator
npx cap open android
```

Android Studio must have an Android SDK with API 36 installed. The generated project uses:

- Application name: `Precision Calculator`
- Application ID: `com.precision.calculator`
- Minimum SDK: 24
- Compile SDK: 36
- Target SDK: 36
- Portrait orientation
- No app-declared permissions

## Build a signed Android App Bundle

For a local signed Gradle build, create `android/keystore.properties` locally. This file is ignored by Git and must never be committed:

```properties
storeFile=/absolute/path/to/precision-calculator-upload.jks
storePassword=use-a-secure-local-value
keyAlias=precision-calculator
keyPassword=use-a-secure-local-value
```

The same values can be supplied as local environment variables instead:

```bash
export ANDROID_KEYSTORE_PATH="/absolute/path/to/precision-calculator-upload.jks"
export ANDROID_KEYSTORE_PASSWORD="..."
export ANDROID_KEY_ALIAS="precision-calculator"
export ANDROID_KEY_PASSWORD="..."
```

Then run:

```bash
cd artifacts/simple-calculator
npm run android:release
```

Or run the Gradle task after syncing:

```bash
cd artifacts/simple-calculator/android
./gradlew bundleRelease
```

The generated bundle is located at:

```text
artifacts/simple-calculator/android/app/build/outputs/bundle/release/app-release.aab
```

If no local signing values are provided, Android Studio can sign the release bundle through **Build → Generate Signed Bundle / APK**. Keep the upload keystore and passwords in a password manager or another secure system. Google Play App Signing should be enabled for the Play-distributed app.

## Google Play Console next steps

1. Create the app in Google Play Console with the name `Precision Calculator`.
2. Complete the store listing, app category, contact details, privacy declarations, and content rating.
3. Upload `app-release.aab` to an internal testing track first.
4. Add screenshots for supported Android phone sizes and a 512 × 512 store listing icon.
5. Complete the Data safety form. This app has no account system, analytics, advertising SDK, or network-backed feature.
6. Complete the target audience and content declarations.
7. Test the internal release on physical Android devices before promoting it to production.
8. Submit the production release for Play review.

## Release notes

- The Android assets are bundled locally, so calculator operations do not require a network connection.
- No contacts, location, camera, microphone, SMS, storage, or notification permissions are requested.
- Signing credentials are read only from ignored local configuration or environment variables.