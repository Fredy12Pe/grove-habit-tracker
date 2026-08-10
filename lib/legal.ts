/**
 * Legal / support copy for App Store compliance.
 *
 * Update SUPPORT_EMAIL before shipping if you use a different inbox.
 * Host the matching HTML under docs/legal/ (or your own site) and paste those
 * URLs into App Store Connect → App Information → Privacy Policy URL / Support URL.
 */

export const SUPPORT_EMAIL = 'support@grovehabits.app';

/** ISO date shown on Privacy / Terms screens. Bump when you change the copy. */
export const LEGAL_LAST_UPDATED = 'August 9, 2026';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Overview',
    paragraphs: [
      'Grove (“we”, “us”) is a habit-tracking and garden-style wellness app. This Privacy Policy explains what information we collect, how we use it, and the choices you have. Grove is not a medical device and does not provide medical advice.',
    ],
  },
  {
    heading: 'Information you provide',
    paragraphs: [
      'If you create an account, we collect account details such as your email address, display name, and optional profile photo. You may also store habit names, completion history, journal-style entries you choose to save, and similar content you enter in the app.',
      'You can use Grove as a guest without creating an account. Guest habit data stays on your device unless you later create an account and choose to sync.',
    ],
  },
  {
    heading: 'Information collected automatically',
    paragraphs: [
      'If crash reporting is enabled for your build, we may receive diagnostic data such as device type, OS version, app version, and stack traces when the app crashes or encounters errors. We use this only to fix bugs and improve stability.',
      'We do not sell your personal information. We do not use third-party advertising networks or cross-app tracking.',
    ],
  },
  {
    heading: 'How we use information',
    paragraphs: [
      'We use your information to provide and improve Grove: authenticate you, sync habits across your devices when signed in, show your garden and progress, store your profile photo, and respond to support requests.',
    ],
  },
  {
    heading: 'Storage and third-party services',
    paragraphs: [
      'Signed-in account and cloud sync data are processed by Supabase (authentication, database, and avatar storage). Optional crash reporting may be processed by Sentry when configured. These providers process data on our behalf under their own terms and security practices.',
      'Guest-mode habit data is stored locally on your device.',
    ],
  },
  {
    heading: 'Account deletion',
    paragraphs: [
      `Signed-in users can permanently delete their account in Profile → Delete account. This removes your auth account and associated cloud data (such as profile and habit snapshots) from our servers. Local data on your device is cleared when deletion succeeds. To request help, email ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Grove is not directed at children under 13, and we do not knowingly collect personal information from children under 13.',
    ],
  },
  {
    heading: 'Changes and contact',
    paragraphs: [
      `We may update this policy from time to time. The “Last updated” date at the top of this screen will change when we do. Questions: ${SUPPORT_EMAIL}.`,
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Agreement',
    paragraphs: [
      'By downloading or using Grove, you agree to these Terms of Use. If you do not agree, do not use the app.',
    ],
  },
  {
    heading: 'The service',
    paragraphs: [
      'Grove provides habit tracking, progress visuals, and optional calming mini-activities (such as breathing exercises). Grove is for personal wellness and productivity only. It is not medical, mental-health, or clinical care, and it does not diagnose, treat, or prevent any disease or condition.',
    ],
  },
  {
    heading: 'Accounts',
    paragraphs: [
      'You are responsible for activity under your account and for keeping your sign-in credentials secure. You may delete your account at any time from Profile. Guest use is limited to data stored on the current device.',
    ],
  },
  {
    heading: 'Acceptable use',
    paragraphs: [
      'Do not misuse Grove, attempt to disrupt the service, reverse engineer the app except where allowed by law, or use Grove for unlawful purposes.',
    ],
  },
  {
    heading: 'Intellectual property',
    paragraphs: [
      'Grove’s name, design, artwork, and software are owned by us or our licensors. You may not copy or redistribute them except as needed to use the app normally.',
    ],
  },
  {
    heading: 'Disclaimer and limitation of liability',
    paragraphs: [
      'Grove is provided “as is” without warranties of any kind to the fullest extent permitted by law. We are not liable for indirect, incidental, or consequential damages arising from your use of the app, including lost data or interrupted habits, except where liability cannot be limited under applicable law.',
    ],
  },
  {
    heading: 'Changes and contact',
    paragraphs: [
      `We may update these terms. Continued use after changes means you accept the updated terms. Questions: ${SUPPORT_EMAIL}.`,
    ],
  },
];
