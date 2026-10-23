/**
 * test-pipeline.js
 * Regression test script: renders a 3-scene test video, validates duration,
 * audio/video sync, and produces an inspection contact sheet.
 */

const path = require('path');
const fs = require('fs');
const { buildTimelineManifest } = require('./timeline');
const { generateSubtitlesFromManifest } = require('./generate-subtitles');
const { runAutomation } = require('./browser-automation');
const { renderFromManifest, generateContactSheet, getMediaDuration } = require('./render-video');

async function runRegressionTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING REGRESSION TEST: 3-Scene Synchronized Pipeline');
  console.log('================================================================\n');

  const testSceneIds = ['scene_01', 'scene_02', 'scene_03'];

  // Step 1: Build test timeline manifest
  const manifest = buildTimelineManifest(testSceneIds);

  // Step 2: Generate subtitles for test scenes
  generateSubtitlesFromManifest(manifest, path.join(__dirname, 'test_subtitles'));

  // Step 3: Record scenes with Playwright
  console.log('\n📹 Recording test scenes with Playwright...');
  await runAutomation(manifest);

  // Step 4: Render test MP4
  console.log('\n🎞️ Rendering test MP4 (output/test-render.mp4)...');
  const recordingsDir = path.join(__dirname, 'recordings');
  const renderResult = await renderFromManifest(manifest, recordingsDir, 'test-render.mp4');

  // Step 5: Generate contact sheet
  const contactSheetPath = path.join(__dirname, '..', 'output', 'test-contact-sheet.png');
  generateContactSheet(renderResult.path, contactSheetPath, 3, 4, 4);

  // Step 6: Automated Synchronization Validation
  console.log('\n📊 Validating Regression Test Synchronization:');
  const expectedTotal = manifest.totalDuration;
  const actualTotal = renderResult.duration;
  const delta = Math.abs(expectedTotal - actualTotal);

  console.log(`   - Target Timeline Duration: ${expectedTotal}s`);
  console.log(`   - Actual Rendered Duration: ${actualTotal}s`);
  console.log(`   - Absolute Drift Delta:     ${delta.toFixed(3)}s`);

  if (delta < 0.25) {
    console.log(`   ✅ PASS: Frame and duration synchronization is within tolerance (<0.25s)!`);
  } else {
    throw new Error(`FAIL: Audio/Video duration mismatch exceeds tolerance! Delta: ${delta}s`);
  }

  console.log('\n================================================================');
  console.log('🎉 REGRESSION TEST COMPLETED SUCCESSFULLY');
  console.log(`📹 Test Video: ${renderResult.path}`);
  console.log(`🖼️ Contact Sheet: ${contactSheetPath}`);
  console.log('================================================================');

  return renderResult;
}

if (require.main === module) {
  runRegressionTest().catch((err) => {
    console.error('❌ Regression test failed:', err);
    process.exit(1);
  });
}

module.exports = { runRegressionTest };
