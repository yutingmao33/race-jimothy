export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function anatomy(strokes){const legs=strokes.filter(s=>s.type==='legs'&&s.points.length>1);const lengths=legs.map(s=>s.points.slice(1).reduce((a,p,i)=>a+Math.hypot(p.x-s.points[i].x,p.y-s.points[i].y),0));const reaches=legs.map(s=>Math.max(0,...s.points.map(p=>p.y-s.points[0].y)));const reach=reaches.length?reaches.reduce((a,b)=>a+b,0)/reaches.length:0;const variance=reaches.length?Math.sqrt(reaches.reduce((a,b)=>a+(b-reach)**2,0)/reaches.length):0;const straightness=lengths.length?lengths.reduce((a,l,i)=>a+clamp(reaches[i]/Math.max(l,1),0,1),0)/lengths.length:0;const balance=clamp(1-variance/Math.max(reach,1),.12,1);return {legs:legs.length,reach,balance,straightness,lengths,reaches};}
export function stepRunner(r,dt,time){const a=r.anatomy;const cadence=clamp(3.4-a.reach/160,1.6,3.3);const gait=.74+.26*Math.sin(time*cadence*Math.PI*2+r.phase);const traction=clamp(a.legs/3,.15,1.2)*(.3+.7*a.straightness);const stride=clamp(a.reach/80,.2,1.8);const stability=.38+.62*a.balance;const force=5.2*stride*traction*stability*gait;const drag=.46*r.v+(.05+Math.max(0,a.legs-5)*.018)*r.v*r.v;r.v=Math.max(0,r.v+(force-drag)*dt);r.x+=r.v*dt;r.bob=Math.sin(time*cadence*Math.PI*2+r.phase)*(.6+(1-a.balance)*4);r.tilt=Math.sin(time*cadence*Math.PI*2+r.phase)*(1-a.balance)*.3;r.cadence=cadence;}

// Explicit leg strokes are direction independent. In auto mode, split out
// downward protrusions below the dense upper part of the drawing.
export function rigDrawing(strokes){
 const clean=strokes.filter(s=>s.points.length>1);
 if(clean.some(s=>s.type==='legs'))return clean.map(s=>s.type==='legs'&&s.points[0].y>s.points.at(-1).y?{...s,points:[...s.points].reverse()}:s);
 const points=clean.flatMap(s=>s.points);if(points.length<4)return clean;
 const ys=points.map(p=>p.y),min=Math.min(...ys),max=Math.max(...ys),height=max-min;
 if(height<30)return clean;
 const cut=min+height*.64,result=[];
 for(const stroke of clean){let run=[stroke.points[0]],below=run[0].y>cut;
 const flush=()=>{if(run.length<2)return;const depth=Math.max(...run.map(p=>p.y))-cut;const type=below&&depth>height*.12?'legs':'body';if(type==='legs'&&run[0].y>run.at(-1).y)run.reverse();result.push({...stroke,type,points:run});};
 for(let i=1;i<stroke.points.length;i++){const p=stroke.points[i],prev=stroke.points[i-1],nextBelow=p.y>cut;if(nextBelow!==below){const f=(cut-prev.y)/(p.y-prev.y);const cross={x:prev.x+(p.x-prev.x)*f,y:cut};run.push(cross);flush();run=[cross,p];below=nextBelow;}else run.push(p);}flush();}
 return result;
}
