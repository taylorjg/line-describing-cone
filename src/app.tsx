import { useCallback, useEffect, useRef, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import {
  GraphicsCanvas,
  type GraphicsCanvasHandle,
} from "@app/components/graphics-canvas";
import { ControlPanel } from "@app/components/control-panel";
import { useConeSettings } from "@app/hooks/use-cone-settings";
import type { EngineStatus } from "@app/settings/types";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

export function App() {
  const { settings, setImmediate, togglePlaying } = useConeSettings();
  const [status, setStatus] = useState<EngineStatus>({ type: "idle" });
  const [collapsed, setCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<GraphicsCanvasHandle>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleStatus = useCallback((next: EngineStatus) => {
    setStatus(next);
  }, []);

  const handleSnapshot = useCallback(() => {
    const dataUrl = canvasRef.current?.snapshot();
    if (dataUrl) {
      downloadDataUrl(dataUrl, `line-describing-cone-${Date.now()}.png`);
    }
  }, []);

  const handleRestart = useCallback(() => {
    canvasRef.current?.restart();
    setImmediate({ playing: true, progress: 0 });
    setStatus({ type: "ready" });
  }, [setImmediate]);

  const handleToggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    } else {
      await document.documentElement.requestFullscreen?.();
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GraphicsCanvas
        ref={canvasRef}
        settings={settings}
        onStatus={handleStatus}
      />
      {settings.showControls && (
        <ControlPanel
          settings={settings}
          togglePlaying={togglePlaying}
          status={status}
          onSnapshot={handleSnapshot}
          onRestart={handleRestart}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}
    </ThemeProvider>
  );
}
