/**
 * generate-narration.js
 * Synthesizes voiceover audio files for each scene using macOS high-fidelity TTS
 * and converts them to standard 48kHz stereo WAV / AAC via ffmpeg.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const AUDIO_DIR = path.join(__dirname, 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const SCENES = [
  {
    id: 'scene_01',
    name: 'Introduction & Problem Statement',
    text: "Every year, millions of Indian students miss out on government and private scholarships simply because eligibility criteria are buried in dense bureaucratic PDF notices. ScholarMate AI is a public scholarship discovery and verification platform that turns complex guidelines into clear, instant criteria matching.",
  },
  {
    id: 'scene_02',
    name: 'Theme System',
    text: "Designed with an editorial civic aesthetic, ScholarMate supports both an archival daylight mode and a high-contrast dark theme, ensuring comfortable reading across long study sessions on any device.",
  },
  {
    id: 'scene_03',
    name: 'Eligibility Finder',
    text: "The heart of ScholarMate is the Eligibility Finder. Instead of reading dozens of notification circulars, students simply specify their domicile, academic discipline, and socio-economic background. With one tap, ScholarMate evaluates dozens of reservation and income thresholds to rank only the schemes you actually qualify for.",
  },
  {
    id: 'scene_04',
    name: 'Directory and Filters',
    text: "The results directory presents matched scholarships ordered by compatibility. Each scheme card features high-visibility financial amounts, closing deadlines, and transparent eligibility tags. Real-time search and smart filters allow applicants to quickly organize opportunities by urgency or funding value.",
  },
  {
    id: 'scene_05',
    name: 'Document Checklist and NSP Portal',
    text: "Selecting a scholarship opens a complete scheme dossier. Crucially, ScholarMate features an interactive Document Readiness Checklist. As students gather certificates, mark sheets, and identity proofs, they can tick off each item. Once ready, ScholarMate directs applicants straight to the official National Scholarship Portal OTR module with verified instructions.",
  },
  {
    id: 'scene_06',
    name: 'AI Assistant and Voice Input',
    text: "For students who prefer a conversational experience, ScholarMate provides an AI Assistant. Students can ask open questions in natural language, ask about specific documents, or use voice input to receive tailored recommendations on the spot.",
  },
  {
    id: 'scene_07',
    name: 'Conclusion',
    text: "ScholarMate AI bridges the information gap between deserving students and vital academic funding. Clean, fast, and completely free to use. Explore the live portal and discover your opportunities today.",
  },
];

async function generateAll() {
  console.log('🎤 Generating narration audio tracks for each scene...');
  const voice = 'Samantha';
  const rate = 175; // natural conversational pacing

  const manifest = [];

  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    const rawFile = path.join(AUDIO_DIR, `${s.id}_raw.aiff`);
    const wavFile = path.join(AUDIO_DIR, `${s.id}.wav`);

    console.log(`🎙️ Recording [${s.id}] - ${s.name}...`);
    // Escape single quotes in text for bash
    const escapedText = s.text.replace(/'/g, "'\\''");
    execSync(`say -v "${voice}" -r ${rate} -o "${rawFile}" "${escapedText}"`);

    // Convert to clean 48kHz stereo WAV with subtle room normalization
    execSync(`"${ffmpeg.path}" -y -i "${rawFile}" -ar 48000 -ac 2 -af "volume=1.2,compand=0.3|0.8:1|1:-70/-60|-20/-10|0/0:6:0:-90:0.2" "${wavFile}"`);
    fs.unlinkSync(rawFile);

    // Get duration via ffmpeg -i input -f null -
    let durationSeconds = 0;
    try {
      const probe = execSync(`"${ffmpeg.path}" -i "${wavFile}" -f null - 2>&1`).toString();
      const match = probe.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        durationSeconds = parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
      }
    } catch (err) {
      const output = (err.stdout || err.stderr || err.message || '').toString();
      const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        durationSeconds = parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
      }
    }

    manifest.push({
      ...s,
      file: wavFile,
      duration: durationSeconds,
    });
    console.log(`   ✓ Duration: ${durationSeconds.toFixed(2)}s`);
  }

  fs.writeFileSync(path.join(AUDIO_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✅ Narration generation complete! Manifest saved to audio/manifest.json');
  return manifest;
}

if (require.main === module) {
  generateAll().catch(console.error);
}

module.exports = { generateAll, SCENES };
