/**
 * When the user opens "Add custom habit" from the Add Habits sheet, we close the
 * sheet to navigate. This flag tells the Habits tab to re-open the sheet when
 * they return via the back chevron (not after saving, which clears the flag).
 */
let pending = false;

export function markReopenAddHabitSheetFromSheet() {
  pending = true;
}

export function clearReopenAddHabitSheetFromSheet() {
  pending = false;
}

export function takeReopenAddHabitSheetFromSheet(): boolean {
  if (!pending) return false;
  pending = false;
  return true;
}
