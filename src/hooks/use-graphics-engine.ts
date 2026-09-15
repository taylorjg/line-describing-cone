import { useCallback, useEffect, useRef } from "react";
import { ConeEngine } from "@app/graphics/cone-engine";
import type { ConeSettings, EngineStatus } from "@app/settings/types";

interface UseGraphicsEngineOptions {
  settings: ConeSettings;
  onStatus?: (status: EngineStatus) => void;
}

export function useGraphicsEngine({
  settings,
  onStatus,
}: UseGraphicsEngineOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ConeEngine | null>(null);
  const settingsRef = useRef(settings);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    settingsRef.current = settings;
    engineRef.current?.setSettings(settings);
  }, [settings]);

  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new ConeEngine(container, {
      onStatus: (status) => onStatusRef.current?.(status),
    });
    engineRef.current = engine;
    engine.setSettings(settingsRef.current);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const snapshot = useCallback(() => engineRef.current?.snapshot() ?? null, []);

  const restart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  return { containerRef, snapshot, restart };
}
