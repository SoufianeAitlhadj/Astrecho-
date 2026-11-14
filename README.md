# The Machines We Left Behind · C.U.R.I.O.

NASA Space Apps Challenge · Storytelling track
React 19 · Vite · Tailwind CSS v4 · Framer Motion · Lucide · Google `<model-viewer>` · Web Audio API

## Quick start

### Option A: no install (just look at it)
Double-click **`OPEN-ME.html`**. It's the whole app in one file and works in Chrome, Edge, Firefox or Safari on a laptop.
(Do **not** double-click `index.html`: that's the source page and needs the dev server.)

### Option B: run the project (for editing)
Needs **Node.js 18.18 or newer** (`node -v` to check).

```bash
npm install
npm run fetch-models   # downloads the 3 NASA .glb hero models into public/models (do this before the demo)
npm run dev            # open the address it prints, usually http://localhost:5173
```

Other commands:

```bash
npm run build              # site for hosting → dist/ (drag dist/ onto Netlify, or `vercel deploy`)
npm run build:standalone   # rebuilds OPEN-ME.html → dist-standalone/index.html
```

### If something fails
- **`crypto.hash is not a function` or "Vite requires Node.js…"**: your Node is too old. Install the LTS version from nodejs.org.
- **`Cannot find module @rollup/rollup-…` or `lightningcss…`**: delete `node_modules` and `package-lock.json`, then run `npm install` again.
- **Blank page**: you opened `index.html` directly. Use `OPEN-ME.html` or `npm run dev`.
- **3D panel says "Model feed offline"**: run `npm run fetch-models` (needs internet), then restart `npm run dev`.

## Why `npm run fetch-models` matters

The 3D models live on `assets.science.nasa.gov`. If that server doesn't allow cross-site downloads from your domain, `<model-viewer>` can't load them straight from NASA. The script saves local copies and writes `public/models/manifest.json`, and the app uses the local copy when one exists, falling back to the NASA URL otherwise. If both fail, the 3D panel shows a "Model feed offline" state with a link to the NASA page, and the rest of the app keeps working.

## Where each feature lives

| Feature | File |
|---|---|
| Sound engine (drone, typing clicks, radar pips, whoosh, buzz, chime, stamp thud + chord) | `src/audio/SoundEngine.js` |
| Mute toggle, profile/passport state (saved in localStorage) | `src/context/SoundContext.jsx`, `src/context/ProfileContext.jsx` |
| Top HUD bar (astronaut, stamps x/3, passport button, mute) | `src/components/HudBar.jsx` |
| "Initialize Comms" splash + airlock | `src/views/SplashView.jsx` |
| C.U.R.I.O. robot + live oscilloscope mouth | `src/components/CurioAvatar.jsx` |
| Typewriter dialogue (synced clicks, click to skip) | `src/components/Dialogue.jsx`, `src/hooks/useTypewriter.js` |
| Onboarding (name → passport → intro story) | `src/views/OnboardingView.jsx` |
| Destination cards (stamp Locked / Completed) | `src/views/HubView.jsx`, `src/components/PlanetOrb.jsx` |
| Warp travel + countdown | `src/components/Starfield.jsx`, `src/components/TravelOverlay.jsx` |
| Horizontal parallax surface, locked devices, hero radar, minimap | `src/views/SurfaceView.jsx`, `src/components/DeviceSilhouette.jsx` |
| Split-screen scrollytelling | `src/views/StoryView.jsx` |
| 3D viewer, Blueprint mode, chapter camera moves, telemetry | `src/components/ModelPanel.jsx` |
| Real NASA photos as polaroids (verified IDs + live NASA Image Library search) | `src/components/ArchiveFrames.jsx`, `src/lib/mission.js` |
| Memory-check quiz with C.U.R.I.O. hints | `src/components/Quiz.jsx` |
| STAMP SLAM animation (drop → impact → fly into passport) | `src/components/StampSlam.jsx` |
| Passport modal + Space Relic Historian certificate (print + PNG download) | `src/components/PassportModal.jsx`, `src/components/Certificate.jsx` |
| All story text, dates, coordinates, quiz, stamps, NASA URLs | `src/data/missionData.js` |

## Sound design (no audio files)

Everything is synthesized live in `SoundEngine.js`:

- **Ambient drone:** detuned A-root oscillators (27.5–165 Hz) through a slowly breathing low-pass filter, plus band-passed "solar wind" noise. Starts on **Enter Airlock**.
- **Robot typing:** a band-passed noise relay click + a low "thock" per character, with an occasional square-wave telemetry blip on vowels. It runs on its own voice bus with an `AnalyserNode` that drives C.U.R.I.O.'s mouth.
- **Hover / click:** short sine radar pips.
- **Travel:** looping noise through a resonant low-pass sweep (110 Hz → 3.4 kHz → 80 Hz) with a gliding sub-bass rumble.
- **Wrong / right:** detuned square buzz ×2 / E-minor arpeggio chime.
- **Stamp:** pitch-dropping kick + noise slap + inharmonic metal partials + ratchet clicks, then a detuned-saw Cmaj9 chord opening through a filter, with tremolo bells. A synthetic convolution reverb is generated in code.

Browsers only allow audio after a click, which is why the first screen is "Click to Initialize Comms."

## Changing content

Edit `src/data/missionData.js`. Every NASA model and image URL is in the `ASSETS` block at the top. Device positions on the panoramas are `panoramaPosition.x` (0 to 1 across the track) and `.y` (0 to 1 down the screen).

## Notes for judges / NASA usage

- Images and 3D models: NASA, used under the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). No NASA logos or insignia are used. The mission patches are original SVG designs.
- The certificate is titled "Space Relic Historian" and says it is a NASA Space Apps Challenge project, not an official NASA document. That follows NASA's rule against implying endorsement.
- Voyager 1 (a locked Deep Space device) was added beyond the provided resource list for its live "one light-day from Earth" milestone on 2026-11-18. Swap it for Pioneer 11 in `missionData.js` if you must stay inside the list.
