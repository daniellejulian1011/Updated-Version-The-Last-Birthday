/* THE LAST BIRTHDAY · SOLO SURVIVAL STORY EDITION v1.6
 * Story-data overlay. Applies before app.js and engine.js execute.
 * Keeps stable node IDs so existing saved games remain loadable.
 * Mr. Morrow remains entirely mute in 1983; Robin died in 1973.
 */
import { NODES, ENDINGS, CHARACTERS, ITEMS } from './story.js';

// Remove both supporting characters from every in-game character listing.
for (let i = CHARACTERS.length - 1; i >= 0; i--) {
  if (/^(ELLIS WARD|NORA BELL)$/i.test(CHARACTERS[i]?.name || '')) CHARACTERS.splice(i, 1);
}
// Retain the legacy item ID for imported saves, but give it a neutral description.
if (ITEMS.radio) ITEMS.radio = ['Folded maintenance diagram', 'A copy of the old service-exit warning.'];

function edit(id, changes) {
  const node=NODES[id];
  if (!node) throw new Error(`Missing story node: ${id}`);
  Object.assign(node, changes);
}
function option(id,label,to,effects={},requires=null) { return {id,label,to,effects,requires,point:null}; }
function ending(id,text,title=null) {
  if (!ENDINGS[id]) throw new Error(`Missing ending: ${id}`);
  ENDINGS[id].text=text;
  if(title) ENDINGS[id].title=title;
  // The static ending nodes take their text from ENDINGS when initialized.
  const key='end_'+id;
  if(NODES[key]) { NODES[key].text=text; if(title)NODES[key].title=title; }
}

ending('daylight', 'I emerge from the service exit with the original guest register, Edwin’s signed exit order, Robin’s death certificate, and Ruth’s sworn testimony. Before dawn I turn over copies and originals to the county sheriff. The fire inquiry is reopened. Robin remains a child who died in 1973. At last, his name is on the public record where it belongs. My last photograph shows an empty stage.');
ending('witness', 'I make the road alive, with fragments of proof and a story I refuse to keep quiet. At the sheriff’s office I record every detail under my own name. Some documents remain inside the palace. As I drive home, something strikes the underside of my car—once, deliberately.');
ending('stay', 'I squeeze a waterproof document pouch through a narrow street-facing service hatch onto the road. The door frame falls and pins my leg. Mr. Morrow stops on the other side of the glass. No voice, no final song, no explanation. The demolition foreman discovers the sealed proof the next morning. The record escapes. I do not.', 'THE LAST DELIVERY');

// June enters by herself. There is no radio companion waiting outside.
const arrival=NODES.arrival.choices.find(c=>c.id==='begin');
if(arrival)arrival.effects.items=(arrival.effects.items||[]).filter(x=>x!=='radio');
const gate=NODES.forecourt.choices.find(c=>c.id==='radio');
if(gate){gate.id='gate';gate.label='READ THE SERVICE GATE WARNING';gate.to='radio_intro';gate.effects={minutes:1};}
edit('radio_intro',{
 title:'THE WARNING LEFT BEHIND',speaker:'JUNE MERCER',voice:'Exit first. That is what they wrote.',
 text:'Behind the service gate hangs an old inspector’s warning: stage wiring overheating; restore emergency power to the east exit before energizing any other circuit. Somebody underlined EAST EXIT FIRST. There is no one else coming to get me.',
 choices:[option('trust','REMEMBER THE WARNING','forecourt',{flags:{notedExit:true}}),option('cold','RETURN TO THE FRONT DOORS','forecourt')]
});

edit('power_on',{
 text:'The east-exit lamp glows. House lights follow. Finally, the stage relay engages. Somewhere beyond the wall, a very large thing takes one step. I close the maintenance cabinet, gripping the flashlight until my knuckles ache.',
 voice:'The exit first. At least this time.',speaker:'JUNE MERCER',
 choices:[option('ellis','CHECK THE SERVICE EXIT MECHANISM','ellis_promise',{flags:{exitPlanned:true}}),option('alone','KEEP SEARCHING FOR THE RECORDS','workshop_hub')]
});
edit('ellis_promise',{
 title:'ONE WAY OUT',speaker:'JUNE MERCER',voice:'First the records. Then the door.',
 text:'The relay diagram shows a manual lifting bar beside the east service door. The doorway is warped, its counterweight broken. I will have to raise it myself, then slide through before it falls again.',
 choices:[option('return','CONTINUE SEARCHING','workshop_hub')]
});

edit('tunnel_intro',{
 text:'The passage beneath the stage is lit by a failing emergency bulb. At its far end, a rusted chain hangs from the warped exit. A long lifting bar lies on the wet concrete. Behind me the stairs creak once.',
 voice:'The exit. The same door.',speaker:'JUNE MERCER',
 choices:[option('meet','APPROACH THE WARPED EXIT','ellis_door',{minutes:3,battery:-2}),option('chain','EXAMINE THE OLD CHAIN','chain',{minutes:2}),option('return','RETURN TO THE ARCHIVE','archive_hub',{minutes:3,battery:-2},{any:[{items:['key']},{items:['cutters']}]})]
});
edit('chain',{
 text:'The chain is still here. A warning plaque says REMOVE DURING OCCUPANCY. Someone painted over the final word. I photograph it before the exit lamp dims.',
 choices:[option('return','GO BACK TO THE EXIT BAR','ellis_door',{minutes:1})]
});
edit('ellis_door',{
 title:'HOLD THE FRAME',speaker:'JUNE MERCER',voice:'Come on. Just one inch more.',
 text:'The manual bar weighs more than I expected. One end is wedged beneath the exit door; a broken spring holds the other. I could lift it enough to crawl under. The drain ends beneath the foundations, not at the road. Something heavy starts down the stairs behind me.',
 choices:[option('help','LIFT THE EMERGENCY DOOR','help_ellis',{nerve:8}),option('drain','TAKE THE DRAIN INSTEAD','drain',{nerve:15}),option('hide','HIDE IN THE MAINTENANCE ALCOVE','alcove',{nerve:12})],
 timed:15,timeout:'hide',threat:true
});
edit('help_ellis',{
 title:'THE DOOR GIVES',speaker:'JUNE MERCER',voice:null,
 text:'I jam the lifting bar under the frame and wrench upward. A crawlspace opens between metal and concrete. At the far end of the passage, Mr. Morrow lowers his head beneath the pipe. He has found the room with no other exit.',
 choices:[
  option('escape','CRAWL OUT WITH THE ORIGINAL RECORDS','final_crossing',{flags:{exitCleared:true}}),
  option('send','SLIDE THE EVIDENCE THROUGH THE STREET HATCH','sacrifice',{flags:{sentRecords:true}},{evidenceCount:3,any:[{items:['ledger']},{items:['tape']}]}),
  option('burn','SET THE STAGE CURTAINS ALIGHT','fire_plan',{flags:{exitCleared:true}})
 ]
});
edit('final_crossing',{
 text:'The gate begins to fall as I slide beneath it. My bag scrapes concrete. Mr. Morrow’s glove catches the strap and yanks me halfway backward. There is time for one decision.',
 choices:[option('cut','CUT THE STRAP. KEEP THE RECORDS.','road',{nerve:6},{items:['cutters']}),option('slip','SLIP OUT OF THE STRAP WITH THE BAG','road',{nerve:12},{flags:['evaded']}),option('drop','DROP THE BAG AND RUN','road_lost',{removeItems:['film','ledger','tape'],removeEvidence:['directive','recording','testimony','list','photo']}),option('pull','PULL AGAINST HIS HAND','final_pull',{noise:20,nerve:16})]
});
edit('final_pull',{
 text:'The bag holds. The rotten door frame does not. The space narrows around my shoulders. From the dark behind me, a stained glove reaches into the last strip of light.',
 choices:[option('last','MAKE ONE LAST ATTEMPT','end_guest')]
});
edit('road',{
 title:'THE ROAD HOME',speaker:'JUNE MERCER',voice:'This time they will read every word.',objective:'Get the original proof into official custody.',
 text:'I slam the car door. The original documents spill across the passenger seat. My hands shake so badly I can barely turn the ignition. The county sheriff’s office is eight miles away. I look in the rearview mirror only once.',
 choices:[option('complete','TAKE THE COMPLETE RECORD TO THE SHERIFF','end_daylight',{}, {evidence:['directive','testimony','list','coroner'],items:['ledger','tape'],flags:['exitCleared']}),option('testify','REPORT EVERYTHING I MANAGED TO SAVE','end_witness')]
});
edit('road_lost',{
 text:'I pull into the roadway and abandon the bag on the palace floor. At the sheriff’s office I can describe the ledger, the locked exit, and the chain, but I have no originals. I write my statement anyway.',
 choices:[option('leave','FILE MY STATEMENT AND GO HOME','end_witness')]
});
edit('sacrifice',{
 title:'THE LAST DELIVERY',speaker:'JUNE MERCER',voice:'Please let somebody find them.',
 text:'A narrow delivery hatch faces the empty street. I seal the proof in my waterproof camera bag and shove it through the opening. The pouch lands on wet pavement outside. The twisted exit frame crashes down behind my back. The records are beyond his reach. I am not.',
 choices:[option('send','HOLD THE DOOR UNTIL THE FILES ARE SAFE','end_stay')]
});
edit('drain',{
 text:'The grate gives beneath me. Black water reaches my waist. I remember the maintenance diagram: the drainage channel ends beneath the foundations. Above me, the grate is pushed closed by a dirty ivory glove.',
 choices:[option('records','PUSH THE EVIDENCE UP THROUGH THE GRATE','end_floor',{}, {evidenceCount:3}),option('climb','CLIMB TOWARD THE HAND','end_guest'),option('wait','WAIT IN THE DARK','end_guest')]
});
edit('alcove',{
 text:'I fit behind the hot-water tank. Mr. Morrow stops outside. The edge of his ear lowers into the gap. The space was built for a pipe, not a person.',
 choices:[option('dash','DASH FOR THE OPENING UNDER THE EXIT','help_ellis',{nerve:15}),option('still','STAY ABSOLUTELY STILL','end_guest')]
});

// Every visible piece of authored text must be free of deleted characters.
const removed=/\b(?:ellis|nora)\b/i;
const allText=[...CHARACTERS.flatMap(c=>[c.name,c.role,c.text,c.voice]),...Object.values(ENDINGS).flatMap(e=>[e.title,e.text,e.type]),...Object.values(NODES).flatMap(n=>[n.title,n.text,n.speaker,n.voice,n.objective,...(n.choices||[]).map(c=>c.label)])];
if(allText.some(x=>removed.test(String(x||''))))throw new Error('A removed character is still present in story dialogue.');
export const SOLO_STORY_READY=true;
