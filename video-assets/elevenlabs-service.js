/**
 * elevenlabs-service.js
 * ElevenLabs Text-to-Speech Integration for ScholarMate AI demo videos.
 * Handles API authentication, voice querying, sample generation, and scene audio synthesis.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

// Load environment variables from .env file if present
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const ELEVENLABS_BASE = 'api.elevenlabs.io';
const API_KEY = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'f1abxvIEijusskcPWE5x';
const DEFAULT_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

const DEFAULT_VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
};

function getApiKey() {
  const key = process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY;
  if (!key) {
    throw new Error('ELEVENLABS_API_KEY or XI_API_KEY is not set. Export it in your environment or add it to video-assets/.env');
  }
  return key;
}

/**
 * Retrieves valid voice list from ElevenLabs API
 */
async function fetchAccountVoices() {
  const key = getApiKey();
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ELEVENLABS_BASE,
        path: '/v1/voices',
        method: 'GET',
        headers: {
          'xi-api-key': key
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.voices || []);
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`ElevenLabs API Error ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Synthesizes audio using ElevenLabs TTS and saves to 48kHz WAV
 */
async function synthesizeSpeech(text, outputPath, voiceId = DEFAULT_VOICE_ID, customSettings = {}) {
  const key = getApiKey();
  const voiceSettings = { ...DEFAULT_VOICE_SETTINGS, ...customSettings };

  const payload = JSON.stringify({
    text,
    model_id: DEFAULT_MODEL_ID,
    voice_settings: voiceSettings
  });

  const tempMp3 = outputPath.replace(/\.wav$/, '_temp.mp3');

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ELEVENLABS_BASE,
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        }
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const fileStream = fs.createWriteStream(tempMp3);
          res.pipe(fileStream);
          fileStream.on('finish', () => resolve(tempMp3));
          fileStream.on('error', reject);
        } else {
          let errBody = '';
          res.on('data', chunk => errBody += chunk);
          res.on('end', () => {
            reject(new Error(`ElevenLabs TTS Error ${res.statusCode}: ${errBody}`));
          });
        }
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  // Convert MP3 to 48kHz stereo WAV with volume normalization
  execSync(`"${ffmpeg.path}" -y -i "${tempMp3}" -ar 48000 -ac 2 -af "volume=1.1,compand=0.3|0.8:1|1:-70/-60|-20/-10|0/0:6:0:-90:0.2" "${outputPath}"`, { stdio: 'pipe' });

  if (fs.existsSync(tempMp3)) {
    fs.unlinkSync(tempMp3);
  }

  // Measure duration
  let duration = 0;
  try {
    const probe = execSync(`"${ffmpeg.path}" -i "${outputPath}" -f null - 2>&1`).toString();
    const match = probe.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (match) {
      duration = parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
    }
  } catch (_) {}

  return { path: outputPath, duration };
}

/**
 * Generates 3 comparison samples for user evaluation
 */
async function generateVoiceSamples(voiceList, sampleText) {
  const samplesDir = path.join(__dirname, 'audio', 'samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  const text = sampleText || "ScholarMate AI is a public scholarship discovery and verification platform that turns complex guidelines into clear, instant criteria matching.";
  const results = [];

  console.log(`🎙️ Generating ${voiceList.length} voice comparison samples...`);

  for (let i = 0; i < voiceList.length; i++) {
    const v = voiceList[i];
    const sampleWav = path.join(samplesDir, `sample_${i + 1}_${v.name.replace(/[^a-zA-Z0-9]/g, '_')}.wav`);
    console.log(`   Sample ${i + 1}/${voiceList.length}: Voice "${v.name}" (${v.voiceId})...`);

    const res = await synthesizeSpeech(text, sampleWav, v.voiceId, DEFAULT_VOICE_SETTINGS);
    results.push({
      sampleIndex: i + 1,
      voiceName: v.name,
      voiceId: v.voiceId,
      filePath: res.path,
      duration: res.duration
    });
  }

  return results;
}

module.exports = {
  getApiKey,
  fetchAccountVoices,
  synthesizeSpeech,
  generateVoiceSamples,
  DEFAULT_VOICE_ID,
  DEFAULT_MODEL_ID,
  DEFAULT_VOICE_SETTINGS
};
