// Publication records live in src/content/publications/*.md.
// This module contains citation formatting only.
export type PublicationStatus = string;
export interface LabPublication {
  id: string;
  title: string;
  authors: string[];
  citationAuthors: string;
  year: number;
  status: PublicationStatus;
  venue?: string;
  doi?: string;
  url?: string;
  featured?: boolean;
  bibtex: string;
}

export function toPublication(record: Omit<LabPublication, 'bibtex'>, citationNote = ''): LabPublication {
  const escape = (value: string) => value.replace(/\\/g, '\\textbackslash{}').replace(/([%&#_])/g, '\\$1');
  const fields = [
    `  title = {{${escape(record.title)}}}`,
    `  author = {${escape(record.citationAuthors)}}`,
    `  year = {${record.year}}`,
    ...(record.venue ? [`  journal = {${escape(record.venue)}}`] : []),
    ...(record.doi ? [`  doi = {${record.doi}}`] : []),
    ...(citationNote ? [`  note = {${escape(citationNote)}}`] : []),
  ];
  return { ...record, bibtex: `@${record.status === 'published' ? 'article' : 'unpublished'}{${record.id},\n${fields.join(',\n')}\n}` };
}
