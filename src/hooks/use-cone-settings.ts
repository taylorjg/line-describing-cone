import { useCallback, useMemo, useState } from "react";
import { DEFAULT_SETTINGS } from "@app/settings/defaults";
import type { ConeSettings } from "@app/settings/types";

export function useConeSettings() {
  const [settings, setSettings] = useState<ConeSettings>(DEFAULT_SETTINGS);

  const setImmediate = useCallback((patch: Partial<ConeSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const togglePlaying = useCallback(
    () => setImmediate({ playing: !settings.playing }),
    [setImmediate, settings.playing]
  );

  return useMemo(
    () => ({
      settings,
      setImmediate,
      togglePlaying,
    }),
    [settings, setImmediate, togglePlaying]
  );
}
