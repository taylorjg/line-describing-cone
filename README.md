# Line Describing Cone — Study

A browser study of Anthony McCall’s *Line Describing a Cone 2.0* (2010). A minimal starting point: projector, dark screen wall, a slowly drawing white circle, and a hollow volumetric cone membrane — built up from here.

## About the artwork

Anthony McCall’s “solid light” work projects a white line that slowly traces a circle over thirty minutes. In a dark, haze-filled room the beam becomes a **hollow cone of light** that viewers can walk through. This study begins with the projected line on the screen; volumetric effects can be added later.

## Run locally

```bash
cd non-curated-repos/line-describing-cone
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

Deploy to GitHub Pages:

```bash
npm run deploy
```

## Controls

- **Play / Pause / Restart** — 30 min cycle at 60× time scale
- Drag to orbit the camera; scroll to zoom

## Architecture

React UI ↔ `useGraphicsEngine` hook ↔ `ConeEngine` (pure Three.js), following the pattern used in [kaleidoscope-web](../../curated-repos/kaleidoscope-web/).

```
src/graphics/     ConeEngine, wall arc, cone membrane beam, scene layout
src/hooks/        useGraphicsEngine, useConeSettings
src/components/   GraphicsCanvas, ControlPanel
```

## Visual references

Installation photos and video links live in [`docs/references/`](docs/references/manifest.json).

## Key references

- [Whitney — Line Describing a Cone](https://whitney.org/collection/works/15286)
- [McCall projection specifications](https://teachingandlearningcinema.org/2015/06/21/line-describing-a-cone-projection-specifications/)
- [TateShots video](https://www.youtube.com/watch?v=1-HWsxPnNNY)
- [Wikipedia](https://en.wikipedia.org/wiki/Line_Describing_a_Cone)

© Anthony McCall. This project is an independent study for personal experimentation.
