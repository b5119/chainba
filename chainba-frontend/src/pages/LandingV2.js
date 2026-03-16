import { useEffect, useRef, useState } from "react";
import "./LandingV2.css";

const T = {
  bg:"#0A0A08", bgCard:"#111110", bgMuted:"#161614",
  amber:"#BA7517", amberBright:"#EF9F27", amberFaint:"#2A1C05",
  teal:"#1D9E75", tealFaint:"#051F15", coral:"#D85A30",
  text:"#F0EDE6", textMuted:"#8A8880", textDim:"#4A4845",
  border:"rgba(240,237,230,0.07)", borderHover:"rgba(240,237,230,0.15)",
};

function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const trigger = () => setTimeout(() => el.classList.add("in"), delay);
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 40) { trigger(); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { trigger(); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

function Counter({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let t0 = null;
        const tick = (ts) => {
          if (!t0) t0 = ts;
          const p = Math.min((ts - t0) / 1400, 1);
          setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(tick); else setVal(target);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const KC = ["#BA7517","#0F6E56","#D85A30","#FAC775","#1D9E75","#993C1D","#BA7517","#5DCAA5","#EF9F27","#D85A30","#0F6E56","#FAC775","#1D9E75","#BA7517","#D85A30","#0F6E56","#FAC775","#BA7517","#5DCAA5","#993C1D","#EF9F27","#1D9E75"];
function KenteStrip({ opacity = 1 }) {
  return (
    <div style={{ overflow:"hidden", height:"4px", width:"100%" }}>
      <div style={{ display:"flex", height:"4px", width:"200%", animation:"kenteScroll 18s linear infinite" }}>
        {[...KC,...KC].map((c,i) => <div key={i} style={{ flex:1, background:c, opacity }} />)}
      </div>
    </div>
  );
}

function Diamond({ size=12, color=T.amber, pulse=false, style:sx={} }) {
  return <div style={{ width:size, height:size, background:color, borderRadius:"2px", flexShrink:0, transform:"rotate(45deg)", animation:pulse?"diamondPulse 3s ease-in-out infinite":"none", ...sx }} />;
}

function Navbar({ onConnect, onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"0 2.5rem", height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between", background:scrolled?"rgba(10,10,8,0.94)":"transparent", backdropFilter:scrolled?"blur(14px)":"none", borderBottom:scrolled?`1px solid ${T.border}`:"none", transition:"background .35s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        <Diamond size={14} color={T.amber} pulse />
        <Diamond size={9} color={T.coral} style={{ marginLeft:"-3px", marginTop:"5px" }} />
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", color:T.text, marginLeft:"6px", letterSpacing:"-0.5px" }}>ChainBa</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"2rem" }}>
        {["How it works","Circles","Trust scores"].map(l => (
          <span key={l} className="cb2-navlink" style={{ fontSize:"14px", color:T.textMuted }}>{l}</span>
        ))}
      </div>
      <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
        <span onClick={onLogin} className="cb2-navlink" style={{ fontSize:"14px", color:T.textMuted }}>Sign in</span>
        <button className="cb2-btn-primary" style={{ padding:"9px 20px", fontSize:"14px" }} onClick={onConnect}>Connect wallet</button>
      </div>
    </nav>
  );
}

function Hero({ onConnect, onRegister }) {
  const r0 = useReveal(0);
  const r1 = useReveal(120);
  const r2 = useReveal(240);
  const r3 = useReveal(360);
  const r4 = useReveal(480);
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 2.5rem", paddingTop:"80px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize:"60px 60px", maskImage:"radial-gradient(ellipse 80% 60% at 50% 50%,black 30%,transparent 100%)", WebkitMaskImage:"radial-gradient(ellipse 80% 60% at 50% 50%,black 30%,transparent 100%)" }} />
      <div style={{ position:"absolute", top:"18%", right:"6%", width:"460px", height:"460px", borderRadius:"50%", background:`radial-gradient(circle,${T.amberFaint} 0%,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"14%", left:"4%", width:"300px", height:"300px", borderRadius:"50%", background:`radial-gradient(circle,${T.tealFaint} 0%,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ maxWidth:"900px", position:"relative" }}>
        <div ref={r0} className="reveal" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:T.amberFaint, border:`1px solid ${T.amber}44`, padding:"6px 14px", borderRadius:"100px", marginBottom:"2rem" }}>
          <Diamond size={7} color={T.amber} />
          <span style={{ fontSize:"12px", color:T.amber, fontWeight:"500", letterSpacing:"1.5px", textTransform:"uppercase" }}>Zambian savings · on the blockchain</span>
        </div>
        <h1 ref={r1} className="cb2-hl reveal" style={{ fontSize:"clamp(52px,8vw,96px)", color:T.text, marginBottom:"1.5rem" }}>
          Your Chilimba,<br /><em style={{ color:T.amber, fontStyle:"italic" }}>trustless</em> and<br />on-chain.
        </h1>
        <p ref={r2} className="reveal" style={{ fontSize:"18px", color:T.textMuted, maxWidth:"520px", lineHeight:"1.7", marginBottom:"2.5rem", fontWeight:"300" }}>
          ChainBa brings the rotating savings circle your community already knows to Ethereum. No missed payouts. No broken promises. Just code.
        </p>
        <div ref={r3} className="reveal" style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
          <button className="cb2-btn-primary" onClick={onConnect}>Join a circle →</button>
          <button className="cb2-btn-ghost" onClick={onRegister}>Create account</button>
        </div>
        <div ref={r4} className="reveal" style={{ marginTop:"2.5rem", display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ display:"flex" }}>
            {[T.amber,T.teal,T.coral,"#534AB7"].map((c,i) => (
              <div key={i} style={{ width:"28px", height:"28px", borderRadius:"50%", background:c, border:`2px solid ${T.bg}`, marginLeft:i===0?0:"-8px" }} />
            ))}
          </div>
          <span style={{ fontSize:"13px", color:T.textDim }}>Join members already saving on-chain</span>
        </div>
      </div>
      <div style={{ position:"absolute", bottom:"2.5rem", left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
        <span style={{ fontSize:"11px", color:T.textDim, letterSpacing:"1.5px", textTransform:"uppercase" }}>Scroll</span>
        <div style={{ width:"1px", height:"40px", background:`linear-gradient(${T.amber},transparent)` }} />
      </div>
    </section>
  );
}

function Stats() {
  const ref = useReveal(0);
  const stats = [
    { label:"ETH secured on-chain", value:0,   suffix:" ETH", color:T.amber },
    { label:"Active circles",        value:0,   suffix:"",     color:T.text  },
    { label:"Payouts delivered",      value:0,   suffix:"",     color:T.teal  },
    { label:"Starting trust score",  value:100, suffix:"/100", color:T.text  },
  ];
  return (
    <section style={{ padding:"5rem 2.5rem", background:T.bgMuted }}>
      <div ref={ref} className="reveal" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"1px", background:T.border, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:T.bgMuted, padding:"2rem 1.75rem" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"38px", fontWeight:"500", color:s.color, marginBottom:"6px" }}>
              <Counter target={s.value} suffix={s.suffix} />
            </div>
            <div style={{ fontSize:"13px", color:T.text, fontWeight:"500" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StepCard({ num, color, title, desc, tag, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal" style={{ display:"flex", gap:"1.5rem", paddingBottom:"3rem" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", background:`${color}11` }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color }}>{num}</span>
        </div>
        <div style={{ width:"1px", flex:1, background:`linear-gradient(${color}33,transparent)`, marginTop:"8px", minHeight:"32px" }} />
      </div>
      <div style={{ paddingTop:"8px" }}>
        <h3 style={{ fontSize:"20px", fontWeight:"500", color:T.text, marginBottom:"10px", letterSpacing:"-0.3px" }}>{title}</h3>
        <p style={{ fontSize:"15px", color:T.textMuted, lineHeight:"1.75", marginBottom:"12px", fontWeight:"300" }}>{desc}</p>
        <code style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color, background:`${color}11`, padding:"4px 10px", borderRadius:"4px", display:"inline-block" }}>{tag}</code>
      </div>
    </div>
  );
}

function HowItWorks() {
  const titleRef = useReveal(0);
  const steps = [
    { num:"01", color:T.amber, delay:0,   title:"Create or join a circle",      desc:"Set group size, contribution amount, and cycle length. Deploy on-chain in one transaction. Join an existing circle via invite — no wallet needed to preview.", tag:"ChilimbaFactory.createGroup()" },
    { num:"02", color:T.teal,  delay:120, title:"Contribute every cycle",        desc:"When your round opens, send your contribution through MetaMask. Every payment is recorded on-chain — permanent, tamper-proof proof of who paid and when.", tag:"ChilimbaGroup.payContribution()" },
    { num:"03", color:T.coral, delay:240, title:"Payout releases automatically", desc:"When all members have contributed, the contract transfers the full pool to the beneficiary. No middleman, no delay. Reputation updates automatically.", tag:"_releasePayout() → MemberReputation" },
  ];
  return (
    <section style={{ padding:"6rem 2.5rem", maxWidth:"780px", margin:"0 auto" }}>
      <div ref={titleRef} className="reveal" style={{ marginBottom:"3.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"1rem" }}>
          <Diamond size={8} color={T.amber} />
          <span style={{ fontSize:"11px", color:T.textDim, letterSpacing:"2px", textTransform:"uppercase" }}>The process</span>
        </div>
        <h2 className="cb2-hl" style={{ fontSize:"clamp(32px,5vw,52px)", color:T.text }}>
          Three steps.<br />Zero trust required.
        </h2>
      </div>
      {steps.map((s,i) => <StepCard key={i} {...s} />)}
    </section>
  );
}

function FeatureCard({ icon, color, title, desc, delay }) {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="reveal feat-card" style={{ background:T.bgMuted, padding:"2rem", border:"1px solid transparent" }}>
      <div style={{ fontSize:"22px", marginBottom:"1rem", color }}>{icon}</div>
      <h3 style={{ fontSize:"16px", fontWeight:"500", color:T.text, marginBottom:"8px" }}>{title}</h3>
      <p style={{ fontSize:"13px", color:T.textMuted, lineHeight:"1.7", fontWeight:"300" }}>{desc}</p>
    </div>
  );
}

function Features() {
  const titleRef = useReveal(0);
  const feats = [
    { icon:"◈", color:T.amber,       delay:0,   title:"On-chain reputation",  desc:"Every payment updates your permanent score via MemberReputation.sol. Your trustworthiness follows you across every circle." },
    { icon:"◉", color:T.teal,        delay:80,  title:"Automatic payouts",    desc:"No admin holding funds. When all members pay, the contract releases the pool. ReentrancyGuard prevents all exploit vectors." },
    { icon:"◇", color:T.coral,       delay:160, title:"Hybrid identity",      desc:"Register with name, NRC, and phone. Your identity is keccak256-hashed on-chain — verifiable without exposing personal data." },
    { icon:"⬡", color:"#8B7FDD",    delay:0,   title:"Emergency controls",   desc:"Group leaders can pause a circle during disputes. OpenZeppelin Pausable keeps funds locked and safe when activity halts." },
    { icon:"◫", color:T.amberBright, delay:80,  title:"Default protection",   desc:"If a member misses their deadline, the leader flags a default on-chain. Late members lose reputation score permanently." },
    { icon:"◬", color:T.teal,        delay:160, title:"Open source",          desc:"Every line of contract code is auditable on GitHub. No hidden logic. No admin backdoors. The contract is the rule." },
  ];
  return (
    <section style={{ padding:"6rem 2.5rem", background:T.bgMuted }}>
      <div ref={titleRef} className="reveal" style={{ marginBottom:"3rem", maxWidth:"560px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"1rem" }}>
          <Diamond size={8} color={T.teal} />
          <span style={{ fontSize:"11px", color:T.textDim, letterSpacing:"2px", textTransform:"uppercase" }}>What makes ChainBa different</span>
        </div>
        <h2 className="cb2-hl" style={{ fontSize:"clamp(28px,4vw,44px)", color:T.text }}>
          Built on trust you<br />can verify.
        </h2>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1px", background:T.border, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
        {feats.map((f,i) => <FeatureCard key={i} {...f} />)}
      </div>
    </section>
  );
}

function TrustSection() {
  const leftRef  = useReveal(0);
  const rightRef = useReveal(160);
  const members = [
    { name:"Frank Bwalya",    score:95, color:T.teal,  paid:true  },
    { name:"Mutale Chanda",   score:88, color:T.teal,  paid:true  },
    { name:"Thandiwe Mwale",  score:72, color:T.amber, paid:true  },
    { name:"Blessings Kapya", score:60, color:T.coral, paid:false },
  ];
  return (
    <section style={{ padding:"7rem 2.5rem" }}>
      <div style={{ maxWidth:"900px", margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5rem", alignItems:"center" }}>
        <div ref={leftRef} className="reveal">
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"1.5rem" }}>
            <Diamond size={8} color={T.coral} />
            <span style={{ fontSize:"11px", color:T.textDim, letterSpacing:"2px", textTransform:"uppercase" }}>Why it matters</span>
          </div>
          <h2 className="cb2-hl" style={{ fontSize:"clamp(26px,3.5vw,40px)", color:T.text, marginBottom:"1.5rem" }}>
            The Chilimba is<br />a <em style={{ color:T.amber, fontStyle:"italic" }}>sacred</em> institution.
          </h2>
          <p style={{ fontSize:"15px", color:T.textMuted, lineHeight:"1.8", marginBottom:"1.5rem", fontWeight:"300" }}>
            Rotating savings circles have sustained Zambian communities for generations. The problem was never the concept — it was trust. One bad actor could collapse everything.
          </p>
          <p style={{ fontSize:"15px", color:T.textMuted, lineHeight:"1.8", fontWeight:"300" }}>
            ChainBa replaces the human trust layer with verifiable code. Stakes locked in a contract. Payouts automatic. Defaults recorded permanently on-chain.
          </p>
        </div>
        <div ref={rightRef} className="reveal" style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {members.map((m,i) => (
            <div key={i} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", transform:`translateX(${i*6}px)` }}>
              <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:`${m.color}22`, border:`1px solid ${m.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"500", color:m.color, flexShrink:0 }}>
                {m.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:"500", color:T.text, marginBottom:"5px" }}>{m.name}</div>
                <div style={{ height:"3px", background:T.border, borderRadius:"2px", overflow:"hidden" }}>
                  <div style={{ width:`${m.score}%`, height:"100%", background:m.color }} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"500", color:m.color }}>{m.score}</div>
                <div style={{ fontSize:"10px", color:m.paid?T.teal:T.coral, marginTop:"2px" }}>{m.paid?"✓ paid":"pending"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onConnect, onRegister }) {
  const ref = useReveal(0);
  return (
    <section style={{ padding:"6rem 2.5rem", background:T.bgMuted }}>
      <div ref={ref} className="reveal" style={{ maxWidth:"640px", margin:"0 auto", textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", gap:"6px", marginBottom:"1.5rem" }}>
          {[T.amber,T.teal,T.coral,T.amberBright].map((c,i) => <Diamond key={i} size={10} color={c} />)}
        </div>
        <h2 className="cb2-hl" style={{ fontSize:"clamp(32px,5vw,56px)", color:T.text, marginBottom:"1.25rem" }}>
          Your community<br />deserves better.
        </h2>
        <p style={{ fontSize:"16px", color:T.textMuted, lineHeight:"1.7", marginBottom:"2.5rem", fontWeight:"300" }}>
          Start a circle today. No banks. No middlemen. No broken trust. Just your community and the chain.
        </p>
        <div style={{ display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
          <button className="cb2-btn-primary" onClick={onConnect} style={{ padding:"14px 32px", fontSize:"16px" }}>Connect wallet →</button>
          <button className="cb2-btn-ghost" onClick={onRegister} style={{ padding:"14px 32px", fontSize:"16px" }}>Create account</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding:"2.5rem", borderTop:`1px solid ${T.border}` }}>
      <KenteStrip opacity={0.4} />
      <div style={{ marginTop:"2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <Diamond size={10} color={T.amber} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"16px", color:T.textMuted }}>ChainBa</span>
        </div>
        <span style={{ fontSize:"12px", color:T.textDim }}>© 2026 ChainBa — Chain Keepers · CCS4711 · ZCAS University</span>
        <div style={{ display:"flex", gap:"1.5rem" }}>
          {["GitHub","Report","Demo"].map(l => (
            <span key={l} className="cb2-navlink" style={{ fontSize:"12px", color:T.textDim }}>{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

function StickyBar({ onConnect }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > window.innerHeight * 0.4);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:99, background:"rgba(10,10,8,0.96)", backdropFilter:"blur(14px)", borderTop:`1px solid ${T.border}`, padding:"14px 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"slideUp .4s cubic-bezier(.22,1,.36,1)", gap:"1rem", flexWrap:"wrap" }}>
      <div>
        <div style={{ fontSize:"14px", fontWeight:"500", color:T.text }}>Ready to start your circle?</div>
        <div style={{ fontSize:"12px", color:T.textMuted }}>Connect your wallet — it takes 30 seconds.</div>
      </div>
      <button className="cb2-btn-primary" onClick={onConnect}>Join a circle →</button>
    </div>
  );
}

export default function LandingV2({ onConnect, onRegister, onLogin }) {
  const handleConnect = onConnect || (async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    try { await window.ethereum.request({ method:"eth_requestAccounts" }); }
    catch (err) { if (err.code !== 4001) console.error(err); }
  });
  return (
    <div className="cb2">
      <Navbar onConnect={handleConnect} onLogin={onLogin} />
      <Hero onConnect={handleConnect} onRegister={onRegister} />
      <KenteStrip />
      <Stats />
      <HowItWorks />
      <KenteStrip />
      <Features />
      <TrustSection />
      <CTASection onConnect={handleConnect} onRegister={onRegister} />
      <Footer />
      <StickyBar onConnect={handleConnect} />
    </div>
  );
}