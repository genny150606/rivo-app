import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const VIDEO = { width: 1080, height: 1920, fps: 30, duration: 900 };

const C = {
  bg: "#060607",
  white: "#F7F7F8",
  muted: "#777780",
  panel: "#111113",
  line: "#29292E",
  lime: "#B4F02A",
  black: "#080808",
};

const LOGO = staticFile("brand/rivo-logo-full.png");
function makeTone(freq:number,duration:number,kind:"tap"|"whoosh"|"impact"){const sr=11025,n=Math.floor(sr*duration),bytes=new Uint8Array(44+n*2),v=new DataView(bytes.buffer),put=(o:number,s:string)=>[...s].forEach((x,i)=>v.setUint8(o+i,x.charCodeAt(0)));put(0,"RIFF");v.setUint32(4,bytes.length-8,true);put(8,"WAVE");put(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);put(36,"data");v.setUint32(40,n*2,true);for(let i=0;i<n;i++){const t=i/sr;let f=freq,a=.18;if(kind==="whoosh"){f=freq+1900*Math.pow(t/duration,2);a=.12*Math.sin(Math.PI*t/duration)}if(kind==="impact"){f=70+260*Math.exp(-7*t);a=.42*Math.exp(-6*t)}if(kind==="tap")a=.35*Math.exp(-18*t);v.setInt16(44+i*2,Math.max(-1,Math.min(1,Math.sin(2*Math.PI*f*t)*a+(kind==="tap"?Math.sin(2*Math.PI*180*t)*.12*Math.exp(-12*t):0)))*32767,true)}let b="";for(const x of bytes)b+=String.fromCharCode(x);return `data:audio/wav;base64,${btoa(b)}`}
const TAP_SFX=makeTone(1150,.18,"tap"),WHOOSH_SFX=makeTone(520,.65,"whoosh"),IMPACT_SFX=makeTone(70,.55,"impact");
function Sfx({src,from,volume=.4}:{src:string;from:number;volume?:number}){return <Sequence from={from} durationInFrames={2}><Audio src={src} volume={volume}/></Sequence>}
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const ease = Easing.bezier(0.22, 1, 0.36, 1);

function bg(frame: number) {
  const pulse = interpolate(frame % 180, [0, 90, 180], [0.04, 0.09, 0.04], clamp);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -300, background: `radial-gradient(circle at 50% 45%, rgba(180,240,42,${pulse}), transparent 34%)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "90px 90px" }} />
    </AbsoluteFill>
  );
}

function Logo({ size = 180, opacity = 1 }: { size?: number; opacity?: number }) {
  return <Img src={LOGO} style={{ width: size, height: "auto", objectFit: "contain", opacity }} />;
}

function Reveal({ from, children, direction = 1 }: { from: number; children: React.ReactNode; direction?: number }) {
  const f = useCurrentFrame();
  const p = spring({ frame: Math.max(0, f - from), fps: VIDEO.fps, config: { damping: 18, stiffness: 120, mass: 0.65 } });
  const y = interpolate(p, [0, 1], [70 * direction, 0]);
  return <div style={{ opacity: p, transform: `translateY(${y}px)` }}>{children}</div>;
}

function Title({ text, sub, from = 0 }: { text: string; sub?: string; from?: number }) {
  const f = useCurrentFrame();
  const p = spring({ frame: Math.max(0, f - from), fps: VIDEO.fps, config: { damping: 20, stiffness: 110 } });
  const y = interpolate(p, [0, 1], [90, 0]);
  const blur = interpolate(p, [0, 1], [14, 0]);
  return (
    <div style={{ position: "absolute", top: 125, left: 50, right: 50, textAlign: "center", opacity: p, transform: `translateY(${y}px)`, filter: `blur(${blur}px)` }}>
      <div style={{ fontSize: 72, fontWeight: 760, letterSpacing: -4, lineHeight: 0.98 }}>{text}</div>
      {sub && <div style={{ marginTop: 22, color: C.muted, fontSize: 21 }}>{sub}</div>}
    </div>
  );
}

function TapDevice() {
  const f = useCurrentFrame();
  const tap = spring({ frame: Math.max(0, f - 26), fps: VIDEO.fps, config: { damping: 9, stiffness: 280, mass: 0.35 } });
  const phoneX = interpolate(f, [0, 24, 38, 72], [260, 100, -5, -5], { ...clamp, easing: ease });
  const phoneR = interpolate(f, [0, 24, 38, 72], [-8, -4, 0, 0], clamp);
  const glow = interpolate(f, [25, 38, 70], [0, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: "50%", top: "59%", width: 430, height: 300, borderRadius: 42, background: "linear-gradient(145deg,#f7f7f8,#9d9da2)", transform: "translate(-50%,-50%) perspective(1000px) rotateX(52deg) rotateY(-5deg) rotateZ(-3deg) translateZ(40px)", transformStyle:"preserve-3d", boxShadow: "0 50px 100px #000b, inset 0 2px 0 #fff" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 132, height: 132, border: "2px solid #202024", borderRadius: 34, transform: "translate(-50%,-50%)", display: "grid", placeItems: "center" }}>
          <div style={{ width: 76, height: 76, border: "3px solid #202024", borderRadius: 21 }} />
          <div style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: C.lime, boxShadow: `0 0 35px ${C.lime}` }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: "50%", top: "42%", width: 285, height: 575, borderRadius: 43, background: "#0b0b0d", border: "2px solid #343439", padding: 9, boxShadow: "0 50px 120px #000", transform: `translate(-50%,-50%) perspective(1100px) translate3d(${phoneX}px,0,${interpolate(f,[0,30,70],[120,360,40],clamp)}px) rotateY(${interpolate(f,[0,30,70],[-18,-2,0],clamp)}deg) rotateX(${interpolate(f,[0,30],[5,0],clamp)}deg) rotate(${phoneR}deg) scale(.82)`, transformStyle:"preserve-3d" }}>
        <div style={{ height: "100%", borderRadius: 35, background: "#101012", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 82, height: 22, borderRadius: 20, background: "#050506" }} />
          <div style={{ padding: "70px 24px" }}>
            <div style={{ color: C.muted, fontSize: 12 }}>CONNECTED EXPERIENCE</div>
            <div style={{ fontSize: 33, fontWeight: 750, marginTop: 10 }}>Welcome to<br/><span style={{ color: C.lime }}>RIVO.</span></div>
            <div style={{ marginTop: 35, display: "grid", gap: 9 }}>
              {["Google Review","Chiama Sala","Loyalty","Coupon"].map((x,i) => <div key={x} style={{ padding: "15px", border: "1px solid #29292d", borderRadius: 14, background: "#161618", display:"flex",justifyContent:"space-between", fontSize:13, transform:`translateX(${interpolate(f,[30+i*4,48+i*4],[40,0],clamp)}px)`, opacity:interpolate(f,[30+i*4,48+i*4],[0,1],clamp) }}>{x}<span style={{color:i===0?C.lime:"#666"}}>→</span></div>)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position:"absolute", left:"50%", top:"59%", width:170, height:170, borderRadius:"50%", border:`3px solid ${C.lime}`, transform:`translate(-50%,-50%) scale(${interpolate(f,[27,42],[0.35,3.8],clamp)})`, opacity:glow, boxShadow:`0 0 50px ${C.lime}` }} />
      <div style={{ position:"absolute", left:"50%", top:"59%", width:18, height:18, borderRadius:"50%", background:C.lime, transform:`translate(-50%,-50%) scale(${tap})`, opacity:glow }} />
    </div>
  );
}

const features = [
  ["REVIEWS","★"],["LOYALTY","◎"],["WI-FI","⌁"],["SERVICE","↗"],["COUPONS","%"],
];

function FeatureExplosion() {
  const f = useCurrentFrame();
  const centerScale = spring({ frame: Math.max(0,f-8), fps:30, config:{damping:14,stiffness:160} });
  return (
    <div style={{position:"absolute",inset:0}}>
      <div style={{position:"absolute",left:"50%",top:"55%",width:150,height:150,borderRadius:"50%",background:C.lime,color:C.black,display:"grid",placeItems:"center",fontWeight:800,fontSize:22,transform:`translate(-50%,-50%) perspective(900px) translateZ(180px) rotateX(55deg) rotateZ(${interpolate(f,[0,120],[0,420],clamp)}deg) scale(${centerScale})`,transformStyle:"preserve-3d",boxShadow:`0 0 100px ${C.lime}66`}}>NFC</div>
      {features.map(([name,icon],i)=>{
        const a = -Math.PI/2 + (i-2)*0.55;
        const tx = Math.cos(a)*390;
        const ty = Math.sin(a)*390;
        const p = spring({frame:Math.max(0,f-18-i*5),fps:30,config:{damping:12,stiffness:115,mass:.6}});
        const lineP = interpolate(p,[0,1],[0,1],clamp);
        return <React.Fragment key={name}>
          <div style={{position:"absolute",left:"50%",top:"55%",width:260,padding:"19px 21px",borderRadius:20,border:"1px solid #303035",background:"#121214",display:"flex",alignItems:"center",gap:14,transform:`translate(-50%,-50%) translate3d(${tx*p}px,${ty*p}px,${interpolate(f,[0,80],[-120,180],clamp)}px) rotateY(${tx>0?12:-12}deg) scale(${.8+.2*p})`,opacity:p,boxShadow:"0 25px 60px #0009"}}>
            <div style={{width:46,height:46,borderRadius:14,background:`${C.lime}16`,border:`1px solid ${C.lime}44`,display:"grid",placeItems:"center",color:C.lime,fontSize:20}}>{icon}</div>
            <div><div style={{fontWeight:700,fontSize:16}}>{name}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>CONNECTED VIA RIVO</div></div>
          </div>
          <div style={{position:"absolute",left:"50%",top:"55%",height:2,width:390,background:`linear-gradient(90deg,${C.lime},transparent)`,transformOrigin:"left center",transform:`rotate(${Math.atan2(ty,tx)}rad) scaleX(${lineP})`,opacity:p*.35}}/>
        </React.Fragment>
      })}
    </div>
  );
}

function DashboardMotion() {
  const f=useCurrentFrame();
  const enter=spring({frame:Math.max(0,f-4),fps:30,config:{damping:16,stiffness:100}});
  const pan=interpolate(f,[0,55,120],[0,-70,-25],{...clamp,easing:ease});
  const taps=Math.round(interpolate(f,[5,55],[0,12842],clamp));
  const reviews=Math.round(interpolate(f,[8,62],[0,184],clamp));
  const customers=Math.round(interpolate(f,[10,68],[0,2391],clamp));
  const line=interpolate(f,[10,100],[0,1],clamp);
  return <div style={{position:"absolute",left:"50%",top:"58%",width:930,height:1120,transform:`translate(-50%,-50%) perspective(1500px) translate3d(0,${pan}px,${interpolate(f,[0,120],[320,-80],clamp)}px) scale(${.82+.18*enter}) rotateY(${interpolate(f,[0,120],[-12,3],clamp)}deg) rotateX(${interpolate(f,[0,70],[8,0],clamp)}deg)`,transformOrigin:"center",background:"#0c0c0e",border:"1px solid #303035",borderRadius:28,boxShadow:"0 60px 140px #000b",overflow:"hidden"}}>
    <div style={{height:74,borderBottom:"1px solid #252529",display:"flex",alignItems:"center",padding:"0 24px",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Logo size={34}/><b>Control Room</b></div><span style={{fontSize:10,color:C.muted,letterSpacing:1}}>LIVE FLEET · NAPOLI</span></div>
    <div style={{padding:28}}>
      <div style={{fontSize:30,fontWeight:750}}>Your customer experience.</div>
      <div style={{color:C.muted,marginTop:7}}>Every touchpoint, connected.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:25}}>
        {[["TOTAL TAPS",taps.toLocaleString("en-US")],["REVIEWS","+"+reviews],["CUSTOMERS",customers.toLocaleString("en-US")],["CONVERSION","+"+interpolate(f,[10,72],[0,24.8],clamp).toFixed(1)+"%"]].map(([a,b],i)=><div key={a} style={{padding:20,borderRadius:17,background:"#131316",border:"1px solid #25252a",transform:`translateY(${interpolate(f,[i*5,25+i*5],[35,0],clamp)}px)`,opacity:interpolate(f,[i*5,25+i*5],[0,1],clamp)}}><div style={{fontSize:9,letterSpacing:1.4,color:C.muted}}>{a}</div><div style={{fontSize:31,fontWeight:750,marginTop:9}}>{b}</div><div style={{fontSize:10,color:C.lime,marginTop:8}}>LIVE ↑</div></div>)}
      </div>
      <div style={{marginTop:13,padding:22,borderRadius:17,background:"#131316",border:"1px solid #25252a"}}>
        <div style={{fontSize:10,color:C.muted}}>INTERACTIONS · LAST 30 DAYS</div>
        <svg viewBox="0 0 820 220" width="100%" style={{marginTop:15}}>
          <path d="M0 190 C90 175 120 185 170 145 S255 175 310 120 S400 155 455 91 S550 125 610 75 S700 95 820 25" fill="none" stroke={C.lime} strokeWidth="5" strokeLinecap="round" strokeDasharray="1100" strokeDashoffset={1100-1100*line}/>
        </svg>
      </div>
      <div style={{marginTop:13,padding:18,borderRadius:17,background:"#151517",border:"1px solid #25252a",display:"flex",gap:14,alignItems:"center",transform:`translateY(${interpolate(f,[55,78],[40,0],clamp)}px)`,opacity:interpolate(f,[55,78],[0,1],clamp)}}><div style={{width:42,height:42,borderRadius:13,background:`${C.lime}16`,display:"grid",placeItems:"center",color:C.lime}}>↗</div><div><b style={{fontSize:13}}>New private feedback</b><div style={{fontSize:10,color:C.muted,marginTop:4}}>Review Shield · 2★ routed privately</div></div><div style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:C.lime,boxShadow:`0 0 15px ${C.lime}`}}/></div>
    </div>
  </div>;
}

function ShieldMotion() {
  const f=useCurrentFrame();
  const p=spring({frame:Math.max(0,f-3),fps:30,config:{damping:17,stiffness:100}});
  const progress=interpolate(f,[18,52],[0,1],clamp);
  const route=interpolate(f,[48,70],[0,1],clamp);
  return <div style={{position:"absolute",left:"50%",top:"57%",transform:"translate(-50%,-50%)",display:"flex",alignItems:"center",gap:25,scale:.95+p*.05}}>
    <div style={{width:320,padding:30,borderRadius:25,background:"#131316",border:"1px solid #2c2c31",boxShadow:"0 30px 70px #0008",transform:`translateX(${interpolate(f,[0,30],[90,0],clamp)}px)`,opacity:p}}>
      <div style={{fontSize:10,color:C.muted}}>CUSTOMER FEEDBACK</div><div style={{fontSize:21,fontWeight:750,marginTop:16}}>How was your experience?</div>
      <div style={{display:"flex",gap:8,marginTop:23}}>{[1,2,3,4,5].map(n=><div key={n} style={{width:40,height:40,borderRadius:12,background:n<=2?"#252528":`${C.lime}1c`,color:n<=2?"#777":C.lime,display:"grid",placeItems:"center"}}>★</div>)}</div>
      <div style={{marginTop:20,height:3,background:"#252528",overflow:"hidden"}}><div style={{height:"100%",width:`${progress*100}%`,background:C.lime}}/></div>
    </div>
    <div style={{fontSize:40,color:C.lime,opacity:route,transform:`translateX(${interpolate(f,[45,65],[-30,0],clamp)}px)`}}>→</div>
    <div style={{width:320,padding:30,borderRadius:25,background:"#131316",border:"1px solid #2c2c31",boxShadow:"0 30px 70px #0008",transform:`translateX(${interpolate(f,[40,68],[100,0],clamp)}px) scale(${.92+.08*route})`,opacity:route}}>
      <div style={{fontSize:10,color:C.muted}}>RIVO ROUTING</div><div style={{fontSize:21,fontWeight:750,marginTop:16}}>Private feedback</div><div style={{fontSize:13,color:C.muted,lineHeight:1.5,marginTop:10}}>The guest can tell the business what went wrong.</div>
      <div style={{marginTop:20,padding:12,borderRadius:12,background:`${C.lime}12`,color:C.lime,fontSize:11}}>NEW · 2★ ROUTED PRIVATELY</div>
    </div>
  </div>;
}

function Orbit() {
  const f=useCurrentFrame();
  const labels=["REVIEWS","LOYALTY","WI-FI","SERVICE","COUPONS","ANALYTICS","CRM","SMART ROUTING"];
  const rot=interpolate(f,[0,150],[0,Math.PI*2],clamp);
  return <div style={{position:"absolute",left:"50%",top:"58%",width:900,height:850,transform:"translate(-50%,-50%)"}}>
    <div style={{position:"absolute",left:"50%",top:"50%",width:235,height:235,borderRadius:70,background:"#141416",border:`1px solid ${C.lime}66`,boxShadow:`0 0 100px ${C.lime}18`,display:"grid",placeItems:"center",transform:`translate(-50%,-50%) perspective(1200px) rotateX(66deg) rotateZ(${-rot}rad) translateZ(120px)`}}><Logo size={125}/></div>
    {labels.map((label,i)=>{
      const a=i/labels.length*Math.PI*2-Math.PI/2+rot;
      const x=Math.cos(a)*330,y=Math.sin(a)*330;
      const p=spring({frame:Math.max(0,f-8-i*3),fps:30,config:{damping:15,stiffness:100}});
      return <React.Fragment key={label}><div style={{position:"absolute",left:"50%",top:"50%",width:170,padding:"15px",textAlign:"center",borderRadius:15,border:"1px solid #2b2b30",background:"#101012",fontSize:10,letterSpacing:1.1,transform:`translate(-50%,-50%) perspective(1200px) translate3d(${x*p}px,${y*p}px,${Math.sin(a)*220}px) rotateY(${a*8}deg)`,opacity:p}}>{label}</div><div style={{position:"absolute",left:"50%",top:"50%",height:1,width:330,background:C.lime,transformOrigin:"left",transform:`rotate(${a}rad) scaleX(${p})`,opacity:.2*p}}/></React.Fragment>;
    })}
  </div>;
}

function FinalReveal() {
  const f=useCurrentFrame();
  const p=spring({frame:Math.max(0,f-8),fps:30,config:{damping:18,stiffness:100}});
  const wave=interpolate(f,[0,75],[0,900],clamp);
  return <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center"}}>
    <div style={{position:"absolute",left:"50%",top:"42%",width:wave,height:wave,borderRadius:"50%",border:`1px solid ${C.lime}`,transform:"translate(-50%,-50%)",opacity:interpolate(f,[0,40],[.7,0],clamp),boxShadow:`0 0 50px ${C.lime}33`}}/>
    <div style={{textAlign:"center",opacity:p,transform:`translateY(${interpolate(p,[0,1],[60,0])}px) scale(${.9+.1*p})`}}>
      <Logo size={210}/>
      <div style={{marginTop:32,fontSize:27,letterSpacing:4,color:C.lime,fontWeight:700}}>ONE TAP. EVERYTHING CONNECTED.</div>
      <div style={{marginTop:25,fontSize:19,color:C.muted}}>Connected experiences for physical businesses.</div>
      <div style={{marginTop:45,display:"inline-block",padding:"17px 30px",borderRadius:999,background:C.lime,color:C.black,fontSize:14,fontWeight:800}}>DISCOVER RIVO</div>
    </div>
  </div>;
}

export const RivoAd: React.FC = () => {
  const f=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const s=Math.min(width/1080,height/1920);
  const ox=(width-1080*s)/2,oy=(height-1920*s)/2;
  const scene=(from:number,to:number,node:React.ReactNode,zoom=[1,1])=>{
    const local=f-from;
    const opacity=interpolate(local,[0,10,to-from-10,to-from],[0,1,1,0],clamp);
    const z=interpolate(local,[0,to-from],[zoom[0],zoom[1]],{...clamp,easing:ease});
    const y=interpolate(local,[0,to-from],[35,-35],{...clamp,easing:ease});
    return <div style={{position:"absolute",left:ox,top:oy,width:1080,height:1920,transform:`scale(${s*z}) translateY(${y}px)`,transformOrigin:"top center",opacity}}>{node}</div>;
  };
  return <AbsoluteFill style={{fontFamily:'Inter,"SF Pro Display","Helvetica Neue",Arial,sans-serif',color:C.white,background:C.bg,overflow:"hidden"}}>
    {bg(f)}
    {scene(0,82,<><Title text="Every table is an opportunity." sub="The physical world is still waiting to be connected." from={4}/><div style={{position:"absolute",left:"50%",top:"59%",width:620,height:390,borderRadius:44,border:"1px solid #29292e",background:"#0d0d0f",transform:`translate(-50%,-50%) perspective(900px) rotateX(${interpolate(f,[0,82],[16,0],clamp)}deg)`}}><div style={{position:"absolute",left:"50%",top:"50%",width:190,height:110,borderRadius:22,border:"1px solid #38383d",transform:"translate(-50%,-50%)"}}/></div></>,[.94,1.04])}
    {scene(70,185,<><Title text="One tap." sub="Watch what happens after the touch." from={4}/><TapDevice/><Sfx src={TAP_SFX} from={28} volume={.8}/><Sfx src={WHOOSH_SFX} from={0} volume={.25}/></>,[.9,1.08])}
    {scene(170,310,<><Title text="One signal. Five actions." sub="RIVO turns one physical touch into a connected journey." from={3}/><FeatureExplosion/><Sfx src={WHOOSH_SFX} from={18} volume={.45}/></>,[.92,1.03])}
    {scene(295,470,<><Title text="Everything after the tap." sub="One control room. Live." from={4}/><DashboardMotion/><Sfx src={WHOOSH_SFX} from={4} volume={.25}/><Sfx src={IMPACT_SFX} from={48} volume={.35}/></>,[1.04,.92])}
    {scene(455,570,<><Title text="Bad experience?" sub="Don't send it straight to Google." from={3}/><ShieldMotion/><Sfx src={WHOOSH_SFX} from={42} volume={.35}/></>,[.94,1.04])}
    {scene(555,735,<><Title text="One platform." sub="Every touchpoint becomes part of the same system." from={3}/><Orbit/><Sfx src={WHOOSH_SFX} from={12} volume={.3}/></>,[.92,1.02])}
    {scene(720,900,<><FinalReveal/><Sfx src={IMPACT_SFX} from={10} volume={.5}/></>,[1.08,1])}
  </AbsoluteFill>;
};
