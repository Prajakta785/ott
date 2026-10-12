const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
process.chdir(ROOT_DIR);

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    throw err;
  }
}

function pushToVercel(customMessage) {
  try {
    const status = runCommand('git status --porcelain');
    if (!status) {
      console.log('✅ [Vercel Auto-Push] No new changes detected. Vercel is already up to date.');
      return false;
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const commitMsg = customMessage || `auto: deploy updates to vercel (${timestamp})`;

    console.log('\n🚀 [Vercel Auto-Push] Changes detected:');
    console.log(status.split('\n').slice(0, 8).map(l => '   ' + l).join('\n'));
    if (status.split('\n').length > 8) {
      console.log(`   ...and ${status.split('\n').length - 8} more files`);
    }

    console.log('📦 Staging changes (git add)...');
    runCommand('git add -A');

    console.log(`📝 Committing: "${commitMsg}"...`);
    runCommand(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

    console.log('🌐 Pushing to GitHub (origin main) -> Triggering Vercel deployment...');
    runCommand('git push origin main');

    console.log(`🎉 [SUCCESS] Changes successfully pushed to Vercel at ${timestamp}!\n`);
    return true;
  } catch (e) {
    console.error('❌ [ERROR] Auto-push failed:', e.message || e);
    return false;
  }
}

const isWatchMode = process.argv.includes('watch') || process.argv.includes('--watch');

if (!isWatchMode) {
  pushToVercel();
} else {
  console.log('=====================================================');
  console.log('   🔄 GRAMIN BHARAT TV - CONTINUOUS AUTO-PUSH TO VERCEL');
  console.log('   Any file saved will automatically deploy to Vercel!');
  console.log('   (Press Ctrl+C to stop)');
  console.log('=====================================================\n');

  // Initial push
  pushToVercel('auto: initial sync before watcher');

  let debounceTimer = null;
  const IGNORED = ['.git', 'node_modules', '.next', '.system_generated', 'scratch', 'build', 'dist'];

  console.log('👀 Watching project files for modifications...');

  fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const normalized = filename.replace(/\\/g, '/');
    if (IGNORED.some(ign => normalized.startsWith(ign) || normalized.includes('/' + ign + '/'))) {
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`\n🔔 Change detected in: ${filename}`);
      pushToVercel(`auto: updated ${path.basename(filename)} (${new Date().toLocaleTimeString('en-IN')})`);
    }, 2500); // 2.5 second debounce
  });
}
