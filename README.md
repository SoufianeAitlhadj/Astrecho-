# The Machines We Left Behind · C.U.R.I.O.

**NASA Space Apps Challenge · Storytelling track** 

An immersive, narrated journey to the machines humans sent ahead of themselves and then left behind. You travel into space, choose a world, walk its surface, find a silent robot, and hear its story told by **C.U.R.I.O.** — Caretaker of Unheard Robots In Orbit — an old, warm, slightly creaky caretaker who remembers cassette tapes and has kept their stories so somebody still knows their names.

Everything in it is built on real, open NASA data: real coordinates, real archive photographs, real 3D models, real mission records.

---

## The experience

It is meant to be *lived*, not read. Every screen has a synthesized soundscape, a talking robot with an oscilloscope mouth, film grain, scanlines and a warp drive, and nothing is behind a loading wall.

**The journey**

1. **Initialize comms.** C.U.R.I.O. wakes up, introduces himself and asks your name. You are issued a Space Explorer Passport with three empty stamp slots.
2. **Travel.** From the mission map in high Earth orbit you choose where to go: **the Moon**, **Mars**, or **Deep Space**. The starfield warps and a countdown runs as you fly there.
3. **Walk the surface.** You slide sideways across a real NASA panorama of that world. Old machines stand in the dust. Most are locked — `TELEMETRY LOST`, `SIGNAL LOCKED` — and C.U.R.I.O. whispers about them as you pass. One of them still answers.
4. **Discover a machine.** Click it and its story opens: a NASA 3D model you can rotate and inspect on the left, and on the right the narrated film, the real archive photographs, and four written chapters that follow the machine from the drawing board to the place it stopped.
5. **Earn your stamp.** Two questions. Get both right and the stamp slams into your passport. No free stamps — wrong answers get a hint, never the answer.
6. **Finish.** Three stamps unlocks the Space Relic Historian certificate, printable from your passport.

**The three machines:** Apollo 11's lunar module *Eagle*, still standing in the Sea of Tranquility · the rover *Opportunity*, parked in Perseverance Valley on Mars · the probe *Pioneer 10*, drifting silently toward the star Aldebaran.

---

## How the media was made

**The films** — AI-generated **Vox-style explainers** built from **real NASA images and real NASA mission information**: motion graphics, annotated archive photography and data-driven visuals, cut to the beat of the narration. One film per mission:

| Story page | File | Runtime |
|---|---|---|
| Mars · Opportunity | `public/videos/Video2.mp4` (`Opportunity_vox.mp4`) | 1:57 |
| Deep Space · Pioneer 10 | `public/videos/Video3.mp4` (`pioneer10_vox.mp4`) | 3:33 |
| The Moon · Eagle | not made yet — the panel hides itself | — |

**The narration** — generated with the **ElevenLabs API** using the **Vincent** voice, chosen for its deep, relaxed delivery: the voice of someone telling you a story rather than reading you a report.

**Labelling and watermark** — every page carries the **Supersintelligence (SI)** watermark: a badge in the HUD bar that is on screen at all times, a quiet vertical mark on the left edge, and a credit line in the note that closes each page. Each film also carries an **AI-GENERATED FILM** label directly under the player, stating that the visuals were generated with AI from real NASA photographs and mission records and that the narration was synthesized with ElevenLabs — the facts are NASA's, the images, voice and motion are synthetic.

**The sound effects** — not files. Every sound in the app is **synthesized live in the browser** with the Web Audio API: a detuned ambient drone that breathes through a moving low-pass filter, relay-click typing that drives C.U.R.I.O.'s mouth in real time, radar pips on hover, a resonant sweep for warp travel, and a stamp impact built from a pitch-dropping kick, inharmonic metal partials and a Cmaj9 chord through a reverb generated in code.

---

## Ask C.U.R.I.O. — the RAG assistant

A floating **Ask C.U.R.I.O.** button sits on every screen, with a second one in the top HUD bar. It opens a chat with C.U.R.I.O. himself — **fun, warm and supportive**, never condescending, because many visitors are kids. He answers questions about the films, the photographs and the story texts.

He is a **retrieval-augmented (RAG) assistant over a fixed corpus of official NASA information**, not a free-roaming chatbot:

- **The corpus** is built from the NASA Space Apps reference library (NASA Image and Video Library, NSSDCA Master Catalog, JPL Photojournal, NASA 3D Resources, science.nasa.gov mission pages, NASA media guidelines), plus every story chapter, photo caption, telemetry readout and film description in the app — about **48 retrievable chunks**.
- **Retrieval runs in the browser.** A BM25 index with title weighting, phrase bonuses and visitor-to-archive synonyms ("video" → "film", "picture" → "photograph") picks the best five chunks. No embeddings, no vector database, no extra network call.
- **Generation is grounded.** Those five chunks go to the ChatGPT API numbered `[S1]`–`[S5]` with instructions to use nothing else and to cite every fact.
- **Every answer carries its sources.** Citations render as amber chips inside the answer, with the matching NASA links listed underneath, so any claim can be checked at its source in one click.
- **It says "I don't know."** If the archive has no answer, C.U.R.I.O. says so warmly instead of inventing one. Quiz answers are deliberately excluded from the corpus, so the stamps still have to be earned.
- **It survives a dead connection.** With no key or no internet it answers straight from the local archive with the same source list. The demo never dies on stage.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | **React 19** |
| Build tool | **Vite 6** (plus `vite-plugin-singlefile` for the offline one-file build) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`), custom HUD design tokens |
| Animation | **Framer Motion 12** — page transitions, scrollytelling, stamp physics |
| Icons | **Lucide React** |
| 3D | **Google `<model-viewer>`** rendering official NASA `.glb` models |
| Audio | **Web Audio API** — all sound effects synthesized at runtime, no audio assets |
| Narration | **ElevenLabs API** — "Vincent" voice (deep, relaxing) |
| Films | AI-generated **Vox-style** explainers from real NASA imagery and data |
| Chatbot | **OpenAI Chat Completions API** (`gpt-4o-mini` by default) |
| Retrieval | Custom **BM25** index, written from scratch, runs client-side |
| State | React Context + `localStorage` (passport, stamps, mute, API key) |
| Live NASA data | NASA Image and Video Library API (`images-api.nasa.gov`), no key required |
| Hosting | **Vercel** |

No backend, no database, no build-time content pipeline. The whole thing is a static site.

---

## Run it locally

Needs **Node.js 18.18+**.

```bash
npm install
```

```bash
npm run fetch-models
```

```bash
npm run dev
```

`fetch-models` downloads the three NASA `.glb` models into `public/models/` so the 3D viewer doesn't depend on NASA's CORS headers at demo time. Do it before presenting.

**For the chatbot**, copy `.env.example` to `.env.local` and add your key:

```bash
VITE_OPENAI_API_KEY=sk-...
```

You can also paste the key straight into the chat panel, which keeps it in that browser only. Without a key the chat still answers from the local archive.

**Other commands**

```bash
npm run build
```

```bash
npm run build:standalone
```

`build:standalone` produces `dist-standalone/index.html` — the entire app inlined into one file that runs by double-click with no server. `OPEN-ME.html` in the project root is a copy of it.

---

## Deploying to Vercel

Vercel auto-detects Vite: framework **Vite**, build command `npm run build`, output directory `dist`. No `vercel.json` needed — the app is a single page with no client-side router.

**Check the Root Directory.** It must point at the folder that holds `package.json`. In the published repository ([SoufianeAitlhadj/Astrecho-](https://github.com/SoufianeAitlhadj/Astrecho-)) this app *is* the repository root, so **Vercel → Settings → General → Root Directory** must be left **empty** (`./`). Pointing it at a subfolder such as `final_version/curio-app` makes Vercel miss `package.json`, and the build — and with it `api/curio.js` — fails immediately. If you ever deploy from a repository where the app sits in a subfolder, set that subfolder's path here instead.

Three more things to settle before the first deploy:

### 1. The API key — already handled, but set the right variable

This is a browser-only app, so anything named `VITE_*` is **compiled into the public JavaScript bundle**. A key put there can be read by any visitor with devtools open.

So the deployment uses a serverless function instead, [`api/curio.js`](api/curio.js), which Vercel picks up automatically. In **Vercel → Settings → Environment Variables** set:

| Name | Value |
|---|---|
| `OPENAI_API_KEY` | your key — **no** `VITE_` prefix |
| `OPENAI_MODEL` | optional, defaults to `gpt-4o-mini` |

**Do not set `VITE_OPENAI_API_KEY` in Vercel.** That is the one that leaks.

The chat wires itself up: on load it asks `GET /api/curio` whether a key is configured, and if so it routes every question through the function and stops offering the "paste a key" box. The panel header reads `SECURE UPLINK` when it is using the function. Retrieval still runs in the browser, so only the question and the five chosen excerpts cross the wire, and the function — not the caller — decides the model, the system prompt and the token ceiling.

Locally there is no function, so `npm run dev` falls back to `VITE_OPENAI_API_KEY` from `.env.local` or a key pasted into the panel. Both paths share the same prompt and call logic in [`src/knowledge/llm.js`](src/knowledge/llm.js).

### 2. The video files

The two `.mp4`s total about **103 MB** and are **committed**, so they ship with the deployment. They sit under GitHub's 100 MB per-file hard limit (62 MB and 40 MB) but above its 50 MB warning threshold, so expect a warning on push.

If the repo gets too heavy, or a push is rejected: host them on Vercel Blob, Cloudflare R2, S3 or any CDN, put the full `https://...` URL in `VIDEOS[...].src` in `src/data/missionData.js`, and re-add `public/videos/*.mp4` to `.gitignore`. The player accepts an absolute URL with no other change.

### 3. The 3D models

`public/models/*.glb` is also gitignored, and `public/models/manifest.json` is currently empty — so a deployed build falls back to loading models straight from `assets.science.nasa.gov`. That works, but it is slower and depends on NASA's CORS headers.

To serve them from your own domain, change the build command in Vercel to:

```bash
npm run fetch-models && npm run build
```

The models are then fetched at build time and bundled into the deployment. If NASA is unreachable during a build, the script skips that model and the app falls back to the NASA URL, so the build won't fail.

---

## Project structure

| Area | Files |
|---|---|
| All story text, dates, coordinates, quizzes, stamps, NASA URLs, film entries | `src/data/missionData.js` |
| Chat panel and launcher buttons | `src/components/AskCurio.jsx` |
| RAG corpus, BM25 retrieval, ChatGPT call | `src/knowledge/` |
| Shared prompt + OpenAI call (browser and server) | `src/knowledge/llm.js` |
| Serverless key proxy for Vercel | `api/curio.js` |
| NASA reference library (markdown, one section per source) | `src/knowledge/docs/` |
| Sound engine | `src/audio/SoundEngine.js` |
| C.U.R.I.O. robot + live oscilloscope mouth | `src/components/CurioAvatar.jsx` |
| Typewriter dialogue with synced clicks | `src/components/Dialogue.jsx`, `src/hooks/useTypewriter.js` |
| Splash, onboarding, mission map | `src/views/SplashView.jsx`, `OnboardingView.jsx`, `HubView.jsx` |
| Parallax surface walk, locked devices, radar, minimap | `src/views/SurfaceView.jsx`, `src/components/DeviceSilhouette.jsx` |
| Split-screen story + 3D viewer | `src/views/StoryView.jsx`, `src/components/ModelPanel.jsx` |
| Mission film player | `src/components/VideoPanel.jsx` |
| NASA archive photographs as polaroids | `src/components/ArchiveFrames.jsx`, `src/lib/mission.js` |
| Quiz, stamp slam, passport, certificate | `src/components/Quiz.jsx`, `StampSlam.jsx`, `PassportModal.jsx`, `Certificate.jsx` |

**Changing content:** edit `src/data/missionData.js`. Every NASA model and image URL lives in the `ASSETS` block at the top; chapter prose is `chapters[].paragraphs`; device positions on the panoramas are `panoramaPosition.x` (0–1 across the track) and `.y` (0–1 down the screen). Changes to the story text, the film summaries or the files in `src/knowledge/docs/` flow into the chatbot automatically — the corpus is rebuilt on load, with no index to regenerate.

---

## Troubleshooting

- **`crypto.hash is not a function`, or "Vite requires Node.js…"** — Node is too old; install the LTS from nodejs.org.
- **`Cannot find module @rollup/rollup-…` or `lightningcss…`** — delete `node_modules` and `package-lock.json`, run `npm install` again.
- **Blank page** — you opened `index.html` directly. Use `OPEN-ME.html` or `npm run dev`.
- **3D panel says "Model feed offline"** — run `npm run fetch-models` (needs internet), then restart the dev server.
- **Video panel says "VIDEO FILE NOT FOUND"** — the `.mp4` isn't where it's expected. The panel's **Choose video file** button always works as a fallback.
- **Chat header says `ARCHIVE MODE`** — no API key in that browser. Paste one into the chat panel, or set `VITE_OPENAI_API_KEY` in `.env.local` and restart.
- **Deployed, but the chat never calls OpenAI** — open `https://<your-deployment>/api/curio` in a browser. `{"configured":true}` means the function is live and holds the key, so the fault is in the request itself. `{"configured":false}` means `OPENAI_API_KEY` isn't reaching the function: check the spelling, that it is enabled for the Production environment, and redeploy — variables added after a build only apply to the next one. HTML or a 404 means the function was never deployed, which is almost always a wrong **Root Directory**.

---

## NASA data and usage

**[CREDITS.md](CREDITS.md) lists every resource used** — each NASA portal, mission page, photograph, 3D model and API, the non-NASA references, and the tools and libraries, with links.

Story facts, photographs, coordinates and 3D models come from the NASA Image and Video Library, the NSSDCA Master Catalog, the NASA/JPL Photojournal, NASA 3D Resources and science.nasa.gov mission pages, used under the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). NASA material is credited throughout and linked back to its source page.

**No NASA logo, insignia or seal is used anywhere.** The three mission patches and the certificate are original artwork, and the certificate states that it is a NASA Space Apps Challenge project rather than an official NASA document.

Three honest caveats are recorded in the app's own data notes: "My battery is low and it's getting dark" is a reporter's paraphrase of Opportunity's final telemetry, not a transmitted message; Apollo event dates cross midnight UT, so US-local dates can read a day earlier; and Earth-side coordinates and Opportunity's final resting position are approximate and flagged as such.


**Readme file and big parts of this work were made with the help of Claude Code**
