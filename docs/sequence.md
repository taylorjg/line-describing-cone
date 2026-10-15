# LDAC 2.0 sequence timeline

The browser study follows the stage timings inferred from Anthony McCall's
authoring software for *Line Describing a Cone 2.0* (2010).

Total loop: **1923 seconds** (~32 min). Only the **dot move** stage (1796 s)
advances the arc from 0 to 1.

| Stage | Duration (s) | Visual |
|-------|-------------|--------|
| black | 5 | Blackout |
| title in | 2 | Title fades in |
| title | 7 | Title hold |
| title out | 2 | Title fades out |
| black | 9 | Blackout |
| dot in | 2 | Projector light + wall dot fade in |
| dot pause | 4 | Dot held at 6 o'clock |
| dot move | 1796 | Arc draws; cone grows with beam |
| dot pause | 16 | Head held at end of arc |
| dot out | 2 | Head fades out |
| circle pause | 16 | Full circle held |
| circle out | 2 | Circle + light fade out |
| black | 60 | Closing blackout → loop |

**Physical model:** volumetric cone brightness tracks `lightOpacity`
(projector output in haze). Arc geometry extent tracks `arcProgress` during
dot move only.

Implementation: [`src/sequence/`](../src/sequence/).
