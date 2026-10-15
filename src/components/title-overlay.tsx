import { Box, Typography } from "@mui/material";

interface TitleOverlayProps {
  opacity: number;
}

export function TitleOverlay({ opacity }: TitleOverlayProps) {
  if (opacity <= 0) return null;

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        opacity,
      }}
    >
      <Typography
        variant="h4"
        component="p"
        sx={{
          color: "common.white",
          letterSpacing: "0.04em",
          fontWeight: 400,
          textAlign: "center",
          px: 2,
        }}
      >
        Line Describing a Cone 2.0
      </Typography>
    </Box>
  );
}
