import site from '@/content/settings/site.json';
import ui from '@/content/settings/ui.json';
import groups from '@/content/settings/groups.json';

export { site, ui, groups };
export function text(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
}
export function pageTitle(title: string) {
  return `${title.replace(/\.$/, '')} | ${site.name}`;
}
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(site.locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}
