import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import type { ConeSettings, EngineStatus } from "@app/settings/types";

const panelSurfaceSx = {
  bgcolor: "rgba(0,0,0,0.72)",
  backdropFilter: "blur(8px)",
  color: "common.white",
};

interface ControlPanelProps {
  settings: ConeSettings;
  togglePlaying: () => void;
  status: EngineStatus;
  onSnapshot: () => void;
  onRestart: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ControlPanel({
  settings,
  togglePlaying,
  status,
  onSnapshot,
  onRestart,
  collapsed,
  onToggleCollapsed,
  isFullscreen,
  onToggleFullscreen,
}: ControlPanelProps) {
  const content = (
    <Stack spacing={1.5} sx={{ p: 2, minWidth: 220 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Line Describing Cone 2.0
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="outlined"
          startIcon={settings.playing ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={togglePlaying}
        >
          {settings.playing ? "Pause" : "Play"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={onRestart}
        >
          Restart
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          onClick={onSnapshot}
        >
          Snapshot
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? "Exit" : "Full"}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Status: {status.type}
      </Typography>
    </Stack>
  );

  return (
    <>
      <IconButton
        aria-label={collapsed ? "Open controls" : "Close controls"}
        onClick={onToggleCollapsed}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 3,
          ...panelSurfaceSx,
        }}
      >
        <TuneIcon />
      </IconButton>

      <Collapse in={!collapsed}>
        <Box
          sx={{
            position: "fixed",
            top: 64,
            right: 16,
            zIndex: 2,
            borderRadius: 1,
            ...panelSurfaceSx,
          }}
        >
          {content}
        </Box>
      </Collapse>
    </>
  );
}
