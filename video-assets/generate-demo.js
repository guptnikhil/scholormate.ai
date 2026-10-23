/**
 * generate-demo.js
 * Master CLI script that orchestrates the entire automated demo creation pipeline:
 *  1. Audio narration generation
 *  2. Subtitle synchronization
 *  3. Real browser Playwright interaction & recording
 *  4. Video rendering to output/project-demo.mp4
 */

const { generateAll } = require('./generate-narration');
const { generateSubtitles } = require('./generate-subtitles');
const { runAutomation } = require('./browser-automation');
const { renderFinalVideo } = require('./render-video');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('================================================================');
  console.log('🎬 ScholarMate AI — Automated Demo Video Generation Pipeline');
  console.log('================================================================\n');

  const startTime = Date.now();

  try {
    // Step 1: Narration
    console.log('👉 STEP 1 / 4: Generating Narration Voiceover...');
    const manifest = await generateAll();

    // Step 2: Subtitles
    console.log('\n👉 STEP 2 / 4: Generating Synchronized Subtitles...');
    generateSubtitles(manifest, path.join(__dirname, 'subtitles'));

    // Step 3: Browser Automation & Screen Capture
    console.log('\n👉 STEP 3 / 4: Running Playwright Browser Automation & 1080p Recording...');
    await runAutomation();

    // Step 4: Final Video Render
    console.log('\n👉 STEP 4 / 4: Transcoding and Compositing Final 1080p MP4...');
    const finalMp4 = await renderFinalVideo();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n================================================================');
    console.log(`✨ SUCCESS: Complete demo video produced in ${elapsed}s!`);
    console.log(`📹 Video Location: ${finalMp4}`);
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ Error during demo generation:', err);
    process.exit(1);
  }
}

main();
