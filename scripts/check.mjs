import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {copy,contacts,sources,inquiry,reviewed} from '../content.mjs';

assert.equal(reviewed,'2026-10-27');
assert.deepEqual(Object.keys(copy.de).sort(),Object.keys(copy.ru).sort(),'Translation keys must match');
for(const lang of ['de','ru']) {
 for(const [key,value] of Object.entries(copy[lang])) {
  assert(value && (!Array.isArray(value)||value.length>0),`${lang}.${key} must not be empty`);
  if(Array.isArray(value)) assert.equal(value.length,copy[lang==='de'?'ru':'de'][key].length,`${key} array length`);
 }
}
assert.equal(new Set(contacts.map(c=>c.id)).size,contacts.length);
assert.equal(contacts.filter(c=>c.route==='care').length,6);
assert.equal(contacts.filter(c=>c.route==='study').length,6);
for(const c of contacts) {
 assert.match(c.email,/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
 assert.equal(new URL(c.url).protocol,'https:');
 for(const lang of ['de','ru']) assert(c[lang].tag&&c[lang].description&&c[lang].application);
 const draft=inquiry(c);
 assert(draft.body.includes('Mit freundlichen Grüßen'));
 assert(draft.translation.includes('С уважением'));
}
for(const [,url] of Object.values(sources))assert.equal(new URL(url).protocol,'https:');
const files=['index.html','styles.css','app.js','content.mjs','favicon.svg','social.svg','README.md','architecture.md'];
for(const name of files) {
 const text=await readFile(new URL(`../${name}`,import.meta.url),'utf8');
 assert(!/Svetlana|Kuksina|Piskarev|Пискар|Светлан|Murom|Муром|C7NJ|ghp_|gho_|passport.number/i.test(text),`Private information in ${name}`);
}
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
for(const match of html.matchAll(/(?:src|href)="\.\/([^"?]+)"/g)) await readFile(new URL(`../${match[1]}`,import.meta.url));
const names=await readdir(new URL('..',import.meta.url));
assert(!names.some(n=>/\.(pdf|jpe?g|docx|xlsx)$/i.test(n)),'Private document file found');
console.log('PASS: DE/RU key parity, 12 institutional contacts, templates, source URLs, local assets and private-data checks.');
