const dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
const sub=(a,b)=>a.map((n,i)=>n-b[i]);
const norm=a=>{const d=Math.hypot(...a);return a.map(n=>n/d)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function raceCamera(width,height,positions,time=0,reduced=false,finish=0,winnerLane=0){
 const center=positions.length?positions.reduce((a,b)=>a+b,0)/positions.length:0;
 const gap=positions.length?Math.max(...positions)-Math.min(...positions):0;
 const orbit=reduced?0:Math.sin(Math.min(time,10)*.16)*.22;
 const distance=14+gap*.7;
 let eye=[center-distance*(.42+orbit),8+gap*.25,distance];
 let target=[center+.7,.4,0];
 const blend=finish*finish*(3-2*finish);
 eye=eye.map((v,i)=>v+( [25,5.8,10][i]-v)*blend);
 target=target.map((v,i)=>v+([30,1.3,winnerLane*.3][i]-v)*blend);
 const forward=norm(sub(target,eye)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);
 const focal=Math.min(width*.95,height*1.15);
 return {center,project(x,y,z){const p=sub([x,y,z],eye),depth=dot(p,forward);if(depth<.25)return null;return {x:width*.5+dot(p,right)*focal/depth,y:height*.56-dot(p,up)*focal/depth,scale:focal/depth,depth};}};
}
