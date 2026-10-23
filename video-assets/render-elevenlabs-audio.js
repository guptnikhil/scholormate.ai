/**
 * render-elevenlabs-audio.js
 * Processes assets/audio/narration.mp3, converts to broadcast 48kHz stereo WAV,
 * renders a short preview first, and then assembles the full video.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const ROOT_DIR = path.resolve(__dirname, '..');
const INPUT_MP3 = path.join(ROOT_DIR, 'assets', 'audio', 'narration.mp3');
const AUDIO_DIR = path.join(__dirname, 'audio');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const PROCESSED_WAV = path.join(AUDIO_DIR, 'narration_elevenlabs_master.wav');

function getMediaDuration(filePath) {
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
  return 0;
}

/**
 * Normalizes input MP3 to 48kHz stereo WAV with broadcast mastering
 */
function prepareMasterAudio() {
  if (!fs.existsSync(INPUT_MP3)) {
    throw new Error(`Narration audio not found at ${INPUT_MP3}`);
  }

  console.log(`🎙️ Converting ${INPUT_MP3} to 48kHz stereo master WAV...`);
  // Resample to 48kHz 2-channel, gentle broadcast compression and volume normalization
  const cmd = `"${ffmpeg.path}" -y -i "${INPUT_MP3}" -ar 48000 -ac 2 -af "volume=1.1,compand=0.3|0.8:1|1:-70/-60|-20/-10|0/0:6:0:-90:0.2" "${PROCESSED_WAV}"`;
  execSync(cmd, { stdio: 'pipe' });

  const duration = getMediaDuration(PROCESSED_WAV);
  console.log(`✓ Master audio ready: ${PROCESSED_WAV} (${duration.toFixed(2)}s)`);
  return { path: PROCESSED_WAV, duration };
}

/**
 * Renders a short preview (first 35 seconds covering hero, dark mode, and finder)
 */
function renderPreview(masterAudioPath, durationSec = 35) {
  const previewOut = path.join(OUTPUT_DIR, 'elevenlabs-preview.mp4');
  const sourceVideo = path.join(OUTPUT_DIR, 'project-demo.mp4'); // Existing video footage

  console.log(`\n🎞️ Rendering short preview (${durationSec}s) to verify synchronization...`);

  const cmd = [
    `"${ffmpeg.path}"`,
    `-y`,
    `-ss 0`,
    `-t ${durationSec}`,
    `-i "${sourceVideo}"`,
    `-ss 0`,
    `-t ${durationSec}`,
    `-i "${masterAudioPath}"`,
    `-map 0:v`,
    `-map 1:a`,
    `-c:v copy`,
    `-c:a aac -b:a 192k`,
    `"${previewOut}"`
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
  const previewDur = getMediaDuration(previewOut);
  console.log(`✓ Preview rendered: ${previewOut} (${previewDur.toFixed(2)}s)`);

  // Generate contact sheet of preview
  const contactSheet = path.join(OUTPUT_DIR, 'elevenlabs-preview-contact-sheet.png');
  execSync(`"${ffmpeg.path}" -y -i "${previewOut}" -vf "fps=1/3,scale=480:270,tile=4x3" -frames:v 1 "${contactSheet}"`, { stdio: 'pipe' });
  console.log(`✓ Preview contact sheet: ${contactSheet}`);

  return { previewPath: previewOut, contactSheet, duration: previewDur };
}

/**
 * Renders full final video with ElevenLabs narration
 */
function renderFullVideo(masterAudioPath, audioDuration) {
  const finalOut = path.join(OUTPUT_DIR, 'project-demo-elevenlabs.mp4');
  const sourceVideo = path.join(OUTPUT_DIR, 'project-demo.mp4');

  console.log(`\n🎞️ Compositing full production video with ElevenLabs narration (${audioDuration.toFixed(2)}s)...`);

  // Conforms video footage with new ElevenLabs audio stream
  const cmd = [
    `"${ffmpeg.path}"`,
    `-y`,
    `-i "${sourceVideo}"`,
    `-i "${masterAudioPath}"`,
    `-filter_complex "[0:v]fps=30,tpad=stop_mode=clone:stop_duration=5[v]"`,
    `-map "[v]"`,
    `-map 1:a`,
    `-c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p`,
    `-c:a aac -b:a 192k -ar 48000`,
    `-t ${audioDuration.toFixed(2)}`,
    `"${finalOut}"`
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
  const finalDur = getMediaDuration(finalOut);
  const stats = fs.statSync(finalOut);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  // Generate contact sheet of full final video
  const contactSheet = path.join(OUTPUT_DIR, 'elevenlabs-contact-sheet.png');
  execSync(`"${ffmpeg.path}" -y -i "${finalOut}" -vf "fps=1/5,scale=480:270,tile=5x5" -frames:v 1 "${contactSheet}"`, { stdio: 'pipe' });

  console.log(`\n🎉 Full video render complete!`);
  console.log(`   📁 File: ${finalOut}`);
  console.log(`   ⏱️ Duration: ${finalDur.toFixed(2)}s`);
  console.log(`   📦 Size: ${sizeMb} MB`);
  console.log(`   🖼️ Contact Sheet: ${contactSheet}`);

  return { finalPath: finalOut, contactSheet, duration: finalDur, sizeMb };
}

module.exports = { prepareMasterAudio, renderPreview, renderFullVideo, getMediaDuration };
