# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

**⚠️ This app does not run in Expo Go.** It uses native modules (e.g. React Native Skia, Rive) that require a development build.

**Running on iOS (two steps):**

1. **Terminal 1** – start the Metro bundler (leave it running):
   ```bash
   npm start
   ```
2. **Terminal 2** – build and open the Grove app in the simulator:
   ```bash
   npm run ios
   ```

The app needs Metro running so it can load the JavaScript bundle. If you only run `npm run ios` without `npm start`, the app may open then crash or show a connection error. Do not open this project from inside the "Expo Go" app.

In the output of `npx expo start`, you can also use:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/) (recommended)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## iOS build: path with spaces

If `npm run ios` fails with **"No such file or directory"** or **EXConstants script failed**, your project path likely contains a **space** (e.g. `Desktop/Coding Projects/grove`). Xcode/CocoaPods scripts don’t quote it and the build breaks.

**Fix (pick one):**

1. **Move the project** to a path without spaces, then run from there:
   ```bash
   mv ~/Desktop/Coding\ Projects/grove ~/Desktop/grove
   cd ~/Desktop/grove && npm run ios
   ```

2. **Or use a symlink** so the project is also available at a path without spaces:
   ```bash
   ln -s ~/Desktop/Coding\ Projects/grove ~/Desktop/grove
   cd ~/Desktop/grove && npm run ios
   ```
   Open the project in Cursor/VS Code from `~/Desktop/grove` when working on iOS.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
