import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Habit } from "@/lib/types";

type OnboardingState = {
  selectedHabitIds: string[];
  setSelectedHabitIds: Dispatch<SetStateAction<string[]>>;
  /** Snapshot of habits before we apply a temporary preview for Screen 2. */
  previewHabitsSnapshot: Habit[] | null;
  setPreviewHabitsSnapshot: Dispatch<SetStateAction<Habit[] | null>>;
  resetOnboardingState: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [previewHabitsSnapshot, setPreviewHabitsSnapshot] = useState<Habit[] | null>(
    null,
  );

  const value = useMemo<OnboardingState>(
    () => ({
      selectedHabitIds,
      setSelectedHabitIds,
      previewHabitsSnapshot,
      setPreviewHabitsSnapshot,
      resetOnboardingState: () => {
        setSelectedHabitIds([]);
        setPreviewHabitsSnapshot(null);
      },
    }),
    [previewHabitsSnapshot, selectedHabitIds],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
