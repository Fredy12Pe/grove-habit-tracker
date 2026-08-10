# Grove 🌱

Grove is a habit tracker that turns your daily habits into a small, living island. Every
habit you check off plants and grows a flower in your garden; skip a few days and it
wilts. A friendly Sprout mascot, a handful of calming mini-activities, and a Pomodoro
focus room live inside the same world — the goal is to make showing up for your habits
feel like tending a garden instead of filling out a checklist.

## Features

- **Habits** — create daily habits (from a curated catalog or custom), track streaks,
  and complete them from a simple list or from inside the game world.
- **Garden / island game** — an interactive 2D world (`app/(tabs)/game.tsx`) where each
  habit is a plant. A plant's growth stage (seed → sprout → bloom, or wilt if neglected)
  reflects real completion history. Wander the island, pet the cow, shake the tree, and
  walk inside the house.
- **Progress** — month and year heatmaps per habit, current/best streaks, and
  completion stats (`app/(tabs)/progress.tsx`).
- **Mini-activities** — guided breathing (Rive-animated), gratitude journaling, a sliding
  puzzle, and a Pomodoro focus timer ("Focus with Sprout") for short resets during the day.
- **Widgets** — an iOS home-screen widget mirrors your garden's growth stage.
- **Accounts** — sign in with email/password, Google, or Sign in with Apple via
  Supabase, or skip sign-in and use Grove as a local-only guest. Full account deletion
  is available from Profile.
- **Local-first data** — habits, streaks, and completions live in AsyncStorage via
  Zustand and work fully offline. Signed-in users also sync a habit snapshot to
  Supabase (`habit_snapshots`) so progress survives reinstalls and other devices.
  Guests stay device-local; auth identity and avatars still use Supabase as before.

## Tech stack

- [Expo](https://expo.dev) / React Native + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [Zustand](https://github.com/pmndrs/zustand) + AsyncStorage for local-first state
- [Supabase](https://supabase.com) for auth, avatar storage, and habit cloud sync
  (see `supabase/migrations`)
- [Rive](https://rive.app) for the mascot and breathing animations, with static-image
  fallbacks in Expo Go (no native Rive module there)
- [Sentry](https://sentry.io) for crash reporting, with a small analytics facade on top
  (`lib/sentry.ts`, `lib/analytics.ts`) — both are no-ops until a DSN is configured
- A native iOS widget extension (`@bacons/apple-targets`)

## Get started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from your
   Supabase project (Project Settings → API). `EXPO_PUBLIC_SENTRY_DSN` is optional —
   see `.env.example` for details. Restart `npx expo start` after any change.

3. **Set up the database (optional, for accounts)**

   Apply the SQL files in `supabase/migrations/` to your Supabase project (via the SQL
   editor or `supabase db push`) to get profile RLS policies, avatar storage, the
   account-deletion RPC, and habit cloud sync (`habit_snapshots`).

4. **Run the app**

   **⚠️ This app does not run in Expo Go.** It uses native modules (Rive, Sentry,
   Apple Sign-In, widgets) that require a development build. Don't open this project
   from inside the "Expo Go" app.

   **iOS (two terminals):**

   ```bash
   # Terminal 1 — start Metro and leave it running
   npm start

   # Terminal 2 — build and open the app in the simulator
   npm run ios
   ```

   If you only run `npm run ios` without `npm start`, the app may open then crash or
   show a connection error — Metro needs to be running to serve the JS bundle.

   **Android:**

   ```bash
   npm run android
   ```

## Project structure

```
app/                  Screens (Expo Router file-based routes)
  (tabs)/              Home (garden), Habits, Progress, Profile, Game
  onboarding/           First-run flow (habit picks, widgets, profile setup)
  breathe.tsx, gratitude.tsx, puzzles.tsx, house-desk.tsx   Mini-activities
components/            UI, game world rendering, cards, mascot, progress charts
contexts/              Auth + onboarding React context providers
lib/                   Habit store, cloud sync, stats, game world, Supabase client
supabase/migrations/   SQL for profiles, avatars, account deletion, habit_snapshots
ios/GroveWidgets/      iOS widget extension (Swift)
scripts/               Asset generation/sync (widgets, collision data, atlases)
```

## App Store / legal

- In-app **Privacy Policy** and **Terms of Use**: Profile settings and the login screen (`app/privacy.tsx`, `app/terms.tsx`; copy in `lib/legal.ts`).
- Hostable HTML for App Store Connect URLs: `docs/legal/privacy.html`, `docs/legal/terms.html`.
- Submission checklist + App Review notes paste: `docs/app-store-review-notes.md`.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Metro bundler |
| `npm run ios` / `npm run android` | Build and run the native app |
| `npm run lint` | Lint with `expo lint` |
| `npm run build-collision` | Rebuild the unified island walk area + collision grid from map assets |
| `npm run generate-atlas` | Regenerate the character sprite atlas |
| `npm run optimize-game-assets` | Compress game art assets |

## Troubleshooting

### iOS build fails with "No such file or directory" / EXConstants script failed

Your project path likely contains a **space** (e.g. `Desktop/Coding Projects/grove`) —
Xcode/CocoaPods scripts don't quote it and the build breaks.

**Fix (pick one):**

```bash
# Move the project to a path without spaces
mv ~/Desktop/Coding\ Projects/grove ~/Desktop/grove
cd ~/Desktop/grove && npm run ios
```

```bash
# Or symlink it and work from the symlink
ln -s ~/Desktop/Coding\ Projects/grove ~/Desktop/grove
cd ~/Desktop/grove && npm run ios
```

### Physical device can't load the JS bundle

Make sure the device is on the same Wi-Fi as your Mac, VPN is off, **Settings → Grove →
Local Network** is on, and macOS Firewall allows Node on port 8081. Otherwise use
`npm run start:tunnel` (works off-LAN, slower).

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase documentation](https://supabase.com/docs)
