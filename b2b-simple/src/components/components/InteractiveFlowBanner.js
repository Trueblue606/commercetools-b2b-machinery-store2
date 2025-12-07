import React, { useEffect, useRef } from 'react';

/* ---------- Minimal inline icons (no external deps) ---------- */
const FallbackIcons = {
  Database: ({ size = 20, style, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style} {...p}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 3 4 3 9 3s9 0 9-3V5" />
      <path d="M3 12c0 3 4 3 9 3s9 0 9-3" />
    </svg>
  ),
  Zap: ({ size = 20, style, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style} {...p}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Globe: ({ size = 20, style, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style} {...p}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Monitor: ({ size = 20, style, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style} {...p}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

// Try lucide-react if installed; otherwise use the fallbacks
let IconPack = FallbackIcons;
try {
  // eslint-disable-next-line global-require
  const { Database, Zap, Globe, Monitor } = require('lucide-react');
  IconPack = { Database, Zap, Globe, Monitor };
} catch { /* fall back */ }

/* ---------- Refined Background Constants ---------- */
const VIGNETTE_OPACITY = 0.04;   // reduced for subtlety
const GRID_OPACITY     = 0.04;   // cleaner grid
const SHEEN_OPACITY    = 0.06;   // softer sheen
const SWEEP_OPACITY    = 0.03;   // gentler sweep
const SWEEP_DURATION_S = 20;     // slower, more elegant

const REFINED_BG_PRESETS = {
  corporateSlate:
    `radial-gradient(1200px circle at 50% -20%, rgba(255,255,255,${VIGNETTE_OPACITY}) 0%, transparent 50%),
     linear-gradient(135deg, #0f172a 0%, #000000ff 40%, #0a0f1e 70%, #0a0b0bff 100%)`,
  royalIndigo:
    `radial-gradient(1000px circle at 50% -15%, rgba(47,130,255,${VIGNETTE_OPACITY}) 0%, transparent 55%),
     linear-gradient(135deg, #01050dff 0%, #0e0f0fff 35%, #010101ff 65%, #000000ff 100%)`,
  charcoalGlass:
    `radial-gradient(1100px circle at 50% -18%, rgba(255,255,255,${VIGNETTE_OPACITY}) 0%, transparent 52%),
     linear-gradient(135deg, #0e141b 0%, #000000ff 38%, #0a0f1e 68%, #0a0a0a 100%)`,
};

const HERO_BG = REFINED_BG_PRESETS.corporateSlate;

/* ---------- Copy ---------- */
const TITLE   = 'Scoped B2B POC: Contract-Style Pricing (Demo Data)';
const TAGLINE = (
  <>
    Specials, multi-priced SKUs, customer groups — demoed. <br />
    Simulated delta updates — not nightly dumps.
  </>
);

const steps = [
  { icon: 'Database', title: 'ERP-Style Source',                 subtitle: 'Demo System of Record' },
  { icon: 'Zap',      title: 'Delta-Style Sync',         subtitle: 'Changes-Only Overlap-Safe (Demo)' },
  { icon: 'Globe',    title: 'MACH Model Demo',      subtitle: 'Composable B2B Core (PoC)' },
  { icon: 'Monitor',  title: 'Next.js Storefront', subtitle: 'Eligibility & Order Flow' },
];

export default function InteractiveFlowBanner() {
  const h1Ref = useRef(null);
  const pRef = useRef(null);

  const nodeRefs   = useRef([]);
  const fillRefs   = useRef([]);   // gradient fill that grows
  const streakRefs = useRef([]);   // slim white streak inside the bar

  const tlRef = useRef(null);

  const setNodeRef   = (i) => (el) => (nodeRefs.current[i]   = el);
  const setFillRef   = (i) => (el) => (fillRefs.current[i]   = el);
  const setStreakRef = (i) => (el) => (streakRefs.current[i] = el);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const gsapMod = await import('gsap');
        const gsap = gsapMod.gsap || gsapMod.default || gsapMod;
        if (!mounted) return;

        const resetHeadline = () => {
          gsap.set([h1Ref.current, pRef.current], { autoAlpha: 0, y: 10 });
        };
        const resetNodes = () => {
          gsap.set(nodeRefs.current,   { autoAlpha: 0, y: 14, scale: 0.97 });
          gsap.set(fillRefs.current,   { autoAlpha: 0, width: 0 });
          gsap.set(streakRefs.current, { autoAlpha: 0, xPercent: -20 });
        };

        // Prime initial state and on every repeat
        resetHeadline();
        resetNodes();

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          repeat: -1,
          repeatDelay: 0.05,
          onRepeat: () => { resetHeadline(); resetNodes(); },
        });
        tlRef.current = tl;

        // Headline / Tagline (smaller title, larger subtitle, slight tracking)
        tl.to(h1Ref.current, { autoAlpha: 1, y: 0, duration: 0.38 })
          .to(pRef.current,  { autoAlpha: 1, y: 0, duration: 0.34 }, '-=0.18');

        // Step-by-step nodes + connectors (comfortable pacing)
        steps.forEach((_, i) => {
          tl.to(nodeRefs.current[i], { autoAlpha: 1, y: 0, scale: 1, duration: 0.36 });
          if (i < steps.length - 1) {
            tl.to(fillRefs.current[i], { autoAlpha: 1, width: '100%', duration: 0.34 }, '-=0.20');
            tl.fromTo(
              streakRefs.current[i],
              { autoAlpha: 0.0, xPercent: -20 },
              { autoAlpha: 0.75, xPercent: 120, duration: 0.46, ease: 'none' },
              '<'
            );
          }
        });

        // Readable hold with a subtle "ping", then fade nodes only (headline stays)
        tl.to(h1Ref.current, { scale: 1.01, duration: 0.22, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '+=0.10')
          .to({}, { duration: 2.2 }) // hold time for reading
          .to([...nodeRefs.current, ...fillRefs.current, ...streakRefs.current], { autoAlpha: 0, duration: 0.30 });
      } catch {
        // No GSAP available -> static banner
      }
    })();

    return () => { mounted = false; tlRef.current?.kill(); };
  }, []);

  const pause  = () => tlRef.current?.pause();
  const resume = () => tlRef.current?.play();

  return (
    <section
      role="banner"
      aria-label="True Pricing data flow"
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        minHeight: 460,
        background: HERO_BG,
        color: '#fff',
      }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* === Refined Background Overlays === */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: GRID_OPACITY,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0',
          mixBlendMode: 'overlay'
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          opacity: SHEEN_OPACITY,
          background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 60%, transparent 100%)',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          transform: 'translateX(-100%)',
          background: 'linear-gradient(125deg, transparent 0%, transparent 45%, rgba(255,255,255,0.8) 50%, transparent 55%, transparent 100%)',
          opacity: SWEEP_OPACITY,
          filter: 'blur(1px)',
          animation: `refinedSweep ${SWEEP_DURATION_S}s linear infinite`,
        }}
      />

      {/* Content (matches product grid width) */}
      <div style={{
        position:'relative', zIndex:10,
        maxWidth: 1400,
        margin:'0 auto',
        padding:'56px 24px 72px',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        height:'100%',
      }}>
        {/* Heading group — vertically centered with clean spacing */}
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          minHeight: 180,
          marginBottom: 36,
          textAlign:'center',
        }}>
          <h1
            ref={h1Ref}
            style={{
              color:'#fff',
              letterSpacing:'0.008em',               // slight tracking
              fontWeight:800,
              margin:0,
              marginBottom:10,
              fontSize:'clamp(26px, 4vw, 40px)',     // reduced from 48px
              lineHeight:1.12,
            }}
          >
            {TITLE}
          </h1>

          <p
            ref={pRef}
            style={{
              color:'rgba(219,234,254,.92)',
              letterSpacing:'0.01em',                // tiny tracking
              lineHeight:1.62,
              margin:0,
              marginBottom:44,                       // space before boxes
              maxWidth:1100,
              fontSize:'clamp(16px, 2.2vw, 25px)',   // increased from 20px
            }}
          >
            {TAGLINE}
          </p>
        </div>

        {/* Flow row — single line, centered */}
        <div style={{ width:'100%', maxWidth:1400 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexWrap:'nowrap', overflow:'hidden' }}>
            {steps.map((step, i) => {
              const Icon = IconPack[step.icon] || FallbackIcons[step.icon];
              return (
                <React.Fragment key={step.title}>
                  {/* Node */}
                  <div
                    ref={setNodeRef(i)}
                    style={{
                      flex:'0 0 230px', minWidth:230, maxWidth:230,
                      borderRadius:16,
                      border:'1px solid rgba(255,255,255,.16)',
                      background:'rgba(255,255,255,.10)',
                      backdropFilter:'blur(8px)',
                      padding:'16px 18px',
                      display:'flex', alignItems:'center',
                      textAlign:'left', minHeight:96,
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12, width:'100%' }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(255,255,255,.15)', flexShrink:0 }}>
                        {Icon ? <Icon size={20} style={{ color:'#fff' }} aria-hidden="true" /> : null}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'#fff', fontWeight:700, fontSize:16, marginBottom:2 }}>{step.title}</div>
                        <div style={{ color:'rgba(219,234,254,.8)', fontSize:12 }}>{step.subtitle}</div>
                      </div>
                    </div>
                  </div>

                  {/* Connector (longer, with inner white streak) */}
                  {i < steps.length - 1 && (
                    <div style={{ flex:'0 0 110px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ position:'relative', width:'100%', height:4, borderRadius:2, background:'rgba(255,255,255,.12)', overflow:'hidden' }}>
                        {/* coloured fill grows */}
                        <div
                          ref={setFillRef(i)}
                          style={{
                            position:'absolute', left:0, top:0, bottom:0,
                            width:0, borderRadius:2,
                            background:'linear-gradient(90deg,#60a5fa,#22d3ee,#c084fc)',
                          }}
                        />
                        {/* slim white streak inside */}
                        <div
                          ref={setStreakRef(i)}
                          style={{
                            position:'absolute', top:1, left:0,
                            width:40, height:2, borderRadius:2,
                            opacity:0,
                            background:'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0))',
                            filter:'blur(0.5px)', mixBlendMode:'screen', pointerEvents:'none',
                          }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Screen reader description */}
      <div style={{ position:'absolute', width:1, height:1, padding:0, margin:-1, overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }}>
        <h2>Data Flow Process</h2>
        <ol>
          {steps.map((s, idx) => (
            <li key={s.title}>Step {idx + 1}: {s.title} — {s.subtitle}</li>
          ))}
        </ol>
      </div>

      <style jsx>{`
        @keyframes refinedSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes float1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,10px) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes float2 { 0%{transform:translate(-20px,0) scale(1)} 50%{transform:translate(0,15px) scale(1.08)} 100%{transform:translate(-20px,0) scale(1)} }
        @keyframes float3 { 0%{transform:translate(0,-10px) scale(1)} 50%{transform:translate(-15px,10px) scale(1.04)} 100%{transform:translate(0,-10px) scale(1)} }
      `}</style>
    </section>
  );
}