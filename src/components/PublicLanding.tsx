
import { useEffect, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import "./PublicLanding.css";

const coffeeImages = [
  "robusta-green-cherries.jpg",
  "robusta-plantation.jpg",
  "robusta-highland-plantation.jpg",
  "robusta-ripe-cherries.jpg",
  "robusta-coffee-farm.jpg",
] as const;

const videoIds = ["3o-yMdcchQM", "lRNb86xg--c"] as const;

const features = [
  {
    number: "01",
    icon: "⌖",
    label: "MONITOR",
    title: "Know your coffee farm",
    description:
      "Keep farm profiles, plantation details, field observations and records organised in one workspace.",
  },
  {
    number: "02",
    icon: "◉",
    label: "SCREEN",
    title: "Understand BCTB risk",
    description:
      "Use guided observations and relevant farm conditions to screen for potential Black Coffee Twig Borer risk.",
  },
  {
    number: "03",
    icon: "✳",
    label: "UNDERSTAND",
    title: "Know what influences risk",
    description:
      "Review contributing factors behind screening results and receive understandable, practical guidance.",
  },
  {
    number: "04",
    icon: "↗",
    label: "CONNECT",
    title: "Work with extension teams",
    description:
      "Share relevant farm information and coordinate field verification and follow-up with agricultural officers.",
  },
];

const faqs = [
  {
    question: "What is AgriSense?",
    answer:
      "AgriSense is an agricultural intelligence platform designed to support Robusta coffee farmers and extension officers in Uganda through farm records, weather information, BCTB risk screening and agricultural guidance.",
  },
  {
    question: "Does AgriSense diagnose Black Coffee Twig Borer?",
    answer:
      "No. AgriSense provides risk screening and early-warning information. A screening result is not confirmation of an infestation. Physical verification by an agricultural extension officer may be necessary.",
  },
  {
    question: "Who can use the platform?",
    answer:
      "The platform is designed for Robusta coffee farmers, farm managers and agricultural extension officers, with administrative access for authorised platform personnel.",
  },
  {
    question: "Does AgriSense provide agricultural advice?",
    answer:
      "AgriSense AI provides agricultural education and practical, non-chemical coffee management guidance. It does not replace professional field inspection or extension services.",
  },
];

export default function PublicLanding({
  onSignIn,
  onRegister,
}: {
  onSignIn: () => void;
  onRegister: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appQrCode, setAppQrCode] = useState("");
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/`;
    setAppUrl(url);
    void QRCode.toDataURL(url, {
      width: 192,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#173b2d", light: "#ffffff" },
    }).then(setAppQrCode).catch((error: unknown) => {
      console.error("Could not generate the AgriSense access QR code.", error);
    });
  }, []);

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

  useEffect(() => {
    document.body.style.overflow = activeVideo ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeVideo]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <main className="public-site">
      {/* HERO */}
      <section className="landing-hero">
        <div
          key={coffeeImages[activeImage]}
          className="landing-photo"
          aria-hidden="true"
          style={{
            backgroundImage: `url("/images/${coffeeImages[activeImage]}")`,
          }}
        />

        <div className="landing-hero-shade" />

        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="#top" onClick={closeMenu}>
            <span className="brand-mark">A</span>
            <span className="brand-name">
              AgriSense
              <small>UGANDA</small>
            </span>
          </a>

          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`landing-nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <a href="#platform" onClick={closeMenu}>Platform</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#faq" onClick={closeMenu}>FAQs</a>

            <button
              className="nav-signin"
              onClick={() => {
                closeMenu();
                onSignIn();
              }}
            >
              Sign in
            </button>

            <button
              className="nav-register"
              onClick={() => {
                closeMenu();
                onRegister();
              }}
            >
              Create account <span>↗</span>
            </button>
          </div>
        </nav>

        <div id="top" className="landing-hero-content">
          <div className="landing-copy">
            <div className="landing-eyebrow">
              <i />
              ROBUSTA COFFEE INTELLIGENCE · UGANDA
            </div>

            <h1>
              Better insight.
              <br />
              Healthier coffee
              <br />
              <span>farms.</span>
            </h1>

            <p>
              Bringing farm observations, local weather and explainable AI
              together to help Robusta coffee farmers understand Black Coffee
              Twig Borer risk and make informed farm-management decisions.
            </p>

            <div className="landing-ctas">
              <button className="landing-primary" onClick={onRegister}>
                Explore AgriSense <span>→</span>
              </button>

              <button
                className="landing-secondary"
                onClick={() => setActiveVideo(videoIds[0])}
              >
                <span className="play-icon">▶</span>
                Watch field demo
              </button>
            </div>

            {appQrCode && <div className="landing-access-qr">
              <img src={appQrCode} alt="QR code to open the AgriSense system" />
              <div>
                <span className="landing-access-qr-kicker">AGRISENSE PLATFORM</span>
                <strong>Scan to access the system</strong>
                <a href={appUrl} target="_blank" rel="noreferrer">{appUrl}</a>
                <a className="landing-access-qr-download" href={appQrCode} download="agrisense-access-qr.png">Download QR code</a>
              </div>
            </div>}

            <div className="landing-trust">
              <span>✳</span>
              Supporting informed decisions in Robusta coffee farming
            </div>
          </div>

          <LiveRiskDemo onOpenVideo={setActiveVideo} />
        </div>

        <div className="hero-bottomline">
          <span>FIELD INTELLIGENCE FOR ROBUSTA COFFEE</span>

          <div className="hero-image-dots" aria-label="Choose background photo">
            {coffeeImages.map((image, index) => (
              <button
                key={image}
                className={index === activeImage ? "active" : ""}
                onClick={() => setActiveImage(index)}
                aria-label={`Show coffee photo ${index + 1}`}
                aria-pressed={index === activeImage}
              />
            ))}
          </div>

          <span>MADE FOR UGANDA</span>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section id="about" className="landing-intro">
        <div className="intro-label">
          <span className="section-kicker">A CLEARER VIEW OF YOUR COFFEE FARM</span>
          <span className="intro-line" />
        </div>

        <div className="intro-content">
          <h2>
            Understand your farm.
            <br />
            <span>Act with better insight.</span>
          </h2>

          <p>
            Robusta coffee farming depends on good observation and timely
            decisions. AgriSense brings useful farm information into one
            practical digital workspace, connecting farmers with tools and
            guidance that support everyday farm management.
          </p>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section id="platform" className="landing-platform">
        <div className="platform-heading">
          <div className="section-kicker">THE AGRISENSE PLATFORM</div>
          <h2>
            From field signals
            <br />
            to informed decisions.
          </h2>
          <p>
            Practical digital tools for the people who grow, monitor and
            support Uganda's Robusta coffee.
          </p>
        </div>

        <div className="platform-features">
          {features.map((feature) => (
            <article className="platform-feature" key={feature.number}>
              <div className="feature-top">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">{feature.number}</span>
              </div>

              <small>{feature.label}</small>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-bottom-line" />
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="landing-how">
        <div
          className="how-photo"
          role="img"
          aria-label="Robusta coffee cherries growing among coffee leaves"
        >
          <div className="how-photo-caption">
            <span>ROBUSTA COFFEE</span>
            <strong>Knowledge starts in the field.</strong>
          </div>
        </div>

        <div className="how-copy">
          <span className="section-kicker">A PRACTICAL FIELD WORKFLOW</span>

          <h2>
            Good decisions start
            <br />
            with what you observe.
          </h2>

          <p className="how-description">
            Turn everyday farm observations into organised information
            that supports better monitoring and follow-up.
          </p>

          <ol>
            <li>
              <b>01</b>
              <span>
                <strong>Record a field observation</strong>
                <small>
                  Capture visible symptoms and relevant farm conditions.
                </small>
              </span>
            </li>

            <li>
              <b>02</b>
              <span>
                <strong>Review the risk signals</strong>
                <small>
                  Understand how recorded observations and conditions
                  influence the screening result.
                </small>
              </span>
            </li>

            <li>
              <b>03</b>
              <span>
                <strong>Choose a practical next step</strong>
                <small>
                  Review non-chemical management guidance or coordinate
                  field verification with an extension officer.
                </small>
              </span>
            </li>
          </ol>

          <button className="landing-primary" onClick={onRegister}>
            Get started with AgriSense <span>→</span>
          </button>
        </div>
      </section>

      {/* RESPONSIBLE SCREENING */}
      <section className="landing-responsible">
        <div className="responsible-icon">✳</div>
        <div>
          <span className="section-kicker">RESPONSIBLE FARM INTELLIGENCE</span>
          <h2>Screening supports decisions. It does not replace field diagnosis.</h2>
          <p>
            AgriSense provides risk-screening information and agricultural
            education. Where physical confirmation is needed, farmers should
            seek verification from an agricultural extension officer.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="landing-faq">
        <div className="faq-heading">
          <span className="section-kicker">QUESTIONS AND ANSWERS</span>
          <h2>
            Get to know
            <br />
            AgriSense.
          </h2>
          <p>
            Learn about the platform, its purpose and how it supports
            Robusta coffee farm management.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question} className="faq-item">
              <summary>
                {faq.question}
                <span>+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="landing-final-cta">
        <div className="final-cta-content">
          <span className="section-kicker">YOUR COFFEE FARM, BETTER INFORMED</span>
          <h2>
            Bring your coffee
            <br />
            farm information together.
          </h2>
          <p>
            Explore a digital workspace designed around Robusta coffee
            farming and BCTB risk monitoring in Uganda.
          </p>
          <button className="landing-primary" onClick={onRegister}>
            Create your AgriSense account <span>→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-main">
          <a className="landing-brand" href="#top">
            <span className="brand-mark">A</span>
            <span className="brand-name">
              AgriSense
              <small>UGANDA</small>
            </span>
          </a>

          <p>
            Explainable agricultural intelligence
            <br />
            for Robusta coffee farming.
          </p>

          <div className="footer-links">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQs</a>
            <button onClick={onSignIn}>Sign in</button>
          </div>

          <button className="footer-register" onClick={onRegister}>
            Create account <span>↗</span>
          </button>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AgriSense Uganda</span>
          <span>Built around Uganda's Robusta coffee sector.</span>
        </div>
      </footer>

      {/* VIDEO MODAL */}
      {activeVideo && (
        <div
          className="video-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveVideo(null);
            }
          }}
        >
          <section
            className="video-modal"
            role="dialog"
            aria-modal="true"
            aria-label="AgriSense field video"
          >
            <button
              className="video-modal-close"
              onClick={() => setActiveVideo(null)}
              aria-label="Close video"
            >
              ×
            </button>

            <div className="video-modal-player">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="AgriSense coffee field demonstration video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            <div className="video-modal-switcher">
              <button
                className={activeVideo === videoIds[0] ? "selected" : ""}
                onClick={() => setActiveVideo(videoIds[0])}
              >
                Field demo 01
              </button>
              <button
                className={activeVideo === videoIds[1] ? "selected" : ""}
                onClick={() => setActiveVideo(videoIds[1])}
              >
                Field demo 02
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function LiveRiskDemo({
  onOpenVideo,
}: {
  onOpenVideo: (videoId: string) => void;
}) {
  const [previousOutbreak, setPreviousOutbreak] = useState(false);
  const [rainyWeek, setRainyWeek] = useState(false);
  const [twigSymptoms, setTwigSymptoms] = useState(false);

  const score =
    (previousOutbreak ? 30 : 0) +
    (rainyWeek ? 20 : 0) +
    (twigSymptoms ? 10 : 0);

  const risk =
    score >= 50 ? "HIGH" : score >= 30 ? "MODERATE" : "LOW";

  const riskLabel =
    risk === "HIGH"
      ? "More signals selected"
      : risk === "MODERATE"
        ? "Some signals selected"
        : "Fewer signals selected";

  const signals = [
    {
      label: "Previous BCTB outbreak",
      active: previousOutbreak,
      toggle: () => setPreviousOutbreak(!previousOutbreak),
    },
    {
      label: "Heavy rain this week",
      active: rainyWeek,
      toggle: () => setRainyWeek(!rainyWeek),
    },
    {
      label: "Pinholes or twig damage",
      active: twigSymptoms,
      toggle: () => setTwigSymptoms(!twigSymptoms),
    },
  ];

  return (
    <aside
      id="live-preview"
      className="demo-preview"
      aria-label="Illustrative BCTB risk explorer"
    >
      <div className="demo-preview-head">
        <span className="demo-live-dot" />
        <span>INTERACTIVE RISK EXPLORER</span>
        <small>ILLUSTRATIVE</small>
      </div>

      <h2>Explore your field signals.</h2>

      <p className="demo-preview-intro">
        Select observations below to explore an example of how farm signals
        can be presented in an early-warning screening.
      </p>

      <div className="demo-signals">
        {signals.map(({ label, active, toggle }) => (
          <button
            key={label}
            className={`demo-signal ${active ? "selected" : ""}`}
            onClick={toggle}
            aria-pressed={active}
          >
            <span className="signal-check">{active ? "✓" : "+"}</span>
            {label}
          </button>
        ))}
      </div>

      <div className={`demo-result risk-${risk.toLowerCase()}`}>
        <div>
          <span className="demo-result-label">EXAMPLE SIGNAL SUMMARY</span>
          <strong>{riskLabel}</strong>
          <small>{score} / 60 illustrative points</small>
        </div>

        <div
          className="demo-gauge"
          style={{ "--score": `${(score / 60) * 100}%` } as CSSProperties}
          aria-label={`${score} illustrative points`}
        >
          <span>{score}</span>
        </div>
      </div>

      <div className="demo-preview-foot">
        <span>Not a validated model prediction or field diagnosis.</span>
      </div>

      <div className="demo-video-section">
        <div className="demo-video-heading">
          <span>EXPLORE COFFEE FIELD VIDEOS</span>
          <small>VIDEO RESOURCES</small>
        </div>

        <div className="demo-video-grid">
          {videoIds.map((id, index) => (
            <button
              type="button"
              key={id}
              onClick={() => onOpenVideo(id)}
              aria-label={`Play coffee field video ${index + 1}`}
            >
              <img
                src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                alt={`Coffee field video ${index + 1} thumbnail`}
                loading="lazy"
              />
              <span className="video-play">▶</span>
              <small>Field video 0{index + 1}</small>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
