const fs = require('fs');
const { execSync } = require('child_process');

const testFiles = fs.readdirSync(__dirname)
  .filter(f => (f.startsWith('test_mvp') || f === 'test_auth.js') && f.endsWith('.js'))
  .sort((a,b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
    return numA - numB;
  });

console.log(`Executing Complete Regression Test Battery (${testFiles.length} suites)...`);
console.log('='.repeat(65));

let passed = 0;
const failures = [];

for (const file of testFiles) {
  process.stdout.write(`• ${file.padEnd(25)} : `);
  const startTime = Date.now();
  try {
    execSync(`node ${file}`, { stdio: 'pipe', timeout: 90000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`PASSED (${duration}s)`);
    passed++;
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`FAILED (${duration}s)`);
    failures.push({
      file,
      error: err.stderr ? err.stderr.toString() : (err.stdout ? err.stdout.toString() : err.message)
    });
  }
}

console.log('='.repeat(65));
console.log(`FINAL RESULT: ${passed}/${testFiles.length} Test Suites Passed (${failures.length} failed)`);
if (failures.length > 0) {
  console.log('\nFailures Summary:');
  failures.forEach(f => console.log(`- ${f.file}: ${f.error.slice(0, 300)}`));
  process.exit(1);
} else {
  console.log('All test suites verified with 100% PASS rate.');
  process.exit(0);
}
