// Small synthesized effects, with no downloads or background playback loop.
export function createSound(){
 let context,muted=false;const voices=new Set();
 try{muted=localStorage.getItem('race-jimothy-muted')==='true'}catch{}
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!context&&Audio)context=new Audio();if(context?.state==='suspended')context.resume().catch(()=>{});}catch{}}
 function stop(){for(const voice of voices){try{voice.stop()}catch{}}voices.clear();}
 function tone(freq,duration=.1,volume=.08,type='sine',delay=0,end=freq){
  if(muted||!context||context.state!=='running'||globalThis.document?.hidden)return;
  const now=context.currentTime+delay,o=context.createOscillator(),gain=context.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(end,now+duration);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  o.connect(gain);gain.connect(context.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();gain.disconnect()};o.start(now);o.stop(now+duration+.02);
 }
 return {unlock,stop,get muted(){return muted},toggle(){muted=!muted;stop();try{localStorage.setItem('race-jimothy-muted',String(muted))}catch{}if(!muted)unlock();return muted},
 click(primary=false){tone(primary?1100:700,primary?.075:.045,primary?.07:.025,'sine',0,primary?1600:500)},
 countdown(n){if(n>0)tone(660,.12,.07);else{tone(880,.16,.075);tone(1320,.22,.065,'sine',.07)}},
 foot(rival=false){tone(rival?170:220,.055,rival?.028:.035,'triangle',0,65)},
 result(won){const notes=won?[523.25,659.25,783.99,1046.5]:[523.25,440,349.23,261.63];notes.forEach((f,i)=>tone(f,i===3?.42:.18,.065,'sine',i*.13));}
 };
}
export function footbeat(r,time){return r.feet?Math.floor(r.cycle*2):Math.floor(time*(r.cadence||2.4)*(r.hop?2:1));}
