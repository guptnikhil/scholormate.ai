# ScholarMate AI — Automated Demo Video Generation Pipeline

This directory contains the end-to-end automated pipeline to record, narrate, subtitle, and render a high-definition (1920×1080 @ 30fps) portfolio product demo video for **ScholarMate AI**.

---

## Architecture & Components

1. **Single Timeline Source of Truth (`timeline.js` & `timeline-manifest.json`):**
   - Automatically measures actual narration audio durations using FFmpeg.
   - Computes global timeline offsets, action checkpoints, sentence durations, and subtitle timecodes.
   - Enforces a unified timebase across browser automation, speech, captions, and video assembly.

2. **Synchronized Browser Automation (`browser-automation.js`):**
   - Driven by **Playwright (Chromium)** at locked 1920×1080 resolution.
   - Smooth mouse cursor animation (`#v-cursor`) with 60fps compositor heartbeat to eliminate frame drops.
   - Executes visual actions strictly aligned with narration sentence cues.
   - Holds visual state on screen until voiceover completes, guaranteeing zero premature scene transitions.

3. **High-Fidelity Narration Synthesis (`generate-narration.js`):**
   - Synthesizes studio-grade voiceover audio files for each scene via macOS speech synthesis.
   - Converts to 48kHz stereo WAV with dynamic range normalization.

4. **Accurate Subtitles (`generate-subtitles.js`):**
   - Generates synchronized WebVTT and SRT subtitle tracks derived directly from the authoritative timeline manifest.

5. **Frame-Accurate Compositing & Assembly (`render-video.js`):**
   - Encodes each scene into strict 30 FPS Constant Frame Rate (CFR) MP4 clips (`output/scenes/`).
   - Uses `tpad` to clone final frames if browser actions settle ahead of audio, preventing black or frozen frames.
   - Losslessly concatenates scene clips into `output/project-demo.mp4`.
   - Generates multi-frame contact sheets (`output/contact-sheet.png` & `output/test-contact-sheet.png`) for visual QA.

---

## Quick Start & Regeneration

### 1. Requirements
- Node.js v18+ (tested on v24.14.0 arm64)
- Playwright Chromium (`npx playwright install chromium`)

### 2. Run Regression Test (3 Scenes)
Before rendering the full video, verify synchronization with the 3-scene test runner:
```bash
cd video-assets
npm run test-pipeline
```
Outputs: `../output/test-render.mp4` and `../output/test-contact-sheet.png`.

### 3. Generate Full Production Video (7 Scenes)
```bash
cd video-assets
npm run generate-demo
```

### 4. Running Against a Deployed URL
```bash
TARGET_URL="https://your-deployed-domain.com" npm run generate-demo
```

---

## Outputs & Deliverables
- **Production Video**: `output/project-demo.mp4` (1920×1080 @ 30 FPS, H.264/AAC, ~1m 58s)
- **Visual Contact Sheet**: `output/contact-sheet.png` (25-frame timeline inspection grid)
- **Regression Test Video**: `output/test-render.mp4` (3 scenes / 50s, 0.020s drift)
- **Regression Contact Sheet**: `output/test-contact-sheet.png`
- **Subtitles**: `video-assets/subtitles.srt` and `video-assets/subtitles.vtt`
