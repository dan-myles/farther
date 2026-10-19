import { TOKYO_NIGHT_THEME } from "@t3tools/shared/fartherThemes";

import { updateClientSettings } from "~/hooks/useSettings";

const SEEDED_KEY = "farther:defaults-seeded:v1";
const THEME_STORAGE_KEY = "t3code:theme";

/**
 * Farther's look differs from upstream's defaults: Tokyo Night, and no dev-build
 * artwork behind the brand. Seeded once per browser instead of changing upstream
 * defaults, so a later choice in Settings sticks and mobile is untouched.
 */
export function seedFartherDefaults(): void {
  try {
    if (localStorage.getItem(SEEDED_KEY) !== null) return;
    localStorage.setItem(SEEDED_KEY, "1");
    localStorage.setItem(THEME_STORAGE_KEY, TOKYO_NIGHT_THEME.id);
  } catch {
    return;
  }
  void updateClientSettings({ environmentIdentificationMode: "none" });
}
