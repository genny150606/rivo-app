import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,\n  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const VIDEO = { width: 1080, height: 1920, fps: 30, duration: 900 };
const LIME = "#B4F02A";
const BG = "#070708";
const PANEL = "#101012";
const MUTED = "#8E8E96";
const WHITE = "#F7F7F8";
const LOGO = staticFile("brand/rivo-logo-full.png");

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

function Fade({ start, end, children, y = 0, scale = 1 }: { start: number; end: number; children: React.ReactNode; y?: number; scale?: number }) {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [start, start + 12, end - 12, end], [0, 1, 1, 0], clamp);
  const translate = interpolate(f, [start, end], [y, -y], clamp);
  const s = interpolate(f, [start, start + 14, end], [scale * 0.97, scale, scale * 1.01], clamp);
  return <div style={{ position: "absolute", inset: 0, opacity, transform: `translateY(${translate}px) scale(${s})` }}>{children}</div>;
}

function RivoMark({ size = 92 }: { size?: number }) {
  return <Img src={LOGO} style={{ width: size, height: "auto", objectFit: "contain" }} />;
}

function Background() {
  return (
    <AbsoluteFill style={{ background: BG, color: WHITE, fontFamily: 'Inter, "SF Pro Display", "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 42%, rgba(180,240,42,.08), transparent 34%), radial-gradient(circle at 20% 90%, rgba(180,240,42,.035), transparent 28%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.055, backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
    </AbsoluteFill>
  );
}

function Device({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) translate(${x}px,${y}px) scale(${s})`, width: 340, height: 245, borderRadius: 28, background: "linear-gradient(145deg,#fafafa,#bdbdc1)", boxShadow: "0 35px 80px rgba(0,0,0,.5), inset 0 1px 0 #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 128, height: 128, borderRadius: 32, border: "2px solid #242426", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ width: 78, height: 78, borderRadius: 22, border: "3px solid #242426", opacity: .9 }} />
        <div style={{ position: "absolute", width: 22, height: 22, borderRadius: "50%", background: LIME, boxShadow: `0 0 28px ${LIME}` }} />
      </div>
    </div>
  );
}

function Phone({ x = 0, y = 0, s = 1, tilt = 0 }: { x?: number; y?: number; s?: number; tilt?: number }) {
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 285, height: 575, borderRadius: 42, background: "#0e0e10", border: "2px solid #303035", boxShadow: "0 40px 100px rgba(0,0,0,.65)", transform: `translate(-50%,-50%) translate(${x}px,${y}px) scale(${s}) rotate(${tilt}deg)`, padding: 9 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 34, background: "linear-gradient(160deg,#171719,#0a0a0b)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 13, left: "50%", transform: "translateX(-50%)", width: 82, height: 22, borderRadius: 20, background: "#050506" }} />
        <div style={{ padding: "62px 24px 24px" }}>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 8 }}>CONNECTED EXPERIENCE</div>
          <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: -1.5 }}>Welcome to<br /><span style={{ color: LIME }}>RIVO.</span></div>
          <div style={{ marginTop: 32, display: "grid", gap: 10 }}>
            {["Google Review", "Chiama Sala", "Loyalty", "Coupon"].map((t, i) => (
              <div key={t} style={{ padding: "14px 15px", borderRadius: 15, background: "#171719", border: "1px solid #29292d", fontSize: 14, display: "flex", justifyContent: "space-between" }}>
                <span>{t}</span><span style={{ color: i === 0 ? LIME : "#77777f" }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NfcPulse() {
  const f = useCurrentFrame();
  return (
    <>
      {[0, 1, 2].map(i => {
        const p = interpolate(f, [0 + i * 5, 34 + i * 5], [0.2, 2.6], clamp);
        const o = interpolate(f, [0 + i * 5, 34 + i * 5], [.75, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 120, height: 120, borderRadius: "50%", border: `2px solid ${LIME}`, opacity: o, transform: `translate(-50%,-50%) scale(${p})`, boxShadow: `0 0 30px ${LIME}55` }} />;
      })}
    </>
  );
}

function FeatureCard({ label, icon, x, y, delay }: { label: string; icon: string; x: number; y: number; delay: number }) {
  const f = useCurrentFrame();
  const p = spring({ frame: Math.max(0, f - delay), fps: VIDEO.fps, config: { damping: 14, stiffness: 110, mass: .7 } });
  return <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) translate(${x * p}px,${y * p}px)`, opacity: p, width: 255, padding: "22px 24px", borderRadius: 22, background: "rgba(18,18,20,.92)", border: "1px solid #2b2b30", boxShadow: "0 20px 60px rgba(0,0,0,.35)", display: "flex", alignItems: "center", gap: 15 }}>
    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${LIME}18`, border: `1px solid ${LIME}40`, display: "grid", placeItems: "center", color: LIME, fontSize: 20 }}>{icon}</div>
    <div><div style={{ fontSize: 16, fontWeight: 650 }}>{label}</div><div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Connected via RIVO</div></div>
  </div>;
}

function Dashboard() {
  const f = useCurrentFrame();
  const p = spring({ frame: Math.max(0, f - 0), fps: VIDEO.fps, config: { damping: 18, stiffness: 85 } });
  const count = Math.round(interpolate(f, [0, 42], [0, 12842], clamp));
  const reviews = Math.round(interpolate(f, [0, 48], [0, 184], clamp));
  const customers = Math.round(interpolate(f, [0, 52], [0, 2391], clamp));
  const conversion = interpolate(f, [0, 56], [0, 24.8], clamp).toFixed(1);
  return (
    <div style={{ width: 900, height: 1220, borderRadius: 28, background: "#0d0d0f", border: "1px solid #2a2a2e", boxShadow: "0 45px 100px rgba(0,0,0,.55)", overflow: "hidden", transform: `scale(${p})` }}>
      <div style={{ height: 76, borderBottom: "1px solid #252529", display: "flex", alignItems: "center", padding: "0 26px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><RivoMark size={38}/><span style={{ fontWeight: 700, letterSpacing: -.5 }}>Control Room</span></div>
        <div style={{ fontSize: 12, color: "#777780" }}>LIVE FLEET · NAPOLI</div>
      </div>
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: -1.2 }}>Your customer experience.</div>
        <div style={{ color: MUTED, marginTop: 7, fontSize: 14 }}>Every touchpoint, connected.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 30 }}>
          {[
            ["TOTAL TAPS", count.toLocaleString("en-US"), "+18.4%"],
            ["REVIEWS", "+" + reviews, "+32.1%"],
            ["CUSTOMERS", customers.toLocaleString("en-US"), "+11.8%"],
            ["CONVERSION", "+" + conversion + "%", "+6.4%"],
          ].map(([a,b,c]) => <div key={a} style={{ padding: 21, borderRadius: 18, background: "#131316", border: "1px solid #242429" }}><div style={{ fontSize: 10, letterSpacing: 1.2, color: "#777780" }}>{a}</div><div style={{ fontSize: 31, fontWeight: 700, marginTop: 9, letterSpacing: -1 }}>{b}</div><div style={{ fontSize: 11, color: LIME, marginTop: 9 }}>{c} <span style={{ color: "#64646b" }}>vs last period</span></div></div>)}
        </div>
        <div style={{ marginTop: 14, padding: 22, borderRadius: 18, background: "#131316", border: "1px solid #242429" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a7a83" }}><span>INTERACTIONS</span><span>LAST 30 DAYS</span></div>
          <svg viewBox="0 0 820 240" width="100%" style={{ marginTop: 18 }}>
            <path d="M0 196 C90 176 110 184 165 151 S245 173 300 124 S385 151 440 92 S525 130 580 80 S660 99 720 48 S785 68 820 28" fill="none" stroke={LIME} strokeWidth="5" strokeLinecap="round"/>
            <path d="M0 196 C90 176 110 184 165 151 S245 173 300 124 S385 151 440 92 S525 130 580 80 S660 99 720 48 S785 68 820 28 V240 H0 Z" fill="url(#fill)" opacity=".08"/>
            <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor={LIME}/><stop offset="1" stopColor={LIME} stopOpacity="0"/></linearGradient></defs>
          </svg>
        </div>
        <div style={{ marginTop: 14, padding: 18, borderRadius: 18, background: "#151517", border: "1px solid #242429", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `${LIME}16`, display: "grid", placeItems: "center", color: LIME, fontSize: 19 }}>↗</div>
          <div><div style={{ fontSize: 13, fontWeight: 650 }}>New private feedback</div><div style={{ color: "#777780", fontSize: 11, marginTop: 4 }}>Review Shield · 2★ routed privately</div></div>
          <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 12px ${LIME}` }} />
        </div>
      </div>
    </div>
  );
}

function ReviewShield() {
  const f = useCurrentFrame();
  const p = spring({ frame: Math.max(0, f - 4), fps: VIDEO.fps, config: { damping: 15, stiffness: 100 } });
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", transform: `scale(${p})` }}>
      <div style={{ width: 310, padding: 28, borderRadius: 24, background: "#131316", border: "1px solid #2a2a2f" }}>
        <div style={{ fontSize: 11, color: MUTED }}>CUSTOMER FEEDBACK</div><div style={{ fontSize: 20, fontWeight: 700, marginTop: 15 }}>How was your experience?</div>
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>{[1,2,3,4,5].map(n => <div key={n} style={{ width: 37, height: 37, borderRadius: 11, background: n <= 2 ? "#242427" : `${LIME}1c`, display: "grid", placeItems: "center", color: n <= 2 ? "#777780" : LIME, fontSize: 16 }}>★</div>)}</div>
      </div>
      <div style={{ fontSize: 36, color: "#44444a" }}>→</div>
      <div style={{ width: 310, padding: 28, borderRadius: 24, background: "#131316", border: "1px solid #2a2a2f" }}>
        <div style={{ fontSize: 11, color: MUTED }}>RIVO ROUTING</div><div style={{ fontSize: 20, fontWeight: 700, marginTop: 15 }}>Private feedback</div><div style={{ color: MUTED, fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>The guest can share what went wrong directly with the business.</div>
        <div style={{ marginTop: 20, padding: "10px 12px", borderRadius: 12, background: `${LIME}12`, color: LIME, fontSize: 11 }}>New private feedback · 2★</div>
      </div>
    </div>
  );
}

function Ecosystem() {
  const f = useCurrentFrame();
  const labels = ["REVIEWS","LOYALTY","WI-FI","SERVICE","COUPONS","ANALYTICS","CRM","SMART ROUTING"];
  return <div style={{ position: "relative", width: 880, height: 760 }}>
    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 230, height: 230, borderRadius: 72, background: "#151517", border: `1px solid ${LIME}55`, boxShadow: `0 0 80px ${LIME}15`, display: "grid", placeItems: "center" }}><RivoMark size={120}/></div>
    {labels.map((label,i) => {
      const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 305;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius;
      const p = spring({ frame: Math.max(0, f - i * 3), fps: VIDEO.fps, config: { damping: 16, stiffness: 90 } });
      return <React.Fragment key={label}><div style={{ position: "absolute", left: "50%", top: "50%", width: 170, padding: "14px 16px", borderRadius: 15, background: "#111113", border: "1px solid #2a2a2e", textAlign: "center", fontSize: 11, letterSpacing: 1, color: "#d7d7db", transform: `translate(-50%,-50%) translate(${x*p}px,${y*p}px)`, opacity: p }}>{label}</div><svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: p*.45 }}><line x1="50%" y1="50%" x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`} stroke={LIME} strokeWidth="1"/></svg></React.Fragment>
    })}
  </div>;
}

function SceneText({ title, subtitle }: { title: string; subtitle?: string }) {
  return <div style={{ position: "absolute", top: 135, left: 0, right: 0, textAlign: "center", padding: "0 70px" }}><div style={{ fontSize: 67, fontWeight: 720, letterSpacing: -3.5, lineHeight: 1.02 }}>{title}</div>{subtitle && <div style={{ marginTop: 22, fontSize: 21, color: MUTED, letterSpacing: -.3 }}>{subtitle}</div>}</div>;
}

export const RivoAd: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scale = Math.min(width / 1080, height / 1920);
  const offsetX = (width - 1080 * scale) / 2;
  const offsetY = (height - 1920 * scale) / 2;

  const scene = (from: number, to: number, node: React.ReactNode) => {
    const op = interpolate(f, [from, from + 12, to - 12, to], [0, 1, 1, 0], clamp);
    return <div style={{ position: "absolute", left: offsetX, top: offsetY, width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: "top left", opacity: op }}>{node}</div>;
  };

  return <AbsoluteFill><Background />
    {scene(0, 90, <><SceneText title="Every table is an opportunity." subtitle="Physical spaces are full of untapped digital potential."/><div style={{ position:"absolute", left:"50%", top:"57%", transform:"translate(-50%,-50%)", width:600, height:330, borderRadius:40, border:"1px solid #252529", background:"#0c0c0e", boxShadow:"0 30px 80px rgba(0,0,0,.35)" }}><div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:150, height:90, borderRadius:18, border:"1px solid #333338" }}/></div></>)}
    {scene(78, 180, <><SceneText title="One tap." subtitle="A single physical touch opens a connected experience."/><Device/><Phone x={150} y={20} s={.72} tilt={-8}/><NfcPulse/></>)}
    {scene(165, 300, <><SceneText title="Endless possibilities." subtitle="One signal becomes every next step."/><div style={{ position:"absolute", left:"50%", top:"54%", transform:"translate(-50%,-50%)" }}><div style={{ width:100, height:100, borderRadius:"50%", background:LIME, boxShadow:`0 0 80px ${LIME}55`, display:"grid", placeItems:"center", color:"#080808", fontSize:28 }}>NFC</div></div><FeatureCard label="Google Review" icon="★" x={-315} y={-205} delay={8}/><FeatureCard label="Chiama Sala" icon="↗" x={315} y={-205} delay={14}/><FeatureCard label="Loyalty" icon="◎" x={-315} y={190} delay={20}/><FeatureCard label="Coupon" icon="%" x={315} y={190} delay={26}/><FeatureCard label="Wi-Fi" icon="⌁" x={0} y={350} delay={32}/></>)}
    {scene(285, 470, <><SceneText title="Your entire experience." subtitle="One control room for what happens after the tap."/><div style={{ position:"absolute", left:"50%", top:"56%", transform:"translate(-50%,-50%)" }}><Dashboard/></div></>)}
    {scene(455, 570, <><SceneText title="Protect the experience." subtitle="Review Shield routes unhappy guests privately — and keeps the conversation open."/><div style={{ position:"absolute", left:"50%", top:"57%", transform:"translate(-50%,-50%)" }}><ReviewShield/></div></>)}
    {scene(555, 720, <><SceneText title="One platform." subtitle="Your entire customer experience, connected."/><div style={{ position:"absolute", left:"50%", top:"57%", transform:"translate(-50%,-50%)" }}><Ecosystem/></div></>)}
    {scene(705, 810, <><div style={{ position:"absolute", left:"50%", top:"46%", transform:"translate(-50%,-50%)", textAlign:"center" }}><RivoMark size={260}/><div style={{ marginTop:30, fontSize:26, letterSpacing:4, color:LIME, fontWeight:650 }}>ONE TAP. EVERYTHING CONNECTED.</div></div><div style={{ position:"absolute", left:"50%", top:"75%", width:680, height:1, background:`linear-gradient(90deg, transparent, ${LIME}, transparent)`, boxShadow:`0 0 30px ${LIME}` }}/></>)}
    {scene(795, 900, <><div style={{ position:"absolute", left:"50%", top:"42%", transform:"translate(-50%,-50%)", textAlign:"center", width:900 }}><RivoMark size={190}/><div style={{ marginTop:38, fontSize:31, color:WHITE, letterSpacing:-.8 }}>Connected experiences for physical businesses.</div><div style={{ marginTop:46, display:"inline-flex", padding:"17px 30px", borderRadius:999, background:LIME, color:"#080808", fontSize:15, fontWeight:750, letterSpacing:.2 }}>Discover RIVO</div></div><div style={{ position:"absolute", left:60, right:60, bottom:75, display:"flex", justifyContent:"space-between", fontSize:11, color:"#5e5e66", letterSpacing:1.4 }}><span>RIVO</span><span>ONE TAP. EVERYTHING CONNECTED.</span><span>2026</span></div></>)}
  </AbsoluteFill>;
};
