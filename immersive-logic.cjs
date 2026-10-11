// Self-contained, dependency-free check for the world map and enemy navigation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/../js/immersive.js','utf8');
const start=src.slice(0,src.indexOf("const root=$('game')"));
const raycode=src.slice(src.indexOf('function ray('),src.indexOf('function resize()'));
const code=start+raycode+`globalThis.logic={MAP,SCENE_SPAWN,DIFFICULTY,tile,wall,region,canStand,clearSight,pathfind,ray};})();`;
const sandbox={Math,performance:{now:()=>0},localStorage:{getItem:()=>null},console};vm.runInNewContext(code,sandbox,{timeout:3000});const x=sandbox.logic;
assert.equal(Object.keys(x.SCENE_SPAWN).length,9,'Nine authored places');
assert.equal(Object.keys(x.DIFFICULTY).length,3,'Three difficulty modes');
for(const [name,[px,py]] of Object.entries(x.SCENE_SPAWN)){
 assert.ok(x.canStand(px,py),'Spawn must be safe: '+name);
 assert.ok(x.pathfind({x:4.5,y:14.5},{x:px,y:py}).length>0,'Room reachable: '+name);
}
for(let n=0;n<360;n+=10){const r=x.ray(13.5,12.5,n*Math.PI/180);assert.ok(Number.isFinite(r.d)&&r.d>0,'Finite ray '+n);}
assert.equal(x.canStand(-1,-1),false,'Solid outer boundary');
assert.equal(x.wall(0,0),true);
assert.ok(x.DIFFICULTY.easy.stun>x.DIFFICULTY.nightmare.stun);
assert.ok(x.DIFFICULTY.normal.speed<x.DIFFICULTY.nightmare.speed);
console.log('PASS: 9 reachable rooms, 36 ray angles, solid walls, 3 scaled difficulties');
