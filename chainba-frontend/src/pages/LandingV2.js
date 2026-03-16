import { useEffect, useRef, useState } from "react";
import "./LandingV2.css";

// ─── Tokens ────────────────────────────────────────────────────────────────
const C = {
  navy:    "#0A0E1A",
  navyMid: "#1E293B",
  white:   "#FFFFFF",
  ice:     "#F8FAFC",
  emerald: "#10B981",
  emeraldD:"#059669",
  indigo:  "#6366F1",
  indigoL: "#EEF2FF",
  red:     "#EF4444",
  text:    "#0F172A",
  textMid: "#334155",
  textMuted:"#64748B",
  textDim: "#94A3B8",
  border:  "#E2E8F0",
  borderMid:"#CBD5E1",
};

// Kente palette — cultural DNA, animation only
const KC = [
  "#F59E0B","#10B981","#EF4444","#FCD34D","#6366F1","#F97316",
  "#F59E0B","#10B981","#EF4444","#FCD34D","#6366F1","#F97316",
  "#F59E0B","#10B981","#EF4444","#FCD34D","#6366F1","#F97316",
  "#F59E0B","#10B981","#EF4444","#FCD34D",
];

// ─── Logo SVG — placeholder until Frank shares his idea ────────────────────
// Temporary: chain-link circle. Will be replaced.
const LogoMark = ({ size = 28, onDark = true }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="11" stroke={onDark ? "#FFFFFF" : C.text} strokeWidth="2" opacity=".3"/>
    <circle cx="14" cy="14" r="6" stroke={C.emerald} strokeWidth="2.5"/>
    <circle cx="14" cy="14" r="2" fill={C.emerald}/>
    <line x1="14" y1="3" x2="14" y2="8" stroke={C.emerald} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="20" x2="14" y2="25" stroke={C.emerald} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="14" x2="8" y2="14" stroke={C.indigo} strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="14" x2="25" y2="14" stroke={C.indigo} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─── useReveal ─────────────────────────────────────────────────────────────
function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("set");
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight - 60) {
        setTimeout(() => el.classList.add("in"), delay);
        return;
      }
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setTimeout(() => el.classList.add("in"), delay); obs.disconnect(); } },
        { threshold: 0.08 }
      );
      obs.observe(el);
    }, 50);
    return () => clearTimeout(t);
  }, [delay]);
  return ref;
}

// ─── KenteStrip ────────────────────────────────────────────────────────────
function KenteStrip({ h = 4, opacity = 1, reverse = false }) {
  return (
    <div style={{ overflow:"hidden", height:h, width:"100%", flexShrink:0 }}>
      <div className={`cb2-kt${reverse ? " rev" : ""}`} style={{ height:h }}>
        {[...KC,...KC].map((c,i) => <div key={i} style={{ flex:1, background:c, opacity }} />)}
      </div>
    </div>
  );
}

// ─── Eyebrow pill ──────────────────────────────────────────────────────────
function Pill({ children, color = C.emerald, onDark = false }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:"7px",
      background: onDark ? "rgba(16,185,129,.15)" : "#ECFDF5",
      border:`1px solid ${color}33`,
      padding:"5px 14px", borderRadius:"100px", marginBottom:"1.25rem",
    }}>
      <div style={{ width:6, height:6, background:color, borderRadius:"50%", flexShrink:0 }} />
      <span style={{ fontSize:"11px", color, fontWeight:"500", letterSpacing:"1.2px", textTransform:"uppercase" }}>
        {children}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NAVBAR
// ══════════════════════════════════════════════════════════════════════════
function Navbar({ onLogin, onRegister, onConnect }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      height:68, padding:"0 3rem",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      background: scrolled ? "rgba(10,14,26,.97)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,.07)" : "none",
      transition:"background .3s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }}>
        <LogoMark size={28} onDark />
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#fff", marginLeft:4, letterSpacing:"-.5px", fontWeight:700 }}>
          ChainBa
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"2.5rem" }}>
        {["How it works","Circles","Trust scores","About"].map(l => (
          <span key={l} className="nl">{l}</span>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <span className="nl" onClick={onLogin}>Sign in</span>
        <button className="btn-g" style={{ padding:"9px 18px", fontSize:14 }} onClick={onConnect}>Connect wallet</button>
        <button className="btn-p" style={{ padding:"9px 18px", fontSize:14 }} onClick={onRegister}>Get started</button>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// HERO — Stripe mesh gradient, split layout
// ══════════════════════════════════════════════════════════════════════════
function Hero({ onRegister, onConnect }) {
  const r0 = useReveal(0);
  const r1 = useReveal(100);
  const r2 = useReveal(220);
  const r3 = useReveal(340);
  const r4 = useReveal(460);

  return (
    <section style={{
      minHeight:"100vh", display:"flex", alignItems:"center",
      padding:"0 3rem", paddingTop:68,
      background:"linear-gradient(160deg, #020817 0%, #0A0E1A 45%, #0D1B2A 100%)",
      position:"relative", overflow:"hidden",
    }}>
      {/* Mesh gradient */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 75% 55% at 65% 35%, rgba(16,185,129,.1) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 20% 75%, rgba(99,102,241,.09) 0%, transparent 55%), radial-gradient(ellipse 35% 40% at 88% 80%, rgba(239,68,68,.06) 0%, transparent 50%)",
        backgroundSize:"200% 200%",
        animation:"mesh 14s ease infinite",
      }} />
      {/* Subtle grid */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)", backgroundSize:"72px 72px" }} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4rem", alignItems:"center", maxWidth:1080, margin:"0 auto", width:"100%", position:"relative" }}>

        {/* Left */}
        <div>
          <div ref={r0} className="cb2-r"><Pill onDark>Decentralized savings · Zambia</Pill></div>

          <h1 ref={r1} className="cb2-hl cb2-r" style={{ fontSize:"clamp(40px,5vw,64px)", color:"#fff", marginBottom:"1.5rem" }}>
            Financial infrastructure<br />for your{" "}
            <em style={{ color:C.emerald, fontStyle:"italic" }}>community.</em>
          </h1>

          <p ref={r2} className="cb2-r" style={{ fontSize:17, color:"rgba(255,255,255,.6)", lineHeight:1.75, marginBottom:"2rem", fontWeight:300, maxWidth:460 }}>
            ChainBa puts your Chilimba savings circle on the blockchain.
            Automatic payouts. Transparent contributions.
            No middleman, no missed payments, no broken trust.
          </p>

          <div ref={r3} className="cb2-r" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:"1.5rem" }}>
            <button className="btn-p" onClick={onRegister}>Start your circle →</button>
            <button className="btn-g" onClick={onConnect}>Connect wallet</button>
          </div>

          <div ref={r4} className="cb2-r" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:18, height:18, borderRadius:"50%", background:"rgba(16,185,129,.2)", border:"1px solid rgba(16,185,129,.4)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:9, color:C.emerald }}>✓</span>
            </div>
            <span style={{ fontSize:13, color:"rgba(255,255,255,.35)" }}>
              No wallet needed — we create one for you when you register
            </span>
          </div>
        </div>

        {/* Right — mockup */}
        <HeroCard />
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0 }}>
        <KenteStrip h={5} />
      </div>
    </section>
  );
}

// ─── Hero dashboard card ───────────────────────────────────────────────────
function HeroCard() {
  const ref = useReveal(320);
  return (
    <div ref={ref} className="cb2-r d3" style={{ display:"flex", justifyContent:"center" }}>
      <div style={{
        width:"100%", maxWidth:360,
        background:"rgba(255,255,255,.06)", backdropFilter:"blur(28px)",
        borderRadius:24, border:"1px solid rgba(255,255,255,.1)",
        boxShadow:"0 40px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.08)",
        padding:"1.5rem",
        animation:"floatY 4.5s ease-in-out infinite",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginBottom:3 }}>Welcome back</div>
            <div style={{ fontSize:15, fontWeight:500, color:"#fff" }}>Frank Bwalya</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>Trust score</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, color:C.emerald }}>95</div>
          </div>
        </div>

        <KenteStrip h={3} opacity={0.5} />

        {/* Circle */}
        <div style={{ margin:"1rem 0", background:"rgba(255,255,255,.06)", borderRadius:16, padding:"1rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#fff" }}>Lusaka Savers</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginTop:2 }}>8 members · Round 3 of 8</div>
            </div>
            <span style={{ fontSize:10, background:"rgba(16,185,129,.2)", color:C.emerald, padding:"2px 10px", borderRadius:20, fontWeight:500 }}>Active</span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,.1)", borderRadius:4, overflow:"hidden", marginBottom:6 }}>
            <div style={{ width:"37%", height:"100%", background:C.emerald, borderRadius:4 }} />
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>Round progress: 37%</div>
        </div>

        {/* Payout */}
        <div style={{ background:"linear-gradient(135deg, #064E3B, #065F46)", borderRadius:16, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.55)", marginBottom:4 }}>Your next payout</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, fontWeight:700, color:"#fff", marginBottom:3 }}>3.20 ETH</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.45)" }}>Round 5 · Auto-release in ~18 days</div>
        </div>

        {/* Members */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex" }}>
            {["FB","MC","TM","BK","NK"].map((n,i) => (
              <div key={i} style={{ width:24, height:24, borderRadius:"50%", background:`hsl(${150+i*40},45%,40%)`, border:"2px solid rgba(255,255,255,.08)", marginLeft:i===0?0:-6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:600, color:"#fff" }}>{n}</div>
            ))}
          </div>
          <span style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>5 of 8 contributed</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STATS — dark band, Stripe "backbone of commerce" style
// ══════════════════════════════════════════════════════════════════════════
function Stats() {
  const ref = useReveal(0);
  const stats = [
    { val:"100%",  label:"On-chain enforcement",   sub:"Every rule in smart contracts" },
    { val:"23",    label:"Tests passing",           sub:"Audited Hardhat test suite" },
    { val:"0",     label:"Missed payouts",          sub:"When all members contribute" },
    { val:"3",     label:"Smart contracts",         sub:"Factory · Group · Reputation" },
  ];
  return (
    <section style={{ background:"linear-gradient(135deg, #020817, #0A0E1A)", padding:"4rem 3rem" }}>
      <div ref={ref} className="cb2-r cb2-inner">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {stats.map((s,i) => (
            <div key={i} className="stat-cell">
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:38, fontWeight:700, color:C.emerald, marginBottom:6 }}>{s.val}</div>
              <div style={{ fontSize:14, fontWeight:500, color:"#fff", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// HOW IT WORKS — 3 columns, each a separate component (hooks rule)
// ══════════════════════════════════════════════════════════════════════════
function Step({ num, color, icon, title, desc, tag, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="cb2-r">
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1.25rem" }}>
        <div style={{ width:46, height:46, borderRadius:14, background:`${color}15`, border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:19, color }}>{icon}</span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color, fontWeight:600, letterSpacing:"1px" }}>{num}</span>
      </div>
      <h3 style={{ fontSize:18, fontWeight:500, color:C.text, marginBottom:10, lineHeight:1.3 }}>{title}</h3>
      <p style={{ fontSize:14, color:C.textMid, lineHeight:1.75, marginBottom:12, fontWeight:300 }}>{desc}</p>
      <code style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color, background:`${color}10`, padding:"3px 10px", borderRadius:6, display:"inline-block" }}>{tag}</code>
    </div>
  );
}

function HowItWorks() {
  const h = useReveal(0);
  return (
    <section className="cb2-s-alt">
      <div className="cb2-inner">
        <div ref={h} className="cb2-r" style={{ textAlign:"center", marginBottom:"3.5rem" }}>
          <Pill color={C.indigo}>The process</Pill>
          <h2 className="cb2-hl" style={{ fontSize:"clamp(30px,4vw,48px)", color:C.text }}>
            Three steps.<br />Zero trust required.
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"3rem" }}>
          <Step num="01" color={C.emerald} icon="◈" delay={0}   title="Register with your phone & NRC"      desc="No crypto experience needed. Enter your name, NRC, and phone. We create a secure Ethereum wallet for you automatically — no MetaMask required." tag="Auto wallet creation" />
          <Step num="02" color={C.indigo}  icon="◉" delay={120} title="Join or start a Chilimba circle"     desc="Set the group size, contribution amount, and cycle. The smart contract enforces every rule. No admin can change terms after the circle launches." tag="ChilimbaFactory.createGroup()" />
          <Step num="03" color={C.emerald} icon="◇" delay={240} title="Contribute and collect automatically" desc="When your turn comes, the contract transfers funds directly. No waiting. No chasing. The code executes exactly what was agreed, every time." tag="_releasePayout() auto" />
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FEATURES — bento grid, each card is its own component
// ══════════════════════════════════════════════════════════════════════════
function FeatCard({ wide, color, icon, title, desc, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className={`cb2-r feat-card${wide ? " wide" : ""}`}
      style={{ gridColumn: wide ? "span 2" : "span 1" }}>
      <div style={{ width:42, height:42, borderRadius:12, background:`${color}12`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
        <span style={{ fontSize:18, color }}>{icon}</span>
      </div>
      <h3 style={{ fontSize:16, fontWeight:500, color:C.text, marginBottom:8 }}>{title}</h3>
      <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, fontWeight:300 }}>{desc}</p>
    </div>
  );
}

function Features() {
  const h = useReveal(0);
  return (
    <section className="cb2-s">
      <div className="cb2-inner">
        <div ref={h} className="cb2-r" style={{ marginBottom:"3rem" }}>
          <Pill>What makes ChainBa different</Pill>
          <h2 className="cb2-hl" style={{ fontSize:"clamp(28px,3.5vw,44px)", color:C.text, maxWidth:500 }}>
            Built on trust you<br />can actually verify.
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.25rem" }}>
          <FeatCard wide  color={C.emerald} icon="◈" delay={0}   title="On-chain reputation that follows you"   desc="Every payment updates your permanent trust score via MemberReputation.sol. Good actors build verifiable track records visible to every future circle they join." />
          <FeatCard       color={C.indigo}  icon="◉" delay={80}  title="Automatic payouts"                      desc="Contract releases the pool the moment all members contribute. No admin, no delay, no human risk." />
          <FeatCard       color={C.emerald} icon="◇" delay={160} title="Hybrid identity"                        desc="NRC and phone hashed via keccak256 on-chain. Verifiable without exposing personal data." />
          <FeatCard       color={C.indigo}  icon="⬡" delay={0}   title="Emergency controls"                     desc="OpenZeppelin Pausable lets leaders halt disputes. Funds locked until resolved." />
          <FeatCard       color={C.emerald} icon="◫" delay={80}  title="Default protection"                     desc="Missed deadlines flagged on-chain. Reputation loss is permanent and visible to all." />
          <FeatCard wide  color={C.indigo}  icon="◬" delay={160} title="Fully open source — every line on GitHub" desc="No hidden logic. No admin backdoors. The smart contracts are public and auditable. Anyone can verify that the rules are exactly what we say they are. The code is the only rule that matters." />
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CHILIMBA STORY — editorial two-col
// ══════════════════════════════════════════════════════════════════════════
function MemberCard({ name, score, color, paid, offset }) {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div className="mem-card" style={{ transform:`translateX(${offset}px)` }}>
      <div style={{ width:36, height:36, borderRadius:"50%", background:`${color}15`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:500, color, flexShrink:0 }}>
        {initials}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:5 }}>{name}</div>
        <div style={{ height:4, background:C.border, borderRadius:4, overflow:"hidden" }}>
          <div style={{ width:`${score}%`, height:"100%", background:color, borderRadius:4 }} />
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:500, color }}>{score}</div>
        <div style={{ fontSize:10, color: paid ? C.emerald : C.red, marginTop:2 }}>{paid ? "✓ paid" : "pending"}</div>
      </div>
    </div>
  );
}

function TrustSection() {
  const l = useReveal(0);
  const r = useReveal(160);
  return (
    <section className="cb2-s-alt">
      <div className="cb2-inner" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5rem", alignItems:"center" }}>
        <div ref={l} className="cb2-r">
          <Pill color="#F59E0B">Why it matters</Pill>
          <h2 className="cb2-hl" style={{ fontSize:"clamp(26px,3.5vw,42px)", color:C.text, marginBottom:"1.5rem" }}>
            The Chilimba is a{" "}
            <em style={{ color:"#F59E0B", fontStyle:"italic" }}>sacred</em>{" "}institution.
          </h2>
          <p style={{ fontSize:15, color:C.textMid, lineHeight:1.8, marginBottom:"1.25rem", fontWeight:300 }}>
            Rotating savings circles have sustained Zambian communities for generations.
            The problem was never the concept — it was trust.
            One bad actor could collapse everything.
          </p>
          <p style={{ fontSize:15, color:C.textMid, lineHeight:1.8, fontWeight:300 }}>
            ChainBa replaces that human trust layer with verifiable code.
            Stakes locked. Payouts automatic. Every default recorded permanently on-chain.
          </p>
        </div>
        <div ref={r} className="cb2-r" style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <MemberCard name="Frank Bwalya"    score={95} color={C.emerald} paid offset={0} />
          <MemberCard name="Mutale Chanda"   score={88} color={C.emerald} paid offset={5} />
          <MemberCard name="Thandiwe Mwale"  score={72} color={C.indigo}  paid offset={10} />
          <MemberCard name="Blessings Kapya" score={60} color={C.red}     paid={false} offset={15} />
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NO WALLET — removes biggest user objection
// ══════════════════════════════════════════════════════════════════════════
function PathCard({ emoji, accentColor, label, title, desc, btnLabel, btnClass, onClick }) {
  const ref = useReveal(0);
  return (
    <div ref={ref} className="cb2-r path-card">
      <div style={{ width:46, height:46, borderRadius:14, background:`${accentColor}12`, border:`1px solid ${accentColor}22`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.25rem", fontSize:22 }}>
        {emoji}
      </div>
      <div style={{ fontSize:11, fontWeight:500, color:accentColor, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>{label}</div>
      <h3 style={{ fontSize:18, fontWeight:500, color:C.text, marginBottom:10 }}>{title}</h3>
      <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7, marginBottom:"1.5rem", fontWeight:300 }}>{desc}</p>
      <button className={btnClass} onClick={onClick} style={{ width:"100%", padding:12 }}>{btnLabel}</button>
    </div>
  );
}

function NoWallet({ onRegister, onConnect }) {
  const h = useReveal(0);
  return (
    <section className="cb2-s">
      <div className="cb2-inner">
        <div ref={h} className="cb2-r" style={{ textAlign:"center", marginBottom:"3rem" }}>
          <Pill color={C.indigo}>No experience needed</Pill>
          <h2 className="cb2-hl" style={{ fontSize:"clamp(28px,4vw,46px)", color:C.text, marginBottom:"1rem" }}>
            New to crypto? That's fine.
          </h2>
          <p style={{ fontSize:16, color:C.textMid, lineHeight:1.75, maxWidth:520, margin:"0 auto", fontWeight:300 }}>
            ChainBa works whether you've used crypto before or never heard of a wallet.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", maxWidth:680, margin:"0 auto" }}>
          <PathCard
            emoji="🆕" accentColor={C.emerald} label="New to crypto"
            title="Register with your phone"
            desc="Enter your name, NRC, and phone. We create a secure Ethereum wallet for you automatically. No MetaMask, no seed phrases, no downloads."
            btnLabel="Create account →" btnClass="btn-dk" onClick={onRegister}
          />
          <PathCard
            emoji="🦊" accentColor={C.indigo} label="Have MetaMask"
            title="Connect your wallet"
            desc="Already have MetaMask? Connect directly and go straight to your dashboard. No registration required whatsoever."
            btnLabel="Connect wallet →" btnClass="btn-ot" onClick={onConnect}
          />
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FINAL CTA
// ══════════════════════════════════════════════════════════════════════════
function CTA({ onRegister, onConnect }) {
  const ref = useReveal(0);
  return (
    <section className="cb2-s-dark">
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 70% 60% at 50% 50%, rgba(16,185,129,.08) 0%, transparent 65%)" }} />
      <KenteStrip h={4} opacity={0.5} />
      <div ref={ref} className="cb2-r" style={{ maxWidth:580, margin:"3rem auto 0", textAlign:"center", position:"relative" }}>
        <h2 className="cb2-hl" style={{ fontSize:"clamp(32px,5vw,54px)", color:"#fff", marginBottom:"1rem" }}>
          Start your circle today.
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,.5)", lineHeight:1.75, marginBottom:"2.5rem", fontWeight:300 }}>
          Join the community saving smarter — together.<br />
          No banks. No middlemen. No broken trust.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-p" onClick={onRegister} style={{ padding:"15px 36px", fontSize:16 }}>Create account →</button>
          <button className="btn-g" onClick={onConnect}  style={{ padding:"15px 36px", fontSize:16 }}>Connect wallet</button>
        </div>
        <p style={{ marginTop:"1.25rem", fontSize:12, color:"rgba(255,255,255,.2)" }}>
          Free to join · No crypto knowledge needed · Secured by Ethereum
        </p>
      </div>
      <div style={{ marginTop:"3rem" }}><KenteStrip h={4} reverse opacity={0.4} /></div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{ background:"#020817", borderTop:"1px solid rgba(255,255,255,.05)", padding:"3rem" }}>
      <div style={{ maxWidth:1080, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"2rem", marginBottom:"2rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
              <LogoMark size={22} onDark />
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:"rgba(255,255,255,.6)" }}>ChainBa</span>
            </div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.25)", lineHeight:1.6, maxWidth:200 }}>
              Decentralized Chilimba savings on Ethereum. Built by Chain Keepers.
            </p>
          </div>
          <div style={{ display:"flex", gap:"3rem", flexWrap:"wrap" }}>
            {[
              { g:"Product",   ls:["How it works","Circles","Trust scores","Security"] },
              { g:"Resources", ls:["GitHub","Report","Demo","ZCAS"] },
            ].map(({ g, ls }) => (
              <div key={g}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", fontWeight:500, letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:12 }}>{g}</div>
                {ls.map(l => (
                  <div key={l} style={{ fontSize:13, color:"rgba(255,255,255,.35)", marginBottom:8, cursor:"pointer", transition:"color .2s" }}
                    onMouseEnter={e=>e.target.style.color="#fff"}
                    onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.35)"}>{l}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ paddingTop:"1.5rem", borderTop:"1px solid rgba(255,255,255,.05)", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.18)" }}>© 2026 ChainBa — Chain Keepers · CCS4711 · ZCAS University</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.18)" }}>Built on Ethereum · Open Source</span>
        </div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STICKY BAR
// ══════════════════════════════════════════════════════════════════════════
function StickyBar({ onRegister }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > window.innerHeight * .7);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:99, background:"rgba(2,8,23,.97)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,.06)", padding:"14px 3rem", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"su .4s cubic-bezier(.22,1,.36,1)", gap:"1rem", flexWrap:"wrap" }}>
      <div>
        <div style={{ fontSize:14, fontWeight:500, color:"#fff" }}>Ready to start your circle?</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>No wallet needed — register in 60 seconds.</div>
      </div>
      <button className="btn-p" onClick={onRegister}>Create account →</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════
export default function LandingV2({ onConnect, onRegister, onLogin }) {
  const hc = onConnect || (async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    try { await window.ethereum.request({ method:"eth_requestAccounts" }); }
    catch (e) { if (e.code !== 4001) console.error(e); }
  });
  const hr = onRegister || (() => {});

  return (
    <div className="cb2">
      <Navbar onLogin={onLogin} onRegister={hr} onConnect={hc} />
      <Hero onRegister={hr} onConnect={hc} />
      <Stats />
      <HowItWorks />
      <Features />
      <TrustSection />
      <NoWallet onRegister={hr} onConnect={hc} />
      <CTA onRegister={hr} onConnect={hc} />
      <Footer />
      <StickyBar onRegister={hr} />
    </div>
  );
}