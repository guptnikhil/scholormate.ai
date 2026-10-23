/**
 * generate-subtitles.js
 * Creates synchronized SRT and VTT subtitle files based on the authoritative timeline manifest.
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

function generateSubtitlesFromManifest(manifest, outputFileBase) {
  let srtContent = '';
  let vttContent = 'WEBVTT\n\n';
  let counter = 1;

  manifest.scenes.forEach((scene) => {
    scene.captions.forEach((cap) => {
      // SRT entry
      srtContent += `${counter}\n`;
      srtContent += `${formatSRTTime(cap.start)} --> ${formatSRTTime(cap.end)}\n`;
      srtContent += `${cap.text}\n\n`;

      // VTT entry
      vttContent += `${counter}\n`;
      vttContent += `${formatVTTTime(cap.start)} --> ${formatVTTTime(cap.end)}\n`;
      vttContent += `${cap.text}\n\n`;

      counter++;
    });
  });

  const srtPath = `${outputFileBase}.srt`;
  const vttPath = `${outputFileBase}.vtt`;

  fs.writeFileSync(srtPath, srtContent.trim());
  fs.writeFileSync(vttPath, vttContent.trim());

  console.log(`✅ Synchronized Subtitles generated from Timeline Manifest:`);
  console.log(`   - ${srtPath}`);
  console.log(`   - ${vttPath}`);
  return { srtPath, vttPath };
}

if (require.main === module) {
  const manifestPath = path.join(__dirname, 'timeline-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    generateSubtitlesFromManifest(manifest, path.join(__dirname, 'subtitles'));
  } else {
    console.warn('Run timeline.js first to create timeline-manifest.json.');
  }
}

module.exports = { generateSubtitlesFromManifest, formatSRTTime, formatVTTTime };
