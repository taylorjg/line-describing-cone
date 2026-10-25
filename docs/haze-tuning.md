# Swirling haze (fluid density field)

The cone haze samples a **192×192** density texture in beam UV space (`u` = around the wall arc, `v` = projector → wall). Each frame:

1. **Advect** density with a procedural swirl velocity (inspired by [WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation), MIT).
2. **Splat** new density near the projector when `lightOpacity > 0`.
3. **Render** the main cone beam and two inner **haze shells** (82% / 62% along each ruling) using the same density map.

Simulation pauses when playback is stopped. Motion is deliberately **slow** (low advect scale, slowed `uTime` in the shader). Randomness comes from hash wobble in the velocity field and jittered splat placement/strength each frame. Tune in `haze-fluid-shaders.ts` (swirl speed, `48.0` backtrace scale) and `haze-fluid-solver.ts` (`uSwirl`, `uDissipation`, splat strength).

**Reference:** [Tate — Line Describing a Cone (short)](https://www.youtube.com/shorts/JJr-R6DYDg8); install crop in `docs/references/rochechouart-install-crop.jpg`.
