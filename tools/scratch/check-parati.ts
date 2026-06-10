import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));
const targetKeys = ['RM-3388', 'RM-3299', 'RM-3298', 'RM-3251', 'RM-2898'];

targetKeys.forEach(k => {
  const item = data.find((i: any) => i.Key === k);
  if (item) {
    console.log(`Found ${k}:`, JSON.stringify(item));
  } else {
    console.log(`NOT found ${k}`);
  }
});
