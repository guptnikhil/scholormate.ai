# ScholarMate AI — Automated Demo Video Generation Pipeline

This directory contains the end-to-end automated pipeline to record, narrate, subtitle, and render a high-definition (1920×1080 @ 30fps) portfolio product demo video for **ScholarMate AI**.

---

## Architecture & Components

1. **Browser Automation (`browser-automation.js`):**
   - Driven by **Playwright (Chromium)** at true 1920×1080 resolution.
   - Smooth mouse cursor animation and realistic human interaction cadence.
   - Visits every critical workflow:
     1. Hero landing & live-typing simulation.
     2. Zero-FOUC Dark / Light theme switching.
     3. Multi-criteria Scholarship Finder submission.
     4. Dynamic Directory filtering and sorting by amount & deadline.
     5. Scheme details & interactive Document Checklist (0% -> 100% progress).
     6. Direct NSP One-Time Registration (OTR) student portal links.
     7. AI Assistant conversational consultation with voice search.
     8. Branded closing card.

2. **Narration & Speech Synthesis (`generate-narration.js`):**
   - Uses high-quality system text-to-speech with natural cadence and tone.
   - Generates individual synchronized audio tracks for each scene.

3. **Subtitles & Timecoding (`generate-subtitles.js`):**
   - Generates synchronized WebVTT / SRT subtitle tracks matching narration pacing.

4. **Composition & Video Rendering (`render-video.js`):**
   - Compiles video tracks, narration audio, title cards, and subtitles using FFmpeg.
   - Outputs web-optimized 1080p H.264 / AAC MP4 file into `../output/project-demo.mp4`.

---

## Quick Start & Regeneration

### 1. Requirements
- Node.js v18+ (tested on v24.14.0 arm64)
- Playwright Chromium browser (`npx playwright install chromium`)

### 2. Running Locally
To generate the demo video:
```bash
# 1. Start the local server if not already running (or pass deployed URL)
python3 -m http.server 5500

# 2. Run the automated generation pipeline
cd video-assets
npm run generate-demo
```

### 3. Running Against a Deployed URL
```bash
TARGET_URL="https://your-deployed-domain.com" npm run generate-demo
```

---

## Output
The rendered, portfolio-ready demo video is saved at:
```
output/project-demo.mp4
```
- Resolution: 1920 × 1080
- Frame Rate: 30 FPS
- Video Codec: H.264
- Audio Codec: AAC
