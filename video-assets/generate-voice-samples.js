/**
 * generate-voice-samples.js
 * Generates 3 comparison audio samples using ElevenLabs for user evaluation.
 */

const path = require('path');
const fs = require('fs');
const {
  fetchAccountVoices,
  generateVoiceSamples,
  getApiKey,
  DEFAULT_VOICE_ID,
  DEFAULT_VOICE_SETTINGS
} = require('./elevenlabs-service');

async function main() {
  console.log('================================================================');
  console.log('🎙️ ElevenLabs Voice Sample Generator (3 Options)');
  console.log('================================================================\n');

  try {
    getApiKey();
  } catch (err) {
    console.error('❌ Missing ElevenLabs API Key!');
    console.error('Please configure your API key by running:');
    console.error('  export ELEVENLABS_API_KEY="your_api_key_here"');
    console.error('or adding it to video-assets/.env:');
    console.error('  echo "ELEVENLABS_API_KEY=your_key" > video-assets/.env\n');
    process.exit(1);
  }

  // Sample representative script from Scene 1
  const sampleScript = "ScholarMate AI is a public scholarship discovery and verification platform that turns complex bureaucratic guidelines into clear, instant criteria matching.";

  let candidateVoices = [];

  try {
    console.log('🔍 Querying available voices from your configured ElevenLabs account...');
    const accountVoices = await fetchAccountVoices();
    console.log(`✓ Retrieved ${accountVoices.length} voices from account.`);

    // 1. Prioritize user specified voice: f1abxvIEijusskcPWE5x
    const requestedVoice = accountVoices.find(v => v.voice_id === DEFAULT_VOICE_ID);
    if (requestedVoice) {
      candidateVoices.push({ name: requestedVoice.name, voiceId: requestedVoice.voice_id });
    } else {
      candidateVoices.push({ name: 'User Selected Voice', voiceId: DEFAULT_VOICE_ID });
    }

    // 2. Add two other top voices from account
    for (const v of accountVoices) {
      if (candidateVoices.length >= 3) break;
      if (!candidateVoices.some(cv => cv.voiceId === v.voice_id)) {
        candidateVoices.push({ name: v.name, voiceId: v.voice_id });
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch voice list from API endpoint:', err.message);
    console.log('Using standard candidate voice IDs (including requested voice f1abxvIEijusskcPWE5x)...');
    candidateVoices = [
      { name: 'Selected Custom Voice', voiceId: 'f1abxvIEijusskcPWE5x' },
      { name: 'Rachel (Calm & Professional)', voiceId: '21m00Tcm4TlvDq8ikWAM' },
      { name: 'Bella (Warm & Clear)', voiceId: 'EXAVITQu4vr4xnSDxMaL' }
    ];
  }

  console.log('\nSelected Voices for Comparison:');
  candidateVoices.forEach((v, i) => console.log(`   ${i + 1}. ${v.name} (${v.voiceId})`));

  console.log('\nParameters Applied:');
  console.log(`   - Model: eleven_multilingual_v2`);
  console.log(`   - Stability: ${DEFAULT_VOICE_SETTINGS.stability}`);
  console.log(`   - Similarity Boost: ${DEFAULT_VOICE_SETTINGS.similarity_boost}`);
  console.log(`   - Style: ${DEFAULT_VOICE_SETTINGS.style}\n`);

  const samples = await generateVoiceSamples(candidateVoices, sampleScript);

  console.log('\n================================================================');
  console.log('🎉 Voice Samples Generated:');
  samples.forEach(s => {
    console.log(`   🔊 Sample ${s.sampleIndex} [${s.voiceName}]: ${s.filePath} (${s.duration.toFixed(2)}s)`);
  });
  console.log('================================================================');

  // Save manifest of samples
  fs.writeFileSync(
    path.join(__dirname, 'audio', 'samples', 'samples_manifest.json'),
    JSON.stringify(samples, null, 2)
  );

  return samples;
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error generating voice samples:', err);
    process.exit(1);
  });
}

module.exports = { main };
