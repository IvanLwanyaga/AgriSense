import { useEffect, useState, type CSSProperties } from "react";

const coffeeImages = [
  "robusta-green-cherries.jpg",
  "robusta-plantation.jpg",
  "robusta-highland-plantation.jpg",
  "robusta-ripe-cherries.jpg",
  "robusta-coffee-farm.jpg",
] as const;

export default function PublicLanding({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % coffeeImages.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeVideo) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveVideo(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeVideo]);

  return (
    <main className="public-site">
      <section
        className="landing-hero"
      >
        <div key={coffeeImages[activeImage]} className="landing-photo" aria-hidden="true" style={{ backgroundImage: `url("/images/${coffeeImages[activeImage]}")` }} />
        <div className="landing-hero-shade" />
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="#top" aria-label="AgriSense home">
            <span className="brand-mark">A</span>
            <span>AgriSense <small>UGANDA</small></span>
          </a>
          <div className="landing-nav-links">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How it works</a>
            <button className="nav-signin" onClick={onSignIn}>Sign in</button>
            <button className="nav-register" onClick={onRegister}>Create account <span>↗</span></button>
          </div>
        </nav>

        <div id="top" className="landing-hero-content">
          <div className="landing-copy">
            <span className="landing-eyebrow"><i /> ROBUSTA COFFEE · BUILT FOR UGANDA</span>
            <h1>See what’s happening<br />in your coffee fields.</h1>
            <p>AgriSense brings farm observations, local weather, and explainable AI together to help farmers and extension teams catch Black Coffee Twig Borer risk earlier.</p>
            <div className="landing-ctas">
              <button className="landing-primary" onClick={onRegister}>Get started <span>→</span></button>
              <button className="landing-secondary" onClick={() => setActiveVideo("3o-yMdcchQM")}><span className="play-icon">▶</span> Watch the live demo</button>
            </div>
            <div className="landing-trust"><span>✳</span> Early warning for healthier Robusta harvests</div>
          </div>
          <LiveRiskDemo onOpenVideo={setActiveVideo} />
        </div>

        <div className="hero-bottomline">
          <span>FIELD INTELLIGENCE FOR EVERY GROWING SEASON</span>
          <div className="hero-image-dots" aria-label="Choose background photo">
            {coffeeImages.map((image, index) => (
              <button key={image} className={index === activeImage ? "active" : ""} onClick={() => setActiveImage(index)} aria-label={`Show coffee photo ${index + 1}`} aria-pressed={index === activeImage} />
            ))}
          </div>
          <span>UGANDA · ROBUSTA</span>
        </div>
      </section>

      <section id="platform" className="landing-platform">
        <div className="platform-heading">
          <span className="section-kicker">ONE CLEARER VIEW OF YOUR FARM</span>
          <h2>From field signals<br />to confident next steps.</h2>
          <p>A practical workspace for the people who grow, support, and protect Uganda’s coffee.</p>
        </div>
        <div className="platform-features">
          <article className="platform-feature"><span className="feature-icon">⌖</span><small>01 / MONITOR</small><h3>Know your blocks</h3><p>Keep plantation details, farm conditions, and observations together in one place.</p></article>
          <article className="platform-feature"><span className="feature-icon">⌁</span><small>02 / SCREEN</small><h3>Spot risk sooner</h3><p>Combine visible twig symptoms and weather signals in a guided BCTB screening.</p></article>
          <article className="platform-feature"><span className="feature-icon">✳</span><small>03 / UNDERSTAND</small><h3>See why it matters</h3><p>Review the factors behind each result and get clear, practical follow-up guidance.</p></article>
          <article className="platform-feature"><span className="feature-icon">◎</span><small>04 / CONNECT</small><h3>Bring teams closer</h3><p>Help farmers and extension officers coordinate verification and field follow-up.</p></article>
        </div>
      </section>

      <section id="how-it-works" className="landing-how">
        <div className="how-photo" role="img" aria-label="Coffee cherries growing among Robusta leaves" />
        <div className="how-copy">
          <span className="section-kicker">A SIMPLE FIELD WORKFLOW</span>
          <h2>Good decisions start<br />with what you can see.</h2>
          <ol>
            <li><b>01</b><span><strong>Record a field observation</strong><small>Capture symptoms and farm context in a guided check.</small></span></li>
            <li><b>02</b><span><strong>Review the risk signals</strong><small>See how observations and recent conditions shape the screening.</small></span></li>
            <li><b>03</b><span><strong>Choose a practical next step</strong><small>Use clear cultural guidance or coordinate an officer visit.</small></span></li>
          </ol>
          <button className="landing-primary" onClick={onRegister}>Open your AgriSense workspace <span>→</span></button>
        </div>
      </section>

      <footer className="landing-footer">
        <a className="landing-brand" href="#top"><span className="brand-mark">A</span><span>AgriSense <small>UGANDA</small></span></a>
        <p>Explainable agricultural intelligence for Robusta coffee.</p>
        <button onClick={onSignIn}>Sign in to your workspace <span>→</span></button>
      </footer>
      {activeVideo && (
        <div className="video-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveVideo(null); }}>
          <section className="video-modal" role="dialog" aria-modal="true" aria-label="AgriSense field video">
            <button className="video-modal-close" onClick={() => setActiveVideo(null)} aria-label="Close video">×</button>
            <div className="video-modal-player">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="AgriSense coffee field demonstration video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="video-modal-switcher" aria-label="Choose a field demo">
              <button className={activeVideo === "3o-yMdcchQM" ? "selected" : ""} onClick={() => setActiveVideo("3o-yMdcchQM")}>Field demo 01</button>
              <button className={activeVideo === "lRNb86xg--c" ? "selected" : ""} onClick={() => setActiveVideo("lRNb86xg--c")}>Field demo 02</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function LiveRiskDemo({ onOpenVideo }: { onOpenVideo: (videoId: string) => void }) {
  const [previousOutbreak, setPreviousOutbreak] = useState(false);
  const [rainyWeek, setRainyWeek] = useState(false);
  const [twigSymptoms, setTwigSymptoms] = useState(false);
  const score = (previousOutbreak ? 30 : 0) + (rainyWeek ? 20 : 0) + (twigSymptoms ? 10 : 0);
  const risk = score >= 60 ? "HIGH" : score >= 30 ? "MODERATE" : "LOW";
  const riskLabel = risk === "HIGH" ? "High signals" : risk === "MODERATE" ? "Moderate signals" : "Low signals";
  const signals = [
    { label: "Previous BCTB outbreak", active: previousOutbreak, toggle: () => setPreviousOutbreak(!previousOutbreak) },
    { label: "Heavy rain this week", active: rainyWeek, toggle: () => setRainyWeek(!rainyWeek) },
    { label: "Pinholes or twig damage", active: twigSymptoms, toggle: () => setTwigSymptoms(!twigSymptoms) },
  ];

  return (
    <aside id="live-preview" className="demo-preview" aria-label="Interactive sample BCTB screening">
      <div className="demo-preview-head"><span className="demo-live-dot" /><span>INTERACTIVE PREVIEW</span><small>SAMPLE DATA</small></div>
      <h2>What could your field signals mean?</h2>
      <p className="demo-preview-intro">Explore how a few observations can shape an early-warning screening.</p>
      <div className="demo-signals">
        {signals.map(({ label, active, toggle }) => (
          <button key={label} className={`demo-signal ${active ? "selected" : ""}`} onClick={toggle} aria-pressed={active}>
            <span className="signal-check">{active ? "✓" : "+"}</span>{label}
          </button>
        ))}
      </div>
      <div className={`demo-result risk-${risk.toLowerCase()}`}>
        <div><span className="demo-result-label">SAMPLE SCREENING</span><strong>{riskLabel}</strong><small>{score} / 100 signal score</small></div>
        <div className="demo-gauge" style={{ "--score": `${score}%` } as CSSProperties}><span>{score}</span></div>
      </div>
      <div className="demo-preview-foot"><span>Illustrative only · not a field diagnosis</span><span>Tap signals to explore</span></div>
      <div id="live-demo-videos" className="demo-video-section">
        <div className="demo-video-heading"><span>FIELD VIDEO RESOURCES</span><small>Watch on YouTube</small></div>
        <div className="demo-video-grid">
          <button type="button" onClick={() => onOpenVideo("3o-yMdcchQM")} aria-label="Play coffee field video one">
            <img src="https://img.youtube.com/vi/3o-yMdcchQM/hqdefault.jpg" alt="Video preview" loading="lazy" />
            <span className="video-play">▶</span><small>Watch video 01 <b>▶</b></small>
          </button>
          <button type="button" onClick={() => onOpenVideo("lRNb86xg--c")} aria-label="Play coffee field video two">
            <img src="https://img.youtube.com/vi/lRNb86xg--c/hqdefault.jpg" alt="Video preview" loading="lazy" />
            <span className="video-play">▶</span><small>Watch video 02 <b>▶</b></small>
          </button>
        </div>
      </div>
    </aside>
  );
}
