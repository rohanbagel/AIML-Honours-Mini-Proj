import { predictReadmission } from './src/predict.js';
import fs from 'fs';

const results = JSON.parse(fs.readFileSync('./src/results.json', 'utf8'));
const parityCheck = results.parity_check;

console.log('Testing JS predictReadmission against Python scikit-learn ground truth:');
let maxDiff = 0;

parityCheck.forEach((testCase, idx) => {
  const res = predictReadmission(testCase.inputs);
  const diff = Math.abs(res.probability - testCase.sklearn_probability);
  if (diff > maxDiff) maxDiff = diff;
  console.log(`Test case ${idx + 1}: JS=${res.probability.toFixed(4)} vs Sklearn=${testCase.sklearn_probability.toFixed(4)} | diff=${diff.toFixed(6)} | Status: ${diff < 0.001 ? 'PASS' : 'FAIL'}`);
});

console.log(`\nMax discrepancy: ${maxDiff.toFixed(6)} (Threshold: < 0.001000)`);
if (maxDiff < 0.001) {
  console.log('PARITY VERIFICATION SUCCESSFUL!');
} else {
  console.error('PARITY CHECK FAILED!');
  process.exit(1);
}
