import { create } from 'zustand';

/**
 * Shows the picked image (file://) or uploaded URL before auth session metadata catches up,
 * so Profile and Garden update instantly after choosing from the camera roll.
 */
type AvatarPreviewState = {
  /** Local file URI from the picker, or https URL right after upload */
  avatarPreviewUri: string | null;
  setAvatarPreviewUri: (uri: string | null) => void;
};

export const useAvatarPreviewStore = create<AvatarPreviewState>((set) => ({
  avatarPreviewUri: null,
  setAvatarPreviewUri: (uri) => set({ avatarPreviewUri: uri }),
}));
