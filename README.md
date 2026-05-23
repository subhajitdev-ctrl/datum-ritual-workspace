# Datum Mobile Application

This is a high-performance React application powered by Vite, Tailwind CSS, and Capacitor for Android deployment.

## 🚀 How to Build the APK on Your Local Machine

When downloading this repository as a ZIP from GitHub, the `node_modules` directory is excluded (as it is ignored by Git). To initialize the Capacitor engine and sync the files correctly so Android Studio can compile, please follow these steps:

### 1. Install Dependencies and Sync Assets
Open your command line/terminal in the root directory and run the following commands:

```bash
# 1. Restore all dependencies (this creates the node_modules folder containing the Capacitor Android SDK)
npm install

# 2. Compile the production-ready web assets
npm run build

# 3. Synchronize the build output and configuration with the Android project
npx cap sync
```

### 2. Open and Build in Android Studio
1. Launch **Android Studio**.
2. Select **File > Open**, navigate to the `/android` folder inside this project, and click **Open**.
3. Wait for the Gradle sync to complete (it will now pass cleanly).
4. Build your APK: Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Your production-ready APK will be located under `android/app/build/outputs/apk/debug/app-debug.apk` and is fully ready to be run on any device or emulator!
