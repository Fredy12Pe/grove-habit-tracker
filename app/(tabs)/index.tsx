import { Redirect } from 'expo-router';

export default function TabIndex() {
  // Open to Habits first so we don't load Skia on launch (avoids crash before Metro is ready).
  // Switch back to garden when stable: href="/(tabs)/garden"
  return <Redirect href="/(tabs)/habits" />;
}
