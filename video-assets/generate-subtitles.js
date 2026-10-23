/**
 * generate-subtitles.js
 * Creates synchronized SRT and VTT subtitle files based on scene durations.
 */

const fs = require('fs');
const path = require('path');

function formatSRTTime(seconds) {
  const pad = (n, width = 2) => String(Math.floor(n)).padStart(width, '0');
  const h = pad(seconds / 3600);
  const m = pad((seconds % 3600) / 60);
  const s = pad(seconds % 60);
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
  return `${h}:${m}:${s},${ms}`;
}

function formatVTTTime(seconds) {
  const pad = (n, width = 2) => String(Math.floor(n)).padStart(width, '0');
  const h = pad(seconds / 3600);
  const m = pad((seconds % 3600) / 60);
  const s = pad(seconds % 60);
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function generateSubtitles(manifest, outputFileBase) {
  let srtContent = '';
  let vttContent = 'WEBVTT\n\n';
  let currentTime = 0;
  let counter = 1;

  manifest.forEach((scene) => {
    // Split scene text into natural sentence phrases (roughly 8-12 words per caption line)
    const sentences = scene.text.match(/[^.!?]+[.!?]+/g) || [scene.text];
    const phraseDuration = scene.duration / sentences.length;

    sentences.forEach((phrase) => {
      const start = currentTime;
      const end = currentTime + phraseDuration;
      const cleanPhrase = phrase.trim();

      // SRT entry
      srtContent += `${counter}\n`;
      srtContent += `${formatSRTTime(start)} --> ${formatSRTTime(end)}\n`;
      srtContent += `${cleanPhrase}\n\n`;

      // VTT entry
      vttContent += `${counter}\n`;
      vttContent += `${formatVTTTime(start)} --> ${formatVTTTime(end)}\n`;
      vttContent += `${cleanPhrase}\n\n`;

      counter++;
      currentTime = end;
    });
  });

  const srtPath = `${outputFileBase}.srt`;
  const vttPath = `${outputFileBase}.vtt`;

  fs.writeFileSync(srtPath, srtContent.trim());
  fs.writeFileSync(vttPath, vttContent.trim());

  console.log(`✅ Subtitles generated:\n   - ${srtPath}\n   - ${vttPath}`);
  return { srtPath, vttPath };
}

if (require.main === module) {
  const manifestPath = path.join(__dirname, 'audio', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    generateSubtitles(manifest, path.join(__dirname, 'subtitles'));
  } else {
    console.warn('Run generate-narration.js first to create audio manifest.');
  }
}

module.exports = { generateSubtitles };
