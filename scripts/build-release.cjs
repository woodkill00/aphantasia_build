'use strict';
const {buildRelease} = require('./release-kit.cjs');
const flags = {'--version': 'version', '--source-commit': 'sourceCommit',
  '--tested-html-sha256': 'testedHtmlSha256', '--evidence-url': 'evidenceUrl', '--output': 'output'};
function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = flags[args[i]];
    if (!key || options[key] !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Expected unique --version, --source-commit, --tested-html-sha256, --evidence-url and --output values.');
    options[key] = args[i + 1];
  }
  const result = buildRelease(options);
  console.log('Prepared locally, not published: ' + result.output);
  console.log('HTML SHA-256: ' + result.htmlSha256);
  console.log('ZIP SHA-256: ' + result.zipSha256);
  console.log('The supplied evidence URL was not remotely verified. Publication and license decisions remain separate.');
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error('Release preparation failed: ' + error.message); process.exitCode = 1; }
}
module.exports = {main};
