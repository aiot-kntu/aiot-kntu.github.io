import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';
const root = new URL('../../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const groups = readJson('src/content/settings/groups.json');
const site = readJson('src/content/settings/site.json');
const ui = readJson('src/content/settings/ui.json');
const hardware = readJson('src/content/settings/hardware.json');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const unique = (items, label) => assert(items.length === new Set(items).size, `Duplicate ${label}.`);
const records = collection => readdirSync(new URL(`src/content/${collection}/`, root)).filter(file => file.endsWith('.md')).map(file => {
  const source = readFileSync(new URL(`src/content/${collection}/${file}`, root), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error(`Missing frontmatter: ${collection}/${file}`);
  return { id: file.replace(/\.md$/, ''), ...parse(frontmatter[1]), source: `${collection}/${file}` };
});
const members = records('members'), research = records('research'), publications = records('publications'), courses = records('courses'), updates = records('updates');
unique(groups.map(group => group.id), 'member group IDs');
unique(ui.publications.statuses.map(status => status.id), 'publication status IDs');
unique(hardware.devices.map(device => device.id), 'hardware IDs');
for (const item of members) assert(groups.some(group => group.id === item.group), `Unknown group ${item.group}: ${item.source}`);
for (const item of publications) assert(ui.publications.statuses.some(status => status.id === item.status), `Unknown status ${item.status}: ${item.source}`);
for (const topic of research) {
  for (const id of topic.publicationIds ?? []) assert(publications.some(pub => pub.id === id && !pub.draft), `Missing or draft publication ${id}: ${topic.source}`);
}
assert(hardware.devices.some(device => device.id === hardware.defaultDevice), 'Hardware defaultDevice must exist.');
const localAsset = (path, source) => { if (path?.startsWith('/')) assert(existsSync(new URL(`public${path}`, root)), `Missing asset ${path}: ${source}`); };
for (const item of members) localAsset(item.image, item.source);
for (const device of hardware.devices) localAsset(device.photo, `hardware/${device.id}`);
localAsset(site.favicon, 'site.favicon');
localAsset(site.branding.image, 'site.branding.image');
const validLink = value => /^(https?:\/\/|\/(?!\/)|mailto:|#)/.test(value);
const walk = (value, path) => {
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (['href', 'url', 'profile', 'link'].includes(key) && typeof entry === 'string') assert(validLink(entry), `Invalid link at ${path}.${key}`);
    if (typeof entry === 'object') walk(entry, `${path}.${key}`);
  }
};
walk(site, 'settings/site.json');
walk([...members, ...research, ...publications, ...courses, ...updates], 'content');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Content valid: ${members.length} members, ${research.length} research topics, ${courses.length} courses, ${publications.length} publications, ${updates.length} news entries.`);
