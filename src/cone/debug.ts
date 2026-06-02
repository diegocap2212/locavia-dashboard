import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data.json');

const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

interface JiraItem {
  Key: string;
  Type: string;
  Status: string;
  Team: string | null;
  Created: string;
  CommitmentDate: string | null;
  StartDate: string | null;
  Resolved: string | null;
  Labels: string[];
  Release: string | null;
}

const items: JiraItem[] = raw;
const cemItems = items.filter(it => it.Release === 'CEM-R1');

const kickoff = new Date('2025-11-24T00:00:00Z');

const discardedBefore = cemItems.filter(it => 
  it.Status.toUpperCase() === 'DESCARTADO' &&
  it.Resolved && new Date(it.Resolved) < kickoff
);

console.log(`Discarded before kickoff: ${discardedBefore.length}`);
discardedBefore.forEach(it => {
  console.log(`  Key: ${it.Key}, Created: ${it.Created}, Resolved: ${it.Resolved}`);
});

// Let's also check all items created before kickoff in CEM-R1
const createdBefore = cemItems.filter(it => new Date(it.Created) < kickoff);
console.log(`\nCreated before kickoff (Total ${createdBefore.length}):`);
// Count by status
const statusCount: Record<string, number> = {};
createdBefore.forEach(it => {
  statusCount[it.Status] = (statusCount[it.Status] || 0) + 1;
});
console.log('Status counts for items created before kickoff:', statusCount);

// Let's check how many are not discarded
const nonDiscardedCreatedBefore = createdBefore.filter(it => it.Status.toUpperCase() !== 'DESCARTADO');
console.log(`Non-discarded created before kickoff: ${nonDiscardedCreatedBefore.length}`);

// Let's check if there are items created before kickoff, NOT resolved before kickoff, and NOT discarded
const activeBeforeKickoff = createdBefore.filter(it => {
  const isDisc = it.Status.toUpperCase() === 'DESCARTADO';
  const resBefore = it.Resolved && new Date(it.Resolved) < kickoff;
  return !isDisc && !resBefore;
});
console.log(`Active created before kickoff: ${activeBeforeKickoff.length}`);
