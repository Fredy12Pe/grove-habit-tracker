import React from 'react';

import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { PRIVACY_SECTIONS } from '@/lib/legal';

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen title="Privacy Policy" sections={PRIVACY_SECTIONS} />
  );
}
