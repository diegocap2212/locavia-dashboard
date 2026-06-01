import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Keys identified as extra
const extraKeys = ['RM-3512', 'RM-3498', 'RM-3496', 'RM-3515', 'RM-3493'];

extraKeys.forEach(k => {
    const item = jiraData.find((i: any) => i.Key === k);
    console.log(`\nItem: ${k}`);
    console.log(`Labels: ${JSON.stringify(item.Labels)}`);
});
