import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\62750e4f-eb71-498b-b82a-3d52c9a14fa1\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('=== SEARCHING USER INPUTS IN TRANSCRIPT ===');
  lines.forEach((line) => {
    if (!line.trim()) return;
    try {
      const step = JSON.parse(line);
      if (step.source === 'USER_EXPLICIT' && step.type === 'USER_INPUT') {
        const text = step.content;
        if (text.toLowerCase().includes('jornada') || text.toLowerCase().includes('parati') || text.toLowerCase().includes('rm')) {
          console.log(`\n--- Step ${step.step_index} (${step.created_at}) ---`);
          console.log(text);
        }
      }
    } catch (e) {}
  });
} else {
  console.log('Log file not found');
}
