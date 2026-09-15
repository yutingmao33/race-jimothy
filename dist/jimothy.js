// Four feet alternate in diagonal pairs. Stance feet stay fixed in world space;
// swing feet lift and land ahead. Ground contact supplies the running impulse.
const offsets=[0,.5,.5,0],hips=[-.48,.44,-.48,.44];
export function createJimothy(){
 const r={name:'Jimothy',x:0,v:0,bob:0,tilt:0,cycle:0,cadence:2.1,feet:[]};
 r.feet=hips.map((hip,i)=>({x:hip+(offsets[i]===0?.25:-.25),y:0,stance:true,start:0,target:0}));return r;
}
export function stepJimothy(r,dt){
 const contacts=r.feet.filter(f=>f.stance).length;
 const force=contacts?Math.min(7.8,(5.4-r.v)*4)*contacts/2:0;
 r.v=Math.max(0,r.v+(force-.3*r.v)*dt);r.x+=r.v*dt;
 r.cadence=1.7+r.v*.12;r.cycle+=dt*r.cadence;
 r.feet.forEach((f,i)=>{
  const phase=(r.cycle+offsets[i])%1,stance=phase<.6;
  if(!stance&&f.stance){f.start=f.x;f.target=r.x+hips[i]+r.v*.4/r.cadence+.28;}
  if(!stance){const u=(phase-.6)/.4,s=u*u*(3-2*u);f.x=f.start+(f.target-f.start)*s;f.y=.32*Math.sin(Math.PI*u);}
  else if(!f.stance){f.x=f.target;f.y=0;}
  f.stance=stance;
 });
 r.bob=.045*Math.cos(r.cycle*Math.PI*4);r.tilt=.025*Math.sin(r.cycle*Math.PI*2);
}
export function joint(hip,foot,bend){
 const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy));
 // Equal segments, long enough to reach planted feet without sliding them.
 const length=Math.max(.92,d/2+.001),h=Math.sqrt(Math.max(0,length*length-d*d/4));
 return {x:(hip.x+foot.x)/2-dy/d*h*bend,y:(hip.y+foot.y)/2+dx/d*h*bend};
}
export function drawJimothy(c,r,project,lane){
 const path=(points,color='#292631',width=2.7)=>{const ps=points.map(p=>project(r.x+p[0],p[1],lane+(p[2]||0)));if(ps.some(p=>!p))return;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()};
 function leg(i){const z=i<2?-.14:.14,hip={x:hips[i],y:1.48+r.bob+hips[i]*r.tilt},f=r.feet[i],foot={x:f.x-r.x,y:f.y},k=joint(hip,foot,i%2?-1:1);path([[hip.x,hip.y,z],[k.x,k.y,z],[foot.x,foot.y,z],[foot.x+.12,foot.y,z]],i<2?'#928995':'#292631');}
 leg(0);leg(1);
 const b=r.bob;
 // Open, unfilled pen contours: compressed arch, low pointed face, mask and tail.
 const body=points=>path(points.map(([x,y])=>[x,y+b+x*r.tilt]));
 body([[-.48,1.46],[-.67,1.86],[-.57,2.23],[-.34,2.49],[.02,2.57],[.36,2.4],[.51,2.08],[.73,1.88],[1.13,1.58],[.92,1.48],[.6,1.58],[.4,1.77]]);
 body([[.48,2.13],[.44,2.43],[.66,2.25],[.65,2.02]]);
 body([[.57,1.97],[.78,1.9],[.91,1.68],[.67,1.72],[.57,1.97]]);
 body([[.72,1.83],[.75,1.84]]);body([[1.04,1.62],[1.12,1.59],[1.07,1.56]]);
 body([[-.6,1.79],[-.9,1.65],[-.94,1.48],[-.75,1.52],[-.53,1.65]]);
 body([[-.83,1.68],[-.78,1.53]]);body([[-.7,1.74],[-.65,1.59]]);
 leg(2);leg(3);
}
