import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useGroveColors } from '@/hooks/useGroveColors';
import type { LegalSection } from '@/lib/legal';
import { LEGAL_LAST_UPDATED } from '@/lib/legal';
import { GroveSpacing } from '@/styles/theme';

type Props = {
  title: string;
  sections: LegalSection[];
};

export function LegalDocumentScreen({ title, sections }: Props) {
  const router = useRouter();
  const colors = useGroveColors();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/profile');
          }}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.deepText} />
        </Pressable>
        <AppText
          variant="h2"
          style={[styles.headerTitle, { color: colors.deepText }]}
          numberOfLines={1}
        >
          {title}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="small"
          style={[styles.updated, { color: colors.secondaryText }]}
        >
          Last updated: {LEGAL_LAST_UPDATED}
        </AppText>

        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <AppText
              variant="paragraph"
              style={[styles.heading, { color: colors.deepText }]}
            >
              {section.heading}
            </AppText>
            {section.paragraphs.map((p, i) => (
              <AppText
                key={`${section.heading}-${i}`}
                variant="small"
                style={[styles.body, { color: colors.secondaryText }]}
              >
                {p}
              </AppText>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 40,
    gap: 20,
  },
  updated: {
    marginBottom: 4,
  },
  section: {
    gap: 8,
  },
  heading: {
    fontWeight: '700',
    fontSize: 17,
  },
  body: {
    lineHeight: 22,
  },
});
