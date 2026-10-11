// Run from an EXISTING full project after uploading this update: node tests/solo-survival.mjs
import assert from 'node:assert/strict';
import { NODES, ENDINGS, CHARACTERS, ITEMS, EVIDENCE } from '../js/story.js';
import '../js/solo-story.js';
const removed=/\b(?:ellis|nora)\b/i;
assert.equal(CHARACTERS.some(c=>removed.test(c.name)),false,'Removed characters still appear in the character list');
assert.equal(Object.keys(ENDINGS).length,8,'All eight endings should remain');
for(const [id,node] of Object.entries(NODES)){
 assert.ok(node.scene,`${id} has no scene`);
 for(const c of node.choices||[]){
  assert.ok(NODES[c.to],`${id}.${c.id} points to missing ${c.to}`);
  for(const name of c.requires?.items||[])assert.ok(ITEMS[name],`${id} requires invalid item ${name}`);
  for(const name of c.requires?.evidence||[])assert.ok(EVIDENCE[name],`${id} requires invalid evidence ${name}`);
 }
 const visible=[node.text,node.title,node.speaker,node.voice,node.objective,...(node.choices||[]).map(c=>c.label)];
 assert.ok(visible.every(v=>!removed.test(String(v||''))),`${id} references removed characters`);
}
for(const [id,e] of Object.entries(ENDINGS))assert.ok(!removed.test(e.text),`Ending ${id} contains removed character`);
const start=NODES.arrival.choices.find(c=>c.id==='begin');
assert.ok(start&&!start.effects.items.includes('radio'),'Solo June still carries a companion radio');
const alone=NODES.help_ellis.choices.find(c=>c.id==='escape');
assert.equal(alone.effects.flags.exitCleared,true,'Solo exit route never unlocks true ending');
assert.deepEqual(NODES.road.choices.find(c=>c.id==='complete').requires.flags,['exitCleared']);
console.log('PASS: Solo story, all eight endings, no removed characters in presented dialogue, stable story routes.');
