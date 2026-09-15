import { forwardRef, useImperativeHandle } from "react";
import { Box } from "@mui/material";
import { useGraphicsEngine } from "@app/hooks/use-graphics-engine";
import type { ConeSettings, EngineStatus } from "@app/settings/types";

export interface GraphicsCanvasHandle {
  snapshot: () => string | null;
  restart: () => void;
}

interface GraphicsCanvasProps {
  settings: ConeSettings;
  onStatus?: (status: EngineStatus) => void;
}

export const GraphicsCanvas = forwardRef<
  GraphicsCanvasHandle,
  GraphicsCanvasProps
>(function GraphicsCanvas({ settings, onStatus }, ref) {
  const { containerRef, snapshot, restart } = useGraphicsEngine({
    settings,
    onStatus,
  });

  useImperativeHandle(ref, () => ({ snapshot, restart }), [snapshot, restart]);

  return (
    <Box
      ref={containerRef}
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        bgcolor: "#000000",
      }}
    />
  );
});
