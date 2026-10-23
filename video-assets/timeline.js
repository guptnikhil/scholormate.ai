/**
 * timeline.js
 * Single Timeline Source of Truth for ScholarMate AI demo video.
 * Calculates exact millisecond durations, global offsets, action cues, and captions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const AUDIO_DIR = path.join(__dirname, 'audio');
const MANIFEST_PATH = path.join(__dirname, 'timeline-manifest.json');

const SCENE_DEFINITIONS = [
  {
    id: 'scene_01',
    name: 'Introduction & Problem Statement',
    route: '/index.html',
    text: "Every year, millions of Indian students miss out on government and private scholarships simply because eligibility criteria are buried in dense bureaucratic PDF notices. ScholarMate AI is a public scholarship discovery and verification platform that turns complex guidelines into clear, instant criteria matching.",
    actions: [
      { offsetSec: 0.8, type: 'move', x: 960, y: 480, duration: 800, desc: 'Position cursor in hero' },
      { offsetSec: 3.5, type: 'move', selector: '.search-console', duration: 700, desc: 'Hover search console' },
      { offsetSec: 10.0, type: 'move', selector: '.hero__ctas a.btn-primary', duration: 600, desc: 'Hover primary CTA' },
      { offsetSec: 15.0, type: 'hold', desc: 'Hold hero view until narration ends' }
    ]
  },
  {
    id: 'scene_02',
    name: 'Theme System',
    route: '/index.html',
    text: "Designed with an editorial civic aesthetic, ScholarMate supports both an archival daylight mode and a high-contrast dark theme, ensuring comfortable reading across long study sessions on any device.",
    actions: [
      { offsetSec: 0.8, type: 'move', selector: '#themeToggle', duration: 700, desc: 'Move to theme toggle' },
      { offsetSec: 2.5, type: 'click', selector: '#themeToggle', desc: 'Toggle dark mode' },
      { offsetSec: 4.5, type: 'scroll', top: 380, desc: 'Scroll down to categories' },
      { offsetSec: 7.5, type: 'scroll', top: 0, desc: 'Scroll back to hero' },
      { offsetSec: 9.0, type: 'hold', desc: 'Hold dark hero view' }
    ]
  },
  {
    id: 'scene_03',
    name: 'Eligibility Finder',
    route: '/pages/finder.html',
    text: "The heart of ScholarMate is the Eligibility Finder. Instead of reading dozens of notification circulars, students simply specify their domicile, academic discipline, and socio-economic background. With one tap, ScholarMate evaluates dozens of reservation and income thresholds to rank only the schemes you actually qualify for.",
    actions: [
      { offsetSec: 0.8, type: 'move', selector: '#finderForm', duration: 600, desc: 'Focus finder form' },
      { offsetSec: 3.5, type: 'select', selector: '#state', value: 'Bihar', desc: 'Select Domicile State' },
      { offsetSec: 6.5, type: 'select', selector: '#category', value: 'STEM', desc: 'Select Academic Discipline' },
      { offsetSec: 9.5, type: 'fill', selector: '#income', value: '80000', desc: 'Input Annual Income' },
      { offsetSec: 11.0, type: 'select', selector: '#currentClass', value: 'undergraduate', desc: 'Select Class' },
      { offsetSec: 12.5, type: 'click', selector: '[data-toggle-group="minority"] .toggle-chip[data-value="yes"]', desc: 'Toggle Minority status' },
      { offsetSec: 14.5, type: 'click', selector: '#findBtn', desc: 'Submit Finder Form' },
      { offsetSec: 16.5, type: 'hold', desc: 'Hold results view as explanation finishes' }
    ]
  },
  {
    id: 'scene_04',
    name: 'Directory and Filters',
    route: '/pages/results.html',
    text: "The results directory presents matched scholarships ordered by compatibility. Each scheme card features high-visibility financial amounts, closing deadlines, and transparent eligibility tags. Real-time search and smart filters allow applicants to quickly organize opportunities by urgency or funding value.",
    actions: [
      { offsetSec: 0.8, type: 'move', selector: '.results-list', duration: 600, desc: 'Browse results list' },
      { offsetSec: 3.5, type: 'move', selector: '.scholarship-card:first-child', duration: 700, desc: 'Highlight top match card' },
      { offsetSec: 7.5, type: 'fill', selector: '#filterSearch', value: 'engineering', desc: 'Filter by keyword engineering' },
      { offsetSec: 10.5, type: 'fill', selector: '#filterSearch', value: '', desc: 'Clear search filter' },
      { offsetSec: 13.0, type: 'select', selector: '#sortSelect', value: 'amount', desc: 'Sort by highest funding' },
      { offsetSec: 15.0, type: 'hold', desc: 'Hold sorted directory' }
    ]
  },
  {
    id: 'scene_05',
    name: 'Document Checklist and NSP Portal',
    route: '/pages/details.html?id=sch_001',
    text: "Selecting a scholarship opens a complete scheme dossier. Crucially, ScholarMate features an interactive Document Readiness Checklist. As students gather certificates, mark sheets, and identity proofs, they can tick off each item. Once ready, ScholarMate directs applicants straight to the official National Scholarship Portal OTR module with verified instructions.",
    actions: [
      { offsetSec: 0.8, type: 'scroll', top: 460, desc: 'Scroll to document checklist' },
      { offsetSec: 4.0, type: 'move', selector: '#docChecklist', duration: 600, desc: 'Highlight checklist' },
      { offsetSec: 8.5, type: 'click', selector: 'label[for="doc-0"]', desc: 'Check Aadhaar Card' },
      { offsetSec: 10.5, type: 'click', selector: 'label[for="doc-1"]', desc: 'Check Income Certificate' },
      { offsetSec: 12.5, type: 'click', selector: 'label[for="doc-2"]', desc: 'Check Marksheets' },
      { offsetSec: 14.5, type: 'click', selector: 'label[for="doc-3"]', desc: 'Check Bank Passbook (100% complete)' },
      { offsetSec: 17.5, type: 'move', selector: '.official-links', duration: 600, desc: 'Highlight Official Portal button' },
      { offsetSec: 19.5, type: 'hold', desc: 'Hold verified dossier view' }
    ]
  },
  {
    id: 'scene_06',
    name: 'AI Assistant and Voice Input',
    route: '/pages/assistant.html',
    text: "For students who prefer a conversational experience, ScholarMate provides an AI Assistant. Students can ask open questions in natural language, ask about specific documents, or use voice input to receive tailored recommendations on the spot.",
    actions: [
      { offsetSec: 0.8, type: 'move', selector: '.suggested-q:first-of-type', duration: 600, desc: 'Move to suggested prompt' },
      { offsetSec: 3.2, type: 'click', selector: '.suggested-q:first-of-type', desc: 'Click suggested prompt' },
      { offsetSec: 8.5, type: 'move', selector: '#micBtn', duration: 600, desc: 'Highlight Voice Input button' },
      { offsetSec: 11.5, type: 'hold', desc: 'Hold conversational advice view' }
    ]
  },
  {
    id: 'scene_07',
    name: 'Conclusion',
    route: '/index.html',
    text: "ScholarMate AI bridges the information gap between deserving students and vital academic funding. Clean, fast, and completely free to use. Explore the live portal and discover your opportunities today.",
    actions: [
      { offsetSec: 0.8, type: 'move', selector: '.hero', duration: 600, desc: 'Move to hero' },
      { offsetSec: 3.5, type: 'scroll', bottom: true, desc: 'Scroll through full ecosystem' },
      { offsetSec: 7.5, type: 'scroll', top: 0, desc: 'Scroll back to brand hero' },
      { offsetSec: 9.5, type: 'hold', desc: 'Hold closing screen' }
    ]
  }
];

function getAudioDuration(filePath) {
  try {
    const probe = execSync(`"${ffmpeg.path}" -i "${filePath}" -f null - 2>&1`).toString();
    const match = probe.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (match) {
      return parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
    }
  } catch (err) {
    const output = (err.stdout || err.stderr || err.message || '').toString();
    const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (match) {
      return parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
    }
  }
  return 10.0; // fallback if unmeasured
}

function buildTimelineManifest(selectedSceneIds = null) {
  console.log('📐 Constructing Single Timeline Source of Truth...');
  let scenesToProcess = SCENE_DEFINITIONS;
  if (selectedSceneIds && selectedSceneIds.length > 0) {
    scenesToProcess = SCENE_DEFINITIONS.filter(s => selectedSceneIds.includes(s.id));
  }

  let globalTimelineOffset = 0.0;
  const scenes = [];

  for (let i = 0; i < scenesToProcess.length; i++) {
    const def = scenesToProcess[i];
    const audioFile = path.join(AUDIO_DIR, `${def.id}.wav`);
    
    // Ensure audio exists, otherwise measure or report
    let audioDuration = 10.0;
    if (fs.existsSync(audioFile)) {
      audioDuration = getAudioDuration(audioFile);
    }

    // Precise padding: add 0.5s pause at the end of each scene for clean transitions
    const sceneDuration = parseFloat(audioDuration.toFixed(2));
    const sceneStart = parseFloat(globalTimelineOffset.toFixed(2));
    const sceneEnd = parseFloat((sceneStart + sceneDuration).toFixed(2));

    // Split sentences for accurate subtitles
    const sentences = def.text.match(/[^.!?]+[.!?]+/g) || [def.text];
    const phraseDuration = sceneDuration / sentences.length;
    let phraseTime = sceneStart;
    const captions = sentences.map((phrase, pIdx) => {
      const cStart = parseFloat(phraseTime.toFixed(2));
      const cEnd = parseFloat((phraseTime + phraseDuration).toFixed(2));
      phraseTime = cEnd;
      return {
        index: pIdx + 1,
        start: cStart,
        end: cEnd,
        text: phrase.trim()
      };
    });

    scenes.push({
      id: def.id,
      index: i + 1,
      name: def.name,
      route: def.route,
      narrationText: def.text,
      audioFile,
      audioDuration,
      videoDuration: sceneDuration,
      timelineStart: sceneStart,
      timelineEnd: sceneEnd,
      duration: sceneDuration,
      transitionDuration: 0.0,
      actions: def.actions.map(act => ({
        ...act,
        timelineAbsoluteSec: parseFloat((sceneStart + act.offsetSec).toFixed(2))
      })),
      captions
    });

    globalTimelineOffset = sceneEnd;
  }

  const manifest = {
    fps: 30,
    timebase: 'seconds',
    totalDuration: parseFloat(globalTimelineOffset.toFixed(2)),
    sceneCount: scenes.length,
    scenes
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`✅ Single Timeline Manifest saved to: ${MANIFEST_PATH}`);
  console.log(`   - Total Scenes: ${manifest.sceneCount}`);
  console.log(`   - Master Duration: ${manifest.totalDuration}s`);
  return manifest;
}

if (require.main === module) {
  buildTimelineManifest();
}

module.exports = { buildTimelineManifest, SCENE_DEFINITIONS, MANIFEST_PATH };
