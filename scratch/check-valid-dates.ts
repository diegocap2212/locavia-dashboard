import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import excelToJSDate logic directly to check
const excelToJSDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (s === "" || s.toLowerCase() === "null") return null;

  // Handle ISO format/Hyphenated (YYYY-MM-DD)
  if (s.includes('-')) return new Date(s);
  
  if (s.includes('/')) {
    const [datePart, timePart] = s.split(' ');
    const parts = datePart.split('/').map(Number);
    if (parts.length !== 3) return null;

    let day, month, year;

    // Detect format by position of the 4-digit year
    if (parts[0] > 1000) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else if (parts[2] > 1000) {
      year = parts[2];
      if (parts[0] > 12) {
        day = parts[0];
        month = parts[1];
      } else if (parts[1] > 12) {
        month = parts[0];
        day = parts[1];
      } else {
        day = parts[0];
        month = parts[1];
      }
    } else {
      let [first, second, y] = parts;
      year = (y < 50 ? 2000 : 1900) + y;
      if (first > 12) {
        day = first; month = second;
      } else {
        day = first; month = second;
      }
    }

    if (timePart) {
      const timeParts = timePart.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      return new Date(year, month - 1, day, hours, minutes);
    }
    return new Date(year, month - 1, day);
  }

  const excelDate = parseFloat(s);
  if (isNaN(excelDate)) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
};

const checkFile = (filePath) => {
  const absolutePath = path.join(__dirname, filePath);
  if (!fs.existsSync(absolutePath)) return;
  const items = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
  let invalidCount = 0;
  items.forEach((item: any, index: number) => {
    const created = excelToJSDate(item.Created);
    const resolved = item.Resolved ? excelToJSDate(item.Resolved) : null;
    const updated = item.UpdatedAt ? excelToJSDate(item.UpdatedAt) : null;

    if (!created || isNaN(created.getTime())) {
      console.log(`[${filePath}] Item at index ${index} (${item.Key}) has invalid Created date: ${item.Created}`);
      invalidCount++;
    }
    if (item.Resolved && (!resolved || isNaN(resolved.getTime()))) {
      console.log(`[${filePath}] Item at index ${index} (${item.Key}) has invalid Resolved date: ${item.Resolved}`);
      invalidCount++;
    }
    if (item.UpdatedAt && (!updated || isNaN(updated.getTime()))) {
      console.log(`[${filePath}] Item at index ${index} (${item.Key}) has invalid UpdatedAt date: ${item.UpdatedAt}`);
      invalidCount++;
    }
  });
  console.log(`[${filePath}] Total invalid dates with excelToJSDate: ${invalidCount}`);
};

checkFile('../src/data.json');
