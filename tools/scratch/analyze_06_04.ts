
import data from '../src/data.json';

const TARGET_TEAM = 'Portal de Vendas Assistidas';
const TARGET_RELEASE = 'O4R2';
const WEEK_START = new Date('2026-04-06T00:00:00');
const WEEK_END = new Date('2026-04-12T23:59:59');

const filtered = data.filter(i => i.Team === TARGET_TEAM && i.Release === TARGET_RELEASE);

console.log(`Total items for ${TARGET_TEAM} / ${TARGET_RELEASE}: ${filtered.length}`);

const itemsAtStartOfWeek = filtered.filter(i => {
    const created = new Date(i.Created);
    const resolved = i.Resolved ? new Date(i.Resolved) : null;
    
    // Was it created before the week started?
    if (created >= WEEK_START) return false;
    
    // Was it already resolved before the week started?
    if (resolved && resolved < WEEK_START) return false;
    
    return true;
});

const itemsAtEndOfWeek = filtered.filter(i => {
    const created = new Date(i.Created);
    const resolved = i.Resolved ? new Date(i.Resolved) : null;
    
    // Was it created before the week ended?
    if (created > WEEK_END) return false;
    
    // Was it already resolved before the week ended?
    if (resolved && resolved <= WEEK_END) return false;
    
    return true;
});

const resolvedDuringWeek = filtered.filter(i => {
    const resolved = i.Resolved ? new Date(i.Resolved) : null;
    return resolved && resolved >= WEEK_START && resolved <= WEEK_END;
});

const createdDuringWeek = filtered.filter(i => {
    const created = new Date(i.Created);
    return created >= WEEK_START && created <= WEEK_END;
});

console.log(`\nWeek: 06-04 to 12-04`);
console.log(`Items at Start of Week (Backlog): ${itemsAtStartOfWeek.length}`);
console.log(`Items Created During Week: ${createdDuringWeek.length}`);
console.log(`Items Resolved During Week (Deliveries): ${resolvedDuringWeek.length}`);
console.log(`Items at End of Week (Backlog): ${itemsAtEndOfWeek.length}`);

console.log(`\nResolved items list:`);
resolvedDuringWeek.forEach(i => console.log(`- ${i.Key}: ${i.Summary} (Resolved: ${i.Resolved})`));

console.log(`\nRemaining items at end of week:`);
itemsAtEndOfWeek.forEach(i => console.log(`- ${i.Key}: ${i.Summary} (Status: ${i.Status})`));
