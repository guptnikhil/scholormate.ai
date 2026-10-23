/**
 * render-video.js
 * Composites individual scene recordings and narration audio into frame-accurate
 * MP4 clips and losslessly concatenates them into the final production video.
 * Also generates contact sheets and audio/visual validation diagnostics.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');
const SCENES_OUT_DIR = path.join(OUTPUT_DIR, 'scenes');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SCENES_OUT_DIR)) fs.mkdirSync(SCENES_OUT_DIR, { recursive: true });

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
 * Encodes an individual scene to 1920x1080 30fps CFR MP4 locked to scene.duration
 */
function renderSceneClip(scene, recordingsDir) {
  const webmPath = path.join(recordingsDir, `${scene.id}.webm`);
  if (!fs.existsSync(webmPath)) {
    throw new Error(`Recording for ${scene.id} not found at ${webmPath}`);
  }
  if (!fs.existsSync(scene.audioFile)) {
    throw new Error(`Audio for ${scene.id} not found at ${scene.audioFile}`);
  }

  const outSceneMp4 = path.join(SCENES_OUT_DIR, `${scene.id}.mp4`);
  console.log(`🎬 [FFmpeg] Encoding scene clip: ${scene.id} (${scene.duration}s)...`);

  // Pad last frame if needed, enforce 30fps CFR, scale to 1920x1080, and clamp to exact audio duration
  const cmd = [
    `"${ffmpeg.path}"`,
    `-y`,
    `-i "${webmPath}"`,
    `-i "${scene.audioFile}"`,
    `-filter_complex "[0:v]fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,tpad=stop_mode=clone:stop_duration=6[v]"`,
    `-map "[v]"`,
    `-map 1:a`,
    `-c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p`,
    `-c:a aac -b:a 192k -ar 48000`,
    `-t ${scene.duration}`,
    `"${outSceneMp4}"`
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });

  const duration = getMediaDuration(outSceneMp4);
  console.log(`   ✓ Clip ready: ${outSceneMp4} (Duration: ${duration.toFixed(2)}s)`);
  return outSceneMp4;
}

/**
 * Concatenates all rendered scene clips into the target output MP4
 */
function assembleClips(sceneFiles, finalOutputPath) {
  console.log(`\n🎞️ Assembling ${sceneFiles.length} clips into final MP4...`);
  const concatList = path.join(SCENES_OUT_DIR, 'concat_list.txt');
  const listContent = sceneFiles.map(f => `file '${f}'`).join('\n');
  fs.writeFileSync(concatList, listContent);

  const cmd = `"${ffmpeg.path}" -y -f concat -safe 0 -i "${concatList}" -c copy "${finalOutputPath}"`;
  execSync(cmd, { stdio: 'pipe' });

  const finalDuration = getMediaDuration(finalOutputPath);
  const stats = fs.statSync(finalOutputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 Output video assembled successfully!`);
  console.log(`   📁 Path: ${finalOutputPath}`);
  console.log(`   ⏱️ Duration: ${finalDuration.toFixed(2)}s`);
  console.log(`   📦 Size: ${sizeMb} MB`);
  return { path: finalOutputPath, duration: finalDuration, sizeMb };
}

/**
 * Generates visual contact sheet for timing and frame audit
 */
function generateContactSheet(videoPath, outputPath, intervalSec = 3, cols = 4, rows = 4) {
  console.log(`📸 Generating contact sheet audit image: ${outputPath}...`);
  try {
    const cmd = [
      `"${ffmpeg.path}"`,
      `-y`,
      `-i "${videoPath}"`,
      `-vf "fps=1/${intervalSec},scale=480:270,tile=${cols}x${rows}"`,
      `-frames:v 1`,
      `"${outputPath}"`
    ].join(' ');
    execSync(cmd, { stdio: 'pipe' });
    console.log(`   ✓ Contact sheet created: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.warn('Failed to generate contact sheet:', err.message);
    return null;
  }
}

/**
 * Full render function called by pipeline
 */
async function renderFromManifest(manifest, recordingsDir, outputFileName = 'project-demo.mp4') {
  const sceneClips = [];
  for (const scene of manifest.scenes) {
    const clipPath = renderSceneClip(scene, recordingsDir);
    sceneClips.push(clipPath);
  }

  const finalOutputPath = path.join(OUTPUT_DIR, outputFileName);
  const result = assembleClips(sceneClips, finalOutputPath);

  return result;
}

module.exports = { renderFromManifest, renderSceneClip, assembleClips, generateContactSheet, getMediaDuration };
