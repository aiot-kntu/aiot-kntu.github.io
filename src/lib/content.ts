import { getCollection } from 'astro:content';
import { toPublication } from '@/data/publications';
import { groups, ui } from './settings';

type MemberEntry = Awaited<ReturnType<typeof getCollection<'members'>>>[number];

// Decides display order inside each people group (director, phd, msc, alumni).
// Return negative if `a` comes first, positive if `b` comes first.
function compareMembers(a: MemberEntry, b: MemberEntry): number {
  // Newest first by university entry year, taken from the filename prefix
  // (e.g. "2023_msc_jane-doe.md"). Same entry year falls back to filename order.
  const entryYear = (m: MemberEntry) => Number.parseInt(m.id, 10) || 0;
  return entryYear(b) - entryYear(a) || a.id.localeCompare(b.id);
}

export async function getMembers() {
  const records = (await getCollection('members', ({ data }) => !data.draft)).sort(compareMembers);
  for (const record of records) {
    if (!groups.some(group => group.id === record.data.group)) throw new Error(`Unknown member group "${record.data.group}" in ${record.id}. Add it to settings/groups.json.`);
  }
  return groups.map(group => ({ ...group, people: records.filter(record => record.data.group === group.id) }));
}
export async function getPublications() {
  const entries = (await getCollection('publications', ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year || a.id.localeCompare(b.id));
  return entries.map(({ id, data }) => {
    const status = ui.publications.statuses.find(status => status.id === data.status);
    if (!status) throw new Error(`Unknown publication status "${data.status}" in ${id}. Add it to settings/ui.json.`);
    return toPublication({ id, ...data }, status.citationNote);
  });
}
export async function getResearch() {
  const [topics, publications] = await Promise.all([
    getCollection('research', ({ data }) => !data.draft), getPublications(),
  ]);
  return topics.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id)).map(topic => ({
    ...topic,
    publications: topic.data.publicationIds.map(id => {
      const pub = publications.find(pub => pub.id === id);
      if (!pub) throw new Error(`Unknown publication "${id}" in research topic ${topic.id}.`);
      return pub;
    }),
  }));
}
export async function getCourses() {
  return (await getCollection('courses', ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
export async function getUpdates() {
  return (await getCollection('updates', ({ data }) => !data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
