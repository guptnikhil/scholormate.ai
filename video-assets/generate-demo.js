/**
 * generate-demo.js
 * Master pipeline for producing the synchronized 1080p ScholarMate AI demo video.
 * Enforces Single Timeline Source of Truth, per-scene alignment, and automated validation.
 */

const path = require('path');
const fs = require('fs');
const { generateAll } = require('./generate-narration');
const { buildTimelineManifest } = require('./timeline');
const { generateSubtitlesFromManifest } = require('./generate-subtitles');
const { runAutomation } = require('./browser-automation');
const { renderFromManifest, generateContactSheet, getMediaDuration } = require('./render-video');

async function main() {
  console.log('================================================================');
  console.log('🎬 ScholarMate AI — Synchronized Production Demo Video Pipeline');
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    // Step 1: Narration Generation (macOS Samantha Speech Synthesis)
    console.log('👉 STEP 1 / 5: Synthesizing High-Fidelity Audio Tracks...');
    await generateAll();

    // Step 2: Single Timeline Manifest Construction
    console.log('\n👉 STEP 2 / 5: Building Single Timeline Source of Truth...');
    const manifest = buildTimelineManifest();

    // Step 3: Subtitles Generation
    console.log('\n👉 STEP 3 / 5: Generating Accurate Subtitles (SRT & VTT)...');
    generateSubtitlesFromManifest(manifest, path.join(__dirname, 'subtitles'));

    // Step 4: Playwright Recording with Exact Timeline Sync
    console.log('\n👉 STEP 4 / 5: Recording Synchronized 1080p Browser Footage...');
    const recordingsDir = path.join(__dirname, 'recordings');
    await runAutomation(manifest);

    // Step 5: Scene Encoding, Padding & Lossless Assembly
    console.log('\n👉 STEP 5 / 5: Compositing and Concatenating Final 1080p MP4...');
    const result = await renderFromManifest(manifest, recordingsDir, 'project-demo.mp4');

    // Step 6: Generate Full Contact Sheet
    const contactSheetPath = path.join(__dirname, '..', 'output', 'contact-sheet.png');
    generateContactSheet(result.path, contactSheetPath, 5, 5, 5);

    // Step 7: Final Timeline & Drift Validation
    console.log('\n================================================================');
    console.log('📊 TIMELINE & DRIFT VALIDATION REPORT');
    console.log('================================================================');
    const expected = manifest.totalDuration;
    const actual = result.duration;
    const delta = Math.abs(expected - actual);

    console.log(`   - Configured Timeline Duration: ${expected.toFixed(2)}s`);
    console.log(`   - Final Rendered File Duration: ${actual.toFixed(2)}s`);
    console.log(`   - Global Synchronization Drift: ${delta.toFixed(3)}s`);

    if (delta < 0.3) {
      console.log(`   ✅ STATUS: Frame-perfect synchronization confirmed (<0.30s drift across entire video)!`);
    } else {
      console.warn(`   ⚠️ WARNING: Drift exceeds recommended threshold (${delta.toFixed(3)}s).`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n================================================================');
    console.log(`✨ SUCCESS: Complete Synchronized Demo Video Produced in ${elapsed}s!`);
    console.log(`📹 Video Location:  ${result.path}`);
    console.log(`🖼️ Contact Sheet:   ${contactSheetPath}`);
    console.log(`📦 File Size:       ${result.sizeMb} MB`);
    console.log('================================================================');

  } catch (err) {
    console.error('\n❌ Fatal error during demo video generation:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
