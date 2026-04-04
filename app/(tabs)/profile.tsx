import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { GroveColors, GroveSpacing, GroveBorderRadius } from '@/styles/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHabitStore } from '@/lib/store';
import {
  getBestStreak,
  getActiveDaysInMonth,
  getTotalCompletionsAllTime,
} from '@/lib/stats';
import { useRecoverOrphanedSession } from '@/hooks/useRecoverOrphanedSession';
import { useResolvedAvatarUri } from '@/hooks/useResolvedAvatarUri';
import { useAuth } from '@/contexts/auth-context';
import { useAvatarPreviewStore } from '@/lib/store/useAvatarPreviewStore';
import {
  AVATARS_BUCKET_MISSING_ERROR_NAME,
  setAvatarUrlFromLink,
  uploadAvatarFromUri,
} from '@/lib/avatar-upload';
import { getSupabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-env';
import { calendarDateKey } from '@/lib/calendarDate';
import { getAvatarUrl, getDisplayName } from '@/lib/user-display';

const GROWTH_STAGE = 'Seedling';

export default function ProfileScreen() {
  const { user, session, signOut, applySessionUser } = useAuth();
  const recoverOrphanedSession = useRecoverOrphanedSession();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [avatarUrlModalVisible, setAvatarUrlModalVisible] = useState(false);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState('');
  const setAvatarPreviewUri = useAvatarPreviewStore((s) => s.setAvatarPreviewUri);
  const resolvedAvatarUri = useResolvedAvatarUri(user);
  const storedAvatarUrl = getAvatarUrl(user);

  const userMetadataKey = user
    ? JSON.stringify(user.user_metadata ?? {})
    : '';

  useEffect(() => {
    if (!user) {
      setNameDraft('');
      return;
    }
    setNameDraft(getDisplayName(user));
  }, [user?.id, userMetadataKey]);

  const nameDirty = useMemo(() => {
    if (!user) return false;
    return nameDraft.trim() !== getDisplayName(user).trim();
  }, [nameDraft, user]);

  const onSaveDisplayName = useCallback(async () => {
    if (!user || savingName || !nameDirty) return;
    if (!isSupabaseConfigured) {
      Alert.alert('Not configured', 'Supabase is not configured.');
      return;
    }
    setSavingName(true);
    try {
      const { data, error } = await getSupabase().auth.updateUser({
        data: { display_name: nameDraft.trim() },
      });
      if (error) {
        if (await recoverOrphanedSession(error.message)) return;
        Alert.alert('Could not save name', error.message);
      } else if (data.user) {
        applySessionUser(data.user);
      }
    } finally {
      setSavingName(false);
    }
  }, [user, savingName, nameDirty, nameDraft, applySessionUser, recoverOrphanedSession]);

  const openAvatarUrlModal = useCallback(() => {
    setAvatarUrlDraft(storedAvatarUrl ?? '');
    setAvatarUrlModalVisible(true);
  }, [storedAvatarUrl]);

  const onSaveAvatarFromUrl = useCallback(async () => {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const res = await setAvatarUrlFromLink(avatarUrlDraft);
      if ('error' in res) {
        if (await recoverOrphanedSession(res.error.message)) return;
        Alert.alert('Could not save photo', res.error.message);
        return;
      }
      setAvatarPreviewUri(res.avatarUrl);
      applySessionUser(res.user);
      setAvatarUrlModalVisible(false);
    } finally {
      setUploadingAvatar(false);
    }
  }, [
    avatarUrlDraft,
    uploadingAvatar,
    setAvatarPreviewUri,
    applySessionUser,
    recoverOrphanedSession,
  ]);

  const onChangeProfilePhoto = useCallback(async () => {
    if (!user?.id || uploadingAvatar) return;

    if (Platform.OS === 'web') {
      openAvatarUrlModal();
      return;
    }

    const showPickerFailure = (msg: string) => {
      if (
        msg.includes('ExponentImagePicker') ||
        msg.includes('native module') ||
        msg.includes('Native module')
      ) {
        Alert.alert(
          'Photo library unavailable',
          'This build may be missing the native photo module. Reinstall with npx expo run:ios --device, or paste an image URL.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Paste image URL', onPress: () => openAvatarUrlModal() },
          ]
        );
        return;
      }
      Alert.alert('Something went wrong', msg);
    };

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          'Allow photo library access to set your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setAvatarPreviewUri(asset.uri);
      setUploadingAvatar(true);
      try {
        const res = await uploadAvatarFromUri(
          user.id,
          asset.uri,
          asset.mimeType ?? undefined,
          asset.base64
        );
        if ('error' in res) {
          setAvatarPreviewUri(null);
          if (await recoverOrphanedSession(res.error.message)) return;
          if (res.error.name === AVATARS_BUCKET_MISSING_ERROR_NAME) {
            Alert.alert(
              'Photo storage not ready',
              res.error.message,
              [
                { text: 'OK', style: 'cancel' },
                {
                  text: 'Use image URL',
                  onPress: () => openAvatarUrlModal(),
                },
              ]
            );
            return;
          }
          Alert.alert('Upload failed', res.error.message);
          return;
        }
        setAvatarPreviewUri(res.publicUrl);
        applySessionUser(res.user);
      } finally {
        setUploadingAvatar(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showPickerFailure(msg);
    }
  }, [
    user?.id,
    uploadingAvatar,
    openAvatarUrlModal,
    setAvatarPreviewUri,
    applySessionUser,
    recoverOrphanedSession,
  ]);

  const habits = useHabitStore((s) => s.habits);
  const completionDates = useHabitStore((s) => s.completionDates);
  const recordCompletion = useHabitStore((s) => s.recordCompletion);

  /** Bumps when the Profile tab gains focus so "today" and monthly stats refresh after day changes or app resume. */
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setStatsRefreshKey((k) => k + 1);
    }, [])
  );

  const growthStats = useMemo(() => {
    const now = new Date();
    const today = calendarDateKey(now);
    const year = now.getFullYear();
    const month = now.getMonth();
    return {
      longestStreak: getBestStreak(completionDates, habits, today),
      habitsCompleted: getTotalCompletionsAllTime(completionDates, habits, today),
      activeDaysThisMonth: getActiveDaysInMonth(
        completionDates,
        habits,
        today,
        year,
        month
      ),
    };
  }, [completionDates, habits, statsRefreshKey]);

  // Keep growth stats in sync with Habits: completed today must appear in completionDates (same as Progress tab).
  useEffect(() => {
    const todayKey = calendarDateKey();
    habits.forEach((h) => {
      if (h.completedToday) {
        const dates = completionDates[h.id] ?? [];
        if (!dates.includes(todayKey)) recordCompletion(h.id, todayKey);
      }
    });
  }, [habits, completionDates, recordCompletion]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="h1" style={styles.title}>
            Profile
          </AppText>
        </View>

        {/* User block: avatar, name, subtitle, badge */}
        <View style={styles.userBlock}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => void onChangeProfilePhoto()}
            activeOpacity={0.85}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo from photo library"
          >
            <ProfileAvatar
              uri={resolvedAvatarUri}
              accessToken={session?.access_token}
              imageStyle={styles.avatarImage}
              fallback={
                <IconSymbol
                  name="leaf.fill"
                  size={48}
                  color={GroveColors.primaryGreen}
                />
              }
            />
            {uploadingAvatar ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color={GroveColors.primaryGreen} />
              </View>
            ) : null}
          </TouchableOpacity>
          <AppText variant="small" style={styles.nameFieldLabel}>
            Display name
          </AppText>
          <View style={styles.userNameRow}>
            <TextInput
              style={styles.userNameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={GroveColors.secondaryText}
              maxLength={48}
              editable={!savingName}
              autoCapitalize="words"
              autoCorrect
            />
            <IconSymbol name="leaf.fill" size={18} color={GroveColors.primaryGreen} />
          </View>
          <TouchableOpacity
            style={[
              styles.saveNameButton,
              (!nameDirty || savingName) && styles.saveNameButtonDisabled,
            ]}
            onPress={() => void onSaveDisplayName()}
            disabled={!nameDirty || savingName}
            activeOpacity={0.85}
          >
            <AppText variant="small" style={styles.saveNameButtonText}>
              {savingName ? 'Saving…' : 'Save name'}
            </AppText>
          </TouchableOpacity>
          <AppText variant="paragraph" style={styles.subtitle}>
            Growing steadily
          </AppText>
          <View style={styles.badge}>
            <AppText variant="small" style={styles.badgeText}>
              {GROWTH_STAGE}
            </AppText>
            <IconSymbol name="leaf.fill" size={12} color={GroveColors.primaryGreen} />
          </View>
        </View>

        {/* Your Growth card */}
        <View style={styles.section}>
          <AppText variant="h2" style={styles.sectionTitle}>
            Your Growth
          </AppText>
          <View style={styles.growthCard}>
            <View style={styles.growthRow}>
              <MaterialIcons name="local-fire-department" size={20} color="#C96A1D" />
              <AppText variant="paragraph" style={styles.growthLabel}>
                Longest streak:
              </AppText>
              <AppText variant="paragraph" style={styles.growthValue}>
                {growthStats.longestStreak === 1
                  ? '1 day'
                  : `${growthStats.longestStreak} days`}
              </AppText>
            </View>
            <View style={styles.growthRow}>
              <MaterialIcons name="eco" size={20} color={GroveColors.primaryGreen} />
              <AppText variant="paragraph" style={styles.growthLabel}>
                Habits completed:
              </AppText>
              <AppText variant="paragraph" style={styles.growthValue}>
                {growthStats.habitsCompleted}
              </AppText>
            </View>
            <View style={styles.growthRow}>
              <MaterialIcons name="calendar-today" size={20} color={GroveColors.primaryText} />
              <AppText variant="paragraph" style={styles.growthLabel}>
                Active days:
              </AppText>
              <AppText variant="paragraph" style={styles.growthValue}>
                {growthStats.activeDaysThisMonth} this month
              </AppText>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={[styles.settingsRow, styles.settingsRowLast]}
              activeOpacity={0.7}
              onPress={() => {
                void signOut();
              }}
            >
              <MaterialIcons
                name="logout"
                size={22}
                color={GroveColors.primaryText}
              />
              <AppText variant="paragraph" style={styles.settingsLabel}>
                Sign out
              </AppText>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={GroveColors.secondaryText}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={avatarUrlModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarUrlModalVisible(false)}
      >
        <View style={styles.avatarUrlModalBackdrop}>
          <View style={styles.avatarUrlModalCard}>
            <AppText variant="h2" style={styles.avatarUrlModalTitle}>
              Paste image link
            </AppText>
            <AppText variant="small" style={styles.avatarUrlModalHint}>
              Optional fallback: paste a direct https link to an image. Your
              profile and Garden tab use the same photo. On this device, tap your
              avatar to choose from the photo library first.
            </AppText>
            <TextInput
              style={styles.avatarUrlInput}
              value={avatarUrlDraft}
              onChangeText={setAvatarUrlDraft}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={GroveColors.secondaryText}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!uploadingAvatar}
            />
            <View style={styles.avatarUrlModalActions}>
              <TouchableOpacity
                style={styles.avatarUrlModalButtonSecondary}
                onPress={() => setAvatarUrlModalVisible(false)}
                disabled={uploadingAvatar}
              >
                <AppText variant="paragraph" style={styles.avatarUrlModalButtonSecondaryText}>
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarUrlModalButtonPrimary}
                onPress={() => void onSaveAvatarFromUrl()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator color={GroveColors.white} />
                ) : (
                  <AppText variant="paragraph" style={styles.avatarUrlModalButtonPrimaryText}>
                    Save
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: GroveColors.primaryText,
    fontWeight: '700',
  },
  userBlock: {
    alignItems: 'center',
    marginBottom: GroveSpacing.sectionGap,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GroveColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameFieldLabel: {
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    color: GroveColors.secondaryText,
    marginBottom: 6,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
  },
  userNameInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: '700',
    color: GroveColors.primaryText,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: GroveBorderRadius.card,
    backgroundColor: GroveColors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GroveColors.inactive,
  },
  saveNameButton: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: GroveBorderRadius.pill,
    backgroundColor: GroveColors.primaryGreen,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveNameButtonDisabled: {
    opacity: 0.45,
  },
  saveNameButtonText: {
    color: GroveColors.white,
    fontWeight: '600',
  },
  subtitle: {
    color: GroveColors.secondaryText,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GroveColors.cardBackground,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: GroveBorderRadius.pill,
  },
  badgeText: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  section: {
    marginBottom: GroveSpacing.sectionGap,
  },
  sectionTitle: {
    color: GroveColors.primaryText,
    fontWeight: '600',
    marginBottom: 12,
  },
  growthCard: {
    backgroundColor: GroveColors.cardBackground,
    borderRadius: GroveBorderRadius.card,
    padding: GroveSpacing.cardPaddingHorizontal,
    paddingVertical: 18,
    gap: 14,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  growthLabel: {
    flex: 1,
    color: GroveColors.secondaryText,
  },
  growthValue: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GroveColors.inactive,
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsLabel: {
    flex: 1,
    color: GroveColors.primaryText,
  },
  bottomSpacer: {
    height: 40,
  },
  avatarUrlModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
  },
  avatarUrlModalCard: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    padding: 20,
    gap: 12,
  },
  avatarUrlModalTitle: {
    color: GroveColors.primaryText,
    fontWeight: '600',
  },
  avatarUrlModalHint: {
    color: GroveColors.secondaryText,
    lineHeight: 20,
  },
  avatarUrlInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GroveColors.inactive,
    borderRadius: GroveBorderRadius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: GroveColors.primaryText,
  },
  avatarUrlModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  avatarUrlModalButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  avatarUrlModalButtonSecondaryText: {
    color: GroveColors.secondaryText,
  },
  avatarUrlModalButtonPrimary: {
    backgroundColor: GroveColors.primaryGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: GroveBorderRadius.pill,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUrlModalButtonPrimaryText: {
    color: GroveColors.white,
    fontWeight: '600',
  },
});
