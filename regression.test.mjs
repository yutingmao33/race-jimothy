import assert from 'node:assert/strict';
import {rigDrawing} from './dist/physics.js';
const nodes=new Map(),handlers=new Map(),windowHandlers=new Map();
const context=new Proxy({},{get:()=>()=>{}});
function element(){return {value:'My masterpiece',textContent:'',hidden:false,disabled:false,width:900,height:460,children:[],attributes:{},style:{setProperty(){}},getContext:()=>context,setAttribute(k,v){this.attributes[k]=v},addEventListener(t,f){handlers.set(t,f)},replaceChildren(...v){this.children=v},append(...v){this.children.push(...v)},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:900,height:460})};}
globalThis.document={body:{classList:{toggle(){}}},getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element};globalThis.Image=class {complete=true;naturalWidth=1536};
let hash='';globalThis.location={get hash(){return hash},set hash(v){hash=v.startsWith('#')?v:'#'+v},origin:'https://example.test'};globalThis.window={addEventListener(t,f){windowHandlers.set(t,f)},scrollTo(){},open(){}};let next;globalThis.requestAnimationFrame=f=>{next=f;return 1};globalThis.cancelAnimationFrame=()=>{next=null};
await import('./dist/game.js');
const $=id=>nodes.get(id);
assert.equal($('palette').children.length,5);assert.equal($('race-button').disabled,true);assert.equal($('race-screen').hidden,true);
function draw(points){handlers.get('pointerdown')({clientX:points[0][0],clientY:points[0][1],pointerId:1,button:0});for(const [clientX,clientY] of points.slice(1))handlers.get('pointermove')({clientX,clientY,pointerId:1});const [clientX,clientY]=points.at(-1);handlers.get('pointerup')({clientX,clientY,pointerId:1});}
// A single arbitrary mark, without legs, must enter and finish the race.
$('palette').children[1].onclick();draw([[200,200],[400,200]]);assert.equal($('race-button').disabled,false);$('race-button').onclick();windowHandlers.get('hashchange')();assert.equal($('draw-screen').hidden,true);assert.equal($('race-screen').hidden,false);$('start').onclick();for(let i=0;i<10000&&next;i++){const f=next;next=null;f(i*16.67)}assert.equal($('race-status').textContent,'FINISH LINE');assert.equal($('rankings').children.length,2);assert.equal($('results').hidden,false);assert.equal(next,null);assert.match($('rankings').children.map(r=>r.children[0].textContent).join(),/Jimothy/);
$('edit').onclick();windowHandlers.get('hashchange')();assert.equal($('draw-screen').hidden,false);assert.equal($('race-button').disabled,false);$('undo').onclick();assert.equal($('race-button').disabled,true);
// Tap-only input works; navigating away during a race cancels its animation.
draw([[300,250]]);$('race-button').onclick();windowHandlers.get('hashchange')();$('start').onclick();$('back').onclick();windowHandlers.get('hashchange')();assert.equal(next,null);assert.equal($('race-screen').hidden,true);
const rig=rigDrawing([{type:'body',color:'#ff3b30',points:[{x:100,y:100},{x:200,y:100},{x:200,y:300},{x:100,y:300},{x:100,y:100}]}]);assert.ok(rig.every(s=>s.color==='#ff3b30'));
console.log('PASS: five selectable colors, empty-canvas guard, legless sketch race, exactly two finishers, Jimothy opponent, preserved drawing on return, undo, tap drawing, race cancellation, rig color preservation.');
const {createJimothy,stepJimothy,joint}=await import('./dist/jimothy.js');
const {raceCamera}=await import('./dist/camera.js');
const jim=createJimothy();let planted=0,lifted=0;
for(let tick=0;tick<1200;tick++){
 const before=jim.feet.map(f=>({...f}));stepJimothy(jim,1/120);
 jim.feet.forEach((f,i)=>{assert.ok(f.y>=0);if(f.stance&&before[i].stance){assert.equal(f.x,before[i].x);planted++;}if(!f.stance&&f.y>.1)lifted++;assert.ok(Number.isFinite(f.x));});
}
assert.ok(jim.x>30);assert.ok(planted>1000&&lifted>1000);
const hip={x:0,y:1.5},foot={x:.4,y:0},k=joint(hip,foot,1);
assert.ok(Math.abs(Math.hypot(k.x-hip.x,k.y-hip.y)-Math.hypot(k.x-foot.x,k.y-foot.y))<1e-9);
const airborne=createJimothy();airborne.feet.forEach(f=>f.stance=false);stepJimothy(airborne,1/120);assert.equal(airborne.v,0);
for(const [w,h] of [[390,510],[864,510],[390,260]]){
 const before=raceCamera(w,h,[30,30],10,false,0),after=raceCamera(w,h,[30,30],10,false,1);
 assert.ok(after.project(30,1,0).scale>before.project(30,1,0).scale);
 for(const z of [-1.55,1.55]){const p=after.project(30,1.5,z);assert.ok(p.x>0&&p.x<w&&p.y>0&&p.y<h);}
}
assert.equal(next,null);
console.log('PASS: planted feet do not slide, swing feet clear ground, joint lengths agree, no airborne drive, finish closeup enlarges racers on phone and desktop.');
