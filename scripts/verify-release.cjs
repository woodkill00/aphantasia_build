'use strict';
const {verifyRelease} = require('./release-kit.cjs');
if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/verify-release.cjs <output-directory>');
    const result = verifyRelease(process.argv[2]);
    console.log('PASS: exact file allowlists, ZIP structure/CRCs, internal/external checksums, metadata and identical HTML bytes.');
    console.log('HTML SHA-256: ' + result.htmlSha256);
    console.log('ZIP SHA-256: ' + result.zipSha256);
    console.log('This is consistency verification, not authentication, CI-success verification or publication approval.');
  } catch (error) { console.error('Release verification failed: ' + error.message); process.exitCode = 1; }
}
