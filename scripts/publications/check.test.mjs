import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';
import { parse } from '@retorquere/bibtex-parser';
import { toPublication } from '../../src/data/publications.ts';
const settings = JSON.parse(readFileSync(new URL('../../src/content/settings/ui.json', import.meta.url)));
const dir = new URL('../../src/content/publications/', import.meta.url);
const publications = readdirSync(dir).filter(name => name.endsWith('.md')).map(name => {
  const source = readFileSync(new URL(name, dir), 'utf8');
  const record = parseYaml(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const status = settings.publications.statuses.find(status => status.id === record.status);
  return { ...toPublication({ id: name.replace(/\.md$/, ''), ...record }, status.citationNote), order: record.order };
}).sort((a, b) => a.order - b.order);

test('content records have unique citation IDs and configured statuses', () => {
  assert.equal(new Set(publications.map(pub => pub.id)).size, publications.length);
  for (const pub of publications) {
    assert.ok(settings.publications.statuses.some(status => status.id === pub.status), pub.id);
    assert.ok(Number.isInteger(pub.year), pub.id);
    assert.ok(pub.authors.length > 0, pub.id);
  }
});

test('every exported citation parses with its authors, year and status', () => {
  for (const pub of publications) {
    const parsed = parse(pub.bibtex);
    assert.deepEqual(parsed.errors, [], pub.id);
    const entry = parsed.entries[0];
    assert.equal(entry.key, pub.id);
    assert.equal(Number(entry.fields.year), pub.year);
    assert.equal(entry.fields.author.length, pub.authors.length);
    assert.equal(entry.fields.doi, pub.doi);
    assert.equal(entry.fields.journal, pub.venue);
    assert.equal(entry.type, pub.status === 'published' ? 'article' : 'unpublished');
    assert.equal(entry.fields.note, settings.publications.statuses.find(status => status.id === pub.status).citationNote || undefined);
  }
});

test('citation formatting preserves punctuation in newly edited content', () => {
  const pub = toPublication({ id: 'fixture', title: 'A & B: 50% of edge_networks', authors: ['A. Example'], citationAuthors: 'Example, A.', year: 2026, status: 'published' });
  const parsed = parse(pub.bibtex);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.entries[0].fields.title, 'A & B: 50% of edge_networks');
});
