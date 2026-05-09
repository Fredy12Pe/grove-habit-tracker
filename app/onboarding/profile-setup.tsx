import { AppText } from "@/components/ui/AppText";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  AVATARS_BUCKET_MISSING_ERROR_NAME,
  uploadAvatarFromUri,
} from "@/lib/avatar-upload";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { useAvatarPreviewStore } from "@/lib/store/useAvatarPreviewStore";
import { getDisplayName } from "@/lib/user-display";
import { GroveBorderRadius, GroveColors, GroveSpacing } from "@/styles/theme";
import { useAuth } from "@/contexts/auth-context";
import { useRecoverOrphanedSession } from "@/hooks/useRecoverOrphanedSession";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

/**
 * Same avatar pipeline as Profile: `updateUser` for display name, then `uploadAvatarFromUri`
 * (Storage + `user_metadata.avatar_url`).
 */
export default function OnboardingProfileSetupScreen() {
  const router = useRouter();
  const { user, session, isGuest, guestDisplayName, applySessionUser, setGuestDisplayName, setGuestAvatarUri } = useAuth();
  const recoverOrphanedSession = useRecoverOrphanedSession();
  const setAvatarPreviewUri = useAvatarPreviewStore((s) => s.setAvatarPreviewUri);

  const [name, setName] = useState("");
  const [picked, setPicked] = useState<{
    uri: string;
    mime?: string;
    base64?: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (isGuest) {
      if (guestDisplayName) setName(guestDisplayName);
      return;
    }
    if (!user) return;
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const existing =
      typeof meta?.display_name === "string" ? meta.display_name.trim() : "";
    if (existing) {
      setName(existing);
      return;
    }
    const dn = getDisplayName(user);
    if (dn && dn !== "Gardener") setName(dn);
  }, [user?.id, user?.user_metadata, isGuest, guestDisplayName]);

  const canContinue = useMemo(() => name.trim().length > 0, [name]);

  const onPickPhoto = useCallback(async () => {
    if (!user?.id && !isGuest) return;
    if (uploadingPhoto) return;

    if (Platform.OS === "web") {
      Alert.alert(
        "Photo on web",
        "You can add a profile photo later from the Profile tab.",
      );
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo library access to add a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setPicked({
        uri: asset.uri,
        mime: asset.mimeType ?? undefined,
        base64: asset.base64,
      });
      setAvatarPreviewUri(asset.uri);
      // For guests, persist the local URI so it survives app restarts
      if (isGuest) {
        await setGuestAvatarUri(asset.uri);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Something went wrong", msg);
    }
  }, [user?.id, isGuest, uploadingPhoto, setAvatarPreviewUri, setGuestAvatarUri]);

  const onNext = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    try {
      if (isGuest) {
        // Guest path: persist name locally, photo already persisted in onPickPhoto
        await setGuestDisplayName(trimmed);
      } else if (session && isSupabaseConfigured && user?.id) {
        // Authenticated path: write to Supabase
        const { data: nameData, error: nameErr } =
          await getSupabase().auth.updateUser({
            data: { display_name: trimmed },
          });
        if (nameErr) {
          if (await recoverOrphanedSession(nameErr.message)) return;
          Alert.alert("Could not save name", nameErr.message);
          return;
        }
        if (nameData.user) {
          applySessionUser(nameData.user);
        }

        if (picked) {
          setUploadingPhoto(true);
          try {
            const res = await uploadAvatarFromUri(
              user.id,
              picked.uri,
              picked.mime,
              picked.base64,
            );
            if ("error" in res) {
              if (await recoverOrphanedSession(res.error.message)) return;
              if (res.error.name === AVATARS_BUCKET_MISSING_ERROR_NAME) {
                Alert.alert("Photo storage not ready", res.error.message);
              } else {
                Alert.alert("Upload failed", res.error.message);
              }
              return;
            }
            applySessionUser(res.user);
            setAvatarPreviewUri(res.publicUrl);
          } finally {
            setUploadingPhoto(false);
          }
        }
      }

      router.push("/onboarding/widgets");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={busy}
        >
          <IconSymbol
            name="chevron.left"
            size={18}
            color={GroveColors.primaryText}
          />
          <AppText variant="paragraph" style={styles.backLabel}>
            Back
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h1" style={styles.title}>
          Let’s make it yours
        </AppText>
        <AppText variant="paragraphRegular" style={styles.subtitle}>
          Add your name and a photo to personalize your grove
        </AppText>

        <AppText variant="paragraph" style={styles.fieldLabel}>
          name
        </AppText>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={GroveColors.secondaryText}
          maxLength={48}
          editable={!busy}
          autoCapitalize="words"
          autoCorrect
        />

        <AppText variant="paragraph" style={[styles.fieldLabel, styles.photoLabel]}>
          photo (optional)
        </AppText>
        <TouchableOpacity
          style={styles.photoBox}
          onPress={() => void onPickPhoto()}
          activeOpacity={0.85}
          disabled={busy || uploadingPhoto}
          accessibilityRole="button"
          accessibilityLabel="Add profile photo"
        >
          {picked ? (
            <Image
              source={{ uri: picked.uri }}
              style={styles.photoImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons
                name="add-photo-alternate"
                size={48}
                color={GroveColors.primaryGreen}
              />
            </View>
          )}
          {uploadingPhoto ? (
            <View style={styles.photoLoading}>
              <ActivityIndicator color={GroveColors.primaryGreen} />
            </View>
          ) : null}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void onNext()}
          disabled={!canContinue || busy}
          style={({ pressed }) => [
            styles.primaryBtn,
            (!canContinue || busy) && styles.primaryBtnDisabled,
            pressed && canContinue && !busy && styles.primaryBtnPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={GroveColors.white} />
          ) : (
            <AppText variant="paragraph" style={styles.primaryBtnText}>
              Next
            </AppText>
          )}
        </Pressable>
        {!canContinue ? (
          <AppText variant="small" style={styles.helper}>
            Enter your name to continue
          </AppText>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: GroveColors.background,
  },
  headerNav: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLabel: {
    color: GroveColors.primaryText,
    fontSize: 15,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 24,
  },
  title: {
    color: "#4A6B2A",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#5C7D3C",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  fieldLabel: {
    color: "#4A6B2A",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    textTransform: "lowercase",
  },
  photoLabel: {
    marginTop: 20,
  },
  nameInput: {
    borderWidth: 1.5,
    borderColor: GroveColors.outline,
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: GroveColors.primaryText,
    fontWeight: "500",
  },
  photoBox: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 280,
    borderRadius: GroveBorderRadius.card,
    borderWidth: 1.5,
    borderColor: GroveColors.outline,
    backgroundColor: GroveColors.cardBackground,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249, 250, 241, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: GroveSpacing.screenPaddingHorizontal,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: GroveColors.primaryGreen,
    borderRadius: GroveBorderRadius.button,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnPressed: {
    opacity: 0.92,
  },
  primaryBtnText: {
    color: GroveColors.white,
    fontWeight: "700",
  },
  helper: {
    color: GroveColors.secondaryText,
    textAlign: "center",
  },
});
