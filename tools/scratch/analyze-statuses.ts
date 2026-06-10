import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../src/data.json');

if (!fs.existsSync(dataPath)) {
  console.error('data.json not found at:', dataPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
console.log(`Total issues: ${data.length}`);

const statusCounts = {};
const statusCategoryCounts = {};

data.forEach((item) => {
  const status = item.Status || 'UNKNOWN';
  const category = item.StatusCategory || 'UNKNOWN';
  
  if (!statusCounts[status]) {
    statusCounts[status] = { count: 0, category: category };
  }
  statusCounts[status].count++;
  
  statusCategoryCounts[category] = (statusCategoryCounts[category] || 0) + 1;
});

console.log('\n--- Status Counts and Mapped Categories ---');
Object.keys(statusCounts)
  .sort((a, b) => statusCounts[b].count - statusCounts[a].count)
  .forEach((status) => {
    console.log(`- ${status}: ${statusCounts[status].count} (Mapped to: ${statusCounts[status].category})`);
  });

console.log('\n--- Category Counts ---');
Object.keys(statusCategoryCounts).forEach((cat) => {
  console.log(`- ${cat}: ${statusCategoryCounts[cat]}`);
});
