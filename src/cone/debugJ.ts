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

const resolvedBefore = cemItems.filter(it => it.Resolved && new Date(it.Resolved) < kickoff);
const normalResolvedBefore = resolvedBefore.filter(it => it.Status.toUpperCase() !== 'DESCARTADO');

console.log(`Normal resolved before kickoff (Total ${normalResolvedBefore.length}):`);
normalResolvedBefore.forEach(it => {
  console.log(`  Key: ${it.Key}, Created: ${it.Created}, Resolved: ${it.Resolved}, Status: ${it.Status}`);
});
