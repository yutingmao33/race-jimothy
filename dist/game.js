import {createSound,footbeat} from './sound.js';
import {createJimothy,stepJimothy,drawJimothy} from './jimothy.js';
import {raceCamera} from './camera.js';
import {anatomy,stepRunner,clamp,rigDrawing} from './physics.js';
const $=id=>document.getElementById(id),drawing=$('drawing'),dc=drawing.getContext('2d'),track=$('track'),tc=track.getContext('2d');
const sound=createSound();
function soundLabel(){$('sound-toggle').textContent=sound.muted?'Sound off':'Sound on';$('sound-toggle').setAttribute('aria-pressed',String(!sound.muted));}
$('sound-toggle').onclick=()=>{sound.toggle();soundLabel();if(!sound.muted)sound.click(false)};soundLabel();
document.addEventListener?.('pointerdown',()=>sound.unlock(),{capture:true});
document.addEventListener?.('click',e=>{const b=e.target.closest?.('button');if(!b||b.disabled||b.id==='sound-toggle')return;sound.unlock();sound.click(b.classList.contains('primary'));},{capture:true});
document.addEventListener?.('visibilitychange',()=>{if(document.hidden)sound.stop();});
const palette=[['Graphite','#1d1d1f'],['Purple','#9747ff'],['Blue','#1abcfe'],['Coral','#f24e1e'],['Green','#0acf83']];
let color=palette[0][1],strokes=[],active=null,pointer=null,runners=[],running=false,elapsed=0,countdown=0,last=null,frameId=0,finishZoom=0;
for(const [name,hex] of palette){const b=document.createElement('button');b.className='color';b.style.setProperty('--color',hex);b.setAttribute('aria-label',name+' pen');b.setAttribute('aria-pressed',String(color===hex));b.onclick=()=>{color=hex;for(const el of $('palette').children)el.setAttribute('aria-pressed',String(el===b));};$('palette').append(b);}
function render(c,parts,t=0,runner=null){c.lineCap='round';c.lineJoin='round';c.lineWidth=7;for(const [i,s] of parts.entries()){if(!s.points.length)continue;c.save();c.strokeStyle=s.color||palette[0][1];if(runner&&s.type==='legs'){const root=s.points[0];c.translate(root.x,root.y);c.rotate(Math.sin(t*(runner.cadence||2.4)*Math.PI*2+i*2.1)*.22);c.translate(-root.x,-root.y);}c.beginPath();s.points.forEach((p,j)=>j?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(s.points.length===1){c.lineTo(s.points[0].x+.1,s.points[0].y+.1)}c.stroke();c.restore();}}
function paintDrawing(){dc.clearRect(0,0,drawing.width,drawing.height);render(dc,active?[...strokes,active]:strokes);$('hint').hidden=strokes.length>0||!!active;}
function fitDrawing(){const r=drawing.getBoundingClientRect();if(!r.width||!r.height)return;const height=Math.round(900*r.height/r.width);if(height!==drawing.height){const factor=height/drawing.height;for(const s of strokes)for(const p of s.points)p.y*=factor;if(active)for(const p of active.points)p.y*=factor;drawing.height=height;}}
function refresh(){fitDrawing();paintDrawing();$('undo').disabled=!strokes.length;$('clear').disabled=!strokes.length;$('race-button').disabled=!strokes.length;$('stroke-status').textContent=strokes.length?strokes.length+' strokes. One original.':'A blank canvas. Endless possibilities.';$('message').textContent=strokes.length?'Looking good. Ready when you are.':'No rules. Just draw something.';}
function point(e){const r=drawing.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width*drawing.width,0,drawing.width),y:clamp((e.clientY-r.top)/r.height*drawing.height,0,drawing.height)}}
drawing.addEventListener('pointerdown',e=>{if(running||active||e.button>0)return;pointer=e.pointerId;active={type:'body',color,points:[point(e)]};drawing.setPointerCapture(e.pointerId);paintDrawing()});
drawing.addEventListener('pointermove',e=>{if(!active||pointer!==e.pointerId)return;for(const event of e.getCoalescedEvents?.()||[e]){const p=point(event),prev=active.points.at(-1);if(Math.hypot(p.x-prev.x,p.y-prev.y)>2)active.points.push(p);}paintDrawing()});
function endStroke(e){if(!active||pointer!==e.pointerId)return;active.points.push(point(e));strokes.push(active);active=null;pointer=null;refresh()}
drawing.addEventListener('pointerup',endStroke);drawing.addEventListener('pointercancel',e=>{if(e.pointerId===pointer){active=null;pointer=null;paintDrawing()}});
$('undo').onclick=()=>{strokes.pop();refresh()};$('clear').onclick=()=>{strokes=[];refresh()};
$('sample').onclick=()=>{const body=Array.from({length:49},(_,i)=>({x:450+Math.cos(i*Math.PI/24)*120,y:200+Math.sin(i*Math.PI/24)*70}));strokes=[{type:'body',color,points:body},...[-65,65].map(dx=>({type:'body',color,points:[{x:450+dx,y:250},{x:460+dx,y:315},{x:490+dx,y:345}]})),{type:'body',color:palette[0][1],points:[{x:485,y:175},{x:487,y:175}]},{type:'body',color:palette[0][1],points:[{x:520,y:175},{x:522,y:175}]}];for(const s of strokes)for(const p of s.points)p.y*=drawing.height/460;refresh()};
$('how').onclick=()=>{$('help').hidden=!$('help').hidden;$('how').setAttribute('aria-expanded',String(!$('help').hidden))};
function buildRunner(){const parts=rigDrawing(strokes),a=anatomy(parts);const pts=strokes.flatMap(s=>s.points),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const bounds={left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};const hop=!a.legs||a.reach<5;
// Every drawing can compete. Legless sketches use a bounded hopping gait.
const shape=hop?{legs:2,reach:75,balance:.8,straightness:.8}: {...a,reach:clamp(a.reach,45,125),balance:Math.max(.6,a.balance),straightness:Math.max(.55,a.straightness)};
return {name:$('name').value.trim()||'My masterpiece',parts:parts.length?parts:strokes,bounds,anatomy:shape,hop,phase:0,x:0,v:0,bob:0,tilt:0};}
function prepare(){finishZoom=0;runners=[buildRunner(),createJimothy()];$('player-name').textContent=runners[0].name;$('player-progress').textContent='0 m';$('jim-progress').textContent='0 m';$('race-status').textContent='READY WHEN YOU ARE';$('race-title').textContent='You vs. Jimothy.';$('results').hidden=true;$('race-actions').hidden=false;$('countdown').textContent='';paintRace(0);}
function route(){sound.stop();running=false;cancelAnimationFrame(frameId);const race=location.hash==='#race'&&strokes.length>0;$('draw-screen').hidden=race;$('race-screen').hidden=!race;document.body.classList.toggle('in-race',race);if(race)prepare();else refresh();window.scrollTo({top:0,behavior:'instant'});}
$('race-button').onclick=()=>{if(!strokes.length){$('message').textContent='Make a mark first, then you can race.';return;}if(location.hash==='#race')route();else location.hash='race';};
function back(){location.hash='draw'}$('back').onclick=back;$('edit').onclick=back;window.addEventListener('hashchange',route);
function paintRace(t){
 const rect=track.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
 const W=rect.width||1000,H=rect.height||650;
 if(track.width!==Math.round(W*ratio)||track.height!==Math.round(H*ratio)){track.width=Math.round(W*ratio);track.height=Math.round(H*ratio);}
 tc.setTransform(ratio,0,0,ratio,0,0);tc.clearRect(0,0,W,H);tc.fillStyle='#f5f3fb';tc.fillRect(0,0,W,H);
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const camera=raceCamera(W,H,runners.map(r=>Math.min(r.x,30)),t,reduced,finishZoom,runners[0]?.place===1?1.55:-1.55),P=camera.project;
 function poly(vertices,fill){const p=vertices.map(v=>P(...v));if(p.some(v=>!v))return;tc.beginPath();p.forEach((v,i)=>i?tc.lineTo(v.x,v.y):tc.moveTo(v.x,v.y));tc.closePath();tc.fillStyle=fill;tc.fill();}
 function line(a,b,color,width=1){const p=P(...a),q=P(...b);if(!p||!q)return;tc.strokeStyle=color;tc.lineWidth=width;tc.beginPath();tc.moveTo(p.x,p.y);tc.lineTo(q.x,q.y);tc.stroke();}
 // Ground grid and lane geometry are projected through a following 3D camera.
 const from=Math.floor(camera.center)-12,to=Math.min(46,Math.floor(camera.center)+25);
 for(let x=from;x<=to;x+=2)line([x,-.15,-13],[x,-.15,13],'#e7e2f1');
 for(let z=-12;z<=12;z+=2)line([from,-.15,z],[to,-.15,z],'#e7e2f1');
 // Draw the far end first. Two white lanes with vivid outside rails.
 for(let x=to;x>=from;x--){
 poly([[x,0,-3.3],[x+1,0,-3.3],[x+1,0,0],[x,0,0]],'#fefefe');
 poly([[x,0,0],[x+1,0,0],[x+1,0,3.3],[x,0,3.3]],'#faf8ff');
 poly([[x,0,-3.3],[x+1,0,-3.3],[x+1,0,-3.12],[x,0,-3.12]],'#1abcfe');
 poly([[x,0,3.12],[x+1,0,3.12],[x+1,0,3.3],[x,0,3.3]],'#9747ff');
 poly([[x,0,3.3],[x+1,0,3.3],[x+1,-.25,3.3],[x,-.25,3.3]],'#c6a0fa');
 if(x%2===0)line([x,.01,0],[x+.8,.01,0],'#dfd9eb',2);
 }
 for(let x=Math.ceil(from/5)*5;x<=Math.min(to,30);x+=5){const p=P(x,0,4);if(p){tc.fillStyle='#a092b5';tc.font='600 '+Math.max(10,p.scale*.28)+'px system-ui';tc.textAlign='center';tc.fillText(x+'m',p.x,p.y);}}
 for(let z=-3.2;z<3.2;z+=.4)for(let x=30;x<30.8;x+=.4)poly([[x,.015,z],[x+.4,.015,z],[x+.4,.015,z+.4],[x,.015,z+.4]],(Math.round(z/.4)+Math.round(x/.4))%2?'#272334':'#fefefe');
 // A finish arch comes into view as the camera reaches the end of the course.
 for(const z of [-3.4,3.4])line([30,0,z],[30,3.8,z],'#3b2b50',4);
 line([30,3.8,-3.4],[30,3.8,3.4],'#9747ff',14);
 const banner=P(30,4.1,0);if(banner){tc.fillStyle='#7032bc';tc.font='700 '+Math.max(12,banner.scale*.36)+'px system-ui';tc.textAlign='center';tc.fillText('FINISH',banner.x,banner.y);}
 const sorted=runners.map((r,i)=>({r,i,p:P(Math.min(r.x,30),0,i===0?1.55:-1.55)})).filter(o=>o.p).sort((a,b)=>b.p.depth-a.p.depth);
 for(const {r,i,p} of sorted){const moving=running&&countdown<=0&&!r.finish,phase=t*(r.cadence||2.5)*6.28;const hop=moving&&!reduced?(i===1?Math.abs(Math.sin(phase))*.09:r.hop?Math.abs(Math.sin(phase))*.24:Math.abs(r.bob)*.025):0;const size=p.scale*2.9;
 tc.fillStyle='#30233e12';tc.beginPath();tc.ellipse(p.x,p.y+3,size*.4,size*.095,0,0,Math.PI*2);tc.fill();
 tc.save();tc.translate(p.x,p.y-hop*p.scale);if(i===0){const b=r.bounds,scale=Math.min(size/Math.max(b.right-b.left,30),size/Math.max(b.bottom-b.top,30));tc.rotate(moving&&!reduced?r.tilt:0);tc.scale(scale,scale);tc.translate(-(b.left+b.right)/2,-b.bottom);render(tc,r.parts,t,moving&&!reduced?r:null);}else {tc.restore();drawJimothy(tc,r,P,-1.55);tc.save();}tc.restore();
 tc.textAlign='center';tc.fillStyle=i===0?'#7a35d5':'#39778e';tc.font='700 12px system-ui';tc.fillText(r.finish?'#'+r.place:i===0?'YOU':'JIMOTHY',p.x,p.y+25);
 }tc.textAlign='left';
}
window.addEventListener('resize',()=>{if(!$('draw-screen').hidden)refresh();else if(!running)paintRace(elapsed)});
function start(){if(running)return;cancelAnimationFrame(frameId);sound.stop();sound.unlock();prepare();running=true;elapsed=0;last=null;countdown=3;$('race-actions').hidden=true;$('race-status').textContent='ON YOUR MARKS';$('race-title').textContent='Ready. Set. Doodle.';$('countdown').textContent='3';sound.countdown(3);frameId=requestAnimationFrame(frame)}
function frame(now){if(!running)return;const dt=last===null?0:Math.min((now-last)/1000,.05);last=now;if(countdown>0){const previousCount=Math.ceil(countdown);countdown-=dt;if(Math.max(0,Math.ceil(countdown))!==previousCount)sound.countdown(Math.max(0,Math.ceil(countdown)));$('countdown').textContent=countdown>0?Math.ceil(countdown):'';if(countdown<=0){$('race-status').textContent='RACING';$('race-title').textContent='Make your move.'}}else{elapsed+=dt;for(const r of runners){if(r.finish)continue;const before=r.x,beat=footbeat(r,elapsed-dt);if(r.feet){const steps=Math.max(1,Math.ceil(dt/(1/120)));for(let i=0;i<steps;i++)stepJimothy(r,dt/steps);}else stepRunner(r,dt,elapsed);if(footbeat(r,elapsed)!==beat)sound.foot(!!r.feet);if(r.x>=30)r.finish=elapsed-dt+dt*(30-before)/(r.x-before);}runners.filter(r=>r.finish).sort((a,b)=>a.finish-b.finish).forEach((r,i)=>r.place=i+1);$('player-progress').textContent=Math.min(30,runners[0].x).toFixed(1)+' m';$('jim-progress').textContent=Math.min(30,runners[1].x).toFixed(1)+' m';}paintRace(elapsed);if(runners.every(r=>r.finish)){finish();return}frameId=requestAnimationFrame(frame)}
function finish(){running=false;$('race-status').textContent='FINISH LINE';const won=runners[0].place===1;sound.stop();sound.result(won);$('race-title').textContent=won?'Imagination wins.':'Jimothy takes this one.';$('result-title').textContent=won?'You outran Jimothy.':'A rematch is only a doodle away.';$('result-copy').textContent=won?'A little ink. A very big victory.':'Try a different shape, or give your creation longer, more even legs.';$('rankings').replaceChildren(...[...runners].sort((a,b)=>a.place-b.place).map(r=>{const li=document.createElement('li'),name=document.createElement('b'),time=document.createElement('span');name.textContent=r.place+'. '+r.name;time.textContent=r.finish.toFixed(2)+'s';li.append(name,time);return li}));const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;let previous=null;function closeup(now){const dt=previous===null?0:Math.min((now-previous)/1000,.05);previous=now;finishZoom=reduced?1:Math.min(1,finishZoom+dt/1.8);paintRace(elapsed);if(finishZoom<1)frameId=requestAnimationFrame(closeup);else $('results').hidden=false;}frameId=requestAnimationFrame(closeup)}
$('start').onclick=start;$('again').onclick=start;$('share').onclick=()=>{if(!runners[0]?.finish)return;const r=runners[0],url=new URL('https://twitter.com/intent/tweet');url.searchParams.set('text',r.place===1?'I drew '+r.name+' and beat Jimothy in '+r.finish.toFixed(2)+'s. Can your doodle beat a raccoon?':'I drew '+r.name+'. Jimothy won. I need better ideas.');url.searchParams.set('url',location.origin+location.pathname);window.open(url.href,'_blank','noopener,noreferrer')};
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_race_state',description:'Read the two-contender race state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw Error('No arguments expected');return {running,strokes:strokes.length,contenders:runners.map(r=>({name:r.name,place:r.place||null,time:r.finish||null}))}}})).catch(()=>{})}catch{}}
route();
