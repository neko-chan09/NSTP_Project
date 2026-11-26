import {useEffect,useState} from 'react';
export default function PhilippineClock(){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const tick=()=>setNow(new Date());const timer=window.setInterval(tick,1000);document.addEventListener('visibilitychange',tick);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',tick)}},[]);
 return <><span className="hidden md:inline-block text-slate-500 text-xs bg-slate-100 px-3 py-1 rounded">{now.toLocaleDateString('en-US',{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric'})}</span><time title="Philippine Standard Time" dateTime={now.toISOString()} className="text-slate-500 text-xs bg-slate-100 px-3 py-1 rounded font-mono">{now.toLocaleTimeString('en-US',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})} PHT</time></>;
}
