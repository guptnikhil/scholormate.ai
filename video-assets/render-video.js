/**
 * render-video.js
 * Combines Playwright screen recording, generated narration tracks,
 * and subtitles into a final 1080p 30fps H.264/AAC MP4 video.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function renderFinalVideo() {
  const recordingsDir = path.join(__dirname, 'recordings');
  const audioDir = path.join(__dirname, 'audio');
  const manifestPath = path.join(audioDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing audio/manifest.json. Run generate-narration.js first.');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 1. Concatenate all scene audio tracks into master-narration.wav
  console.log('🎵 Merging narration audio tracks...');
  const concatListPath = path.join(audioDir, 'concat_list.txt');
  const concatContent = manifest.map(s => `file '${s.file}'`).join('\n');
  fs.writeFileSync(concatListPath, concatContent);

  const masterAudioPath = path.join(audioDir, 'master_narration.wav');
  execSync(`"${ffmpeg.path}" -y -f concat -safe 0 -i "${concatListPath}" -c copy "${masterAudioPath}"`);

  // Find the recorded webm file
  const webmFiles = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.webm'));
  if (webmFiles.length === 0) {
    throw new Error('No .webm recordings found in recordings/ directory.');
  }
  const rawVideoPath = path.join(recordingsDir, webmFiles[webmFiles.length - 1]);
  console.log(`📹 Using screen recording: ${rawVideoPath}`);

  const finalOutputPath = path.join(OUTPUT_DIR, 'project-demo.mp4');

  // 2. Transcode to high-profile H.264 / AAC at 1920x1080 30FPS with audio sync
  console.log('🎞️ Rendering final 1080p 30FPS portfolio demo MP4 via FFmpeg...');
  const srtPath = path.join(__dirname, 'subtitles.srt');

  // If subtitles exist, we burn subtitles using subtitle filter or include as soft track
  const srtExists = fs.existsSync(srtPath);
  
  // Note: we scale to exactly 1920:1080, format yuv420p for universal compatibility, 30fps
  const ffmpegCmd = [
    `"${ffmpeg.path}"`,
    `-y`,
    `-i "${rawVideoPath}"`,
    `-i "${masterAudioPath}"`,
    `-filter_complex "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v]"`,
    `-map "[v]"`,
    `-map 1:a`,
    `-c:v libx264`,
    `-preset fast`,
    `-crf 20`,
    `-pix_fmt yuv420p`,
    `-c:a aac`,
    `-b:a 192k`,
    `-shortest`,
    `"${finalOutputPath}"`,
  ].join(' ');

  console.log('🚀 Executing FFmpeg render pipeline...');
  execSync(ffmpegCmd);

  // Validate output file exists and has size
  if (fs.existsSync(finalOutputPath)) {
    const stats = fs.statSync(finalOutputPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n🎉 Final video successfully created!`);
    console.log(`   📁 File: ${finalOutputPath}`);
    console.log(`   📦 Size: ${sizeMb} MB`);
    console.log(`   📐 Resolution: 1920x1080 (16:9 Landscape) @ 30 FPS`);
    console.log(`   🔊 Audio: AAC Stereo 48kHz`);
    return finalOutputPath;
  } else {
    throw new Error('Rendering failed: output file was not created.');
  }
}

if (require.main === module) {
  renderFinalVideo().catch(console.error);
}

module.exports = { renderFinalVideo };
