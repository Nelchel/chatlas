# Recovery Guide: `react-native-svg` on Android

## Error

### Metro bundling error
```
Unable to resolve "react-native-svg" from "node_modules/lucide-react-native/dist/esm/Icon.mjs"
```

### Android runtime error
```
No ViewManager defined for class RNSVGCircle
```

---

## Root Cause

This typically happens when `npm link react-native-svg` (or an incomplete install) is used, which corrupts the `node_modules/react-native-svg` folder (leaving it nearly empty). The build still succeeds, but the native module is not actually included in the APK, leading to the runtime error.

---

## Step-by-step Fix

### 1. Unlink / clean up `node_modules`

```sh
rm -rf node_modules/react-native-svg package-lock.json
npm install
```

After this, verify the module is back:

```sh
ls node_modules/react-native-svg | wc -l
# Should be ~15+ entries (android, apple, lib, src, ...), not just 2 (LICENSE + README)
```

### 2. Kill any lingering Metro server

An old Metro server can cache the broken state and serve a bad bundle even after reinstalling the module.

```sh
pkill -f metro
pkill -f "react-native"
```

### 3. Regenerate the native Android project + rebuild

```sh
npx expo prebuild --clean --platform android
npx expo run:android --no-build-cache
```

### 4. Reinstall the app on the emulator/device

If the error persists after the rebuild, the device may still be running an old APK cache. Force a full reinstall:

```sh
adb shell am force-stop com.chatlas.app
adb uninstall com.chatlas.app
npx expo run:android
```

### 5. Restart Metro with a clean cache

```sh
npx expo start -c
```

Then relaunch the app from the emulator (or via the dev-client URL).

---

## Prevention

- **Never use `npm link` with React Native packages.** It breaks Metro resolution and native autolinking.
- If you need to test local changes, use patch-package or develop in a separate test app.

---

*Last updated: 2026-07-07*
