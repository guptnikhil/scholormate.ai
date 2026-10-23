/**
 * generate-narration-elevenlabs.js
 * Synthesizes all 7 scene audio files using ElevenLabs TTS,
 * measures their exact millisecond durations, and rebuilds the timeline manifest.
 */

const fs = require('fs');
const path = require('path');
const { SCENE_DEFINITIONS, buildTimelineManifest } = require('./timeline');
const { generateSubtitlesFromManifest } = require('./generate-subtitles');
const {
  synthesizeSpeech,
  getApiKey,
  DEFAULT_VOICE_ID,
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_MODEL_ID
} = require('./elevenlabs-service');

const AUDIO_DIR = path.join(__dirname, 'audio');

async function generateAllElevenLabs(selectedVoiceId = null, customSettings = {}) {
  const voiceId = selectedVoiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const settings = { ...DEFAULT_VOICE_SETTINGS, ...customSettings };

  console.log('================================================================');
  console.log('🎙️ ElevenLabs Narration Generation for All 7 Scenes');
  console.log(`   Voice ID: ${voiceId}`);
  console.log(`   Model ID: ${DEFAULT_MODEL_ID}`);
  console.log(`   Settings: Stability=${settings.stability}, SimilarityBoost=${settings.similarity_boost}, Style=${settings.style}`);
  console.log('================================================================\n');

  // Ensure backup directory exists
  const backupDir = path.join(AUDIO_DIR, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    // Backup existing files if any
    const existing = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.wav'));
    existing.forEach(f => fs.copyFileSync(path.join(AUDIO_DIR, f), path.join(backupDir, f)));
  }

  const manifest = [];

  for (let i = 0; i < SCENE_DEFINITIONS.length; i++) {
    const scene = SCENE_DEFINITIONS[i];
    const outWav = path.join(AUDIO_DIR, `${scene.id}.wav`);

    console.log(`🎙️ [${scene.id}] Synthesizing "${scene.name}"...`);
    const res = await synthesizeSpeech(scene.text, outWav, voiceId, settings);

    console.log(`   ✓ Duration: ${res.duration.toFixed(2)}s -> ${outWav}`);

    manifest.push({
      id: scene.id,
      name: scene.name,
      text: scene.text,
      file: outWav,
      duration: res.duration
    });
  }

  // Update audio manifest
  fs.writeFileSync(path.join(AUDIO_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Rebuild single timeline source of truth and subtitles
  console.log('\n📐 Rebuilding Single Timeline Source of Truth with new audio durations...');
  const timelineManifest = buildTimelineManifest();

  console.log('\n📝 Rebuilding synchronized subtitles...');
  generateSubtitlesFromManifest(timelineManifest, path.join(__dirname, 'subtitles'));

  console.log('\n================================================================');
  console.log(`🎉 All 7 Scenes Successfully Generated with ElevenLabs!`);
  console.log(`   - Master Duration: ${timelineManifest.totalDuration.toFixed(2)}s`);
  console.log('================================================================');

  return { audioManifest: manifest, timelineManifest };
}

if (require.main === module) {
  generateAllElevenLabs().catch(err => {
    console.error('Fatal error during ElevenLabs generation:', err);
    process.exit(1);
  });
}

module.exports = { generateAllElevenLabs };
