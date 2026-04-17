"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const ECGLine = dynamic(() => import("@/components/ECGLine"), { ssr: false });
const VesselAnimation = dynamic(
  () => import("@/components/VesselAnimation"),
  { ssr: false }
);

const SLIDES = [
  { id: "cover", label: "Cover" },
  { id: "vessel", label: "PWV & Arterial Stiffness" },
  { id: "pathway", label: "Arterial Stiffness → AF" },
  { id: "evidence", label: "Evidence" },
  { id: "table", label: "Table" },
  { id: "faq", label: "FAQ" },
  { id: "sources", label: "Sources" },
];

const evidenceSections = [
  {
    title: "Central vs Peripheral PWV",
    color: "#f4a261",
    paragraphs: [
      "Interestingly, a prospective cohort study demonstrated a U-shaped relationship between carotid-femoral PWV (cfPWV) and incident AF. Risk was elevated in both low and high stiffness quartiles compared with intermediate levels (HR range 1.49–1.59 across extreme quartiles), demonstrating that central arterial stiffness specifically was associated with AF risk [22].",
      "In pooled analysis across three major population-based cohorts (ARIC, MESA, and the Rotterdam Study; combined n > 25,000), higher aortic PWV (aPWV) was independently associated with incident AF even after adjustment for carotid intima-media thickness, with adjusted hazard ratios of approximately 1.2 to 1.3 per standard deviation increase in aPWV, indicating that the association between arterial stiffness and AF incidence was independent of structural atherosclerosis [23].",
      "In a cross-sectional case-control study (n = 151), patients with paroxysmal and persistent AF exhibited significantly higher cfPWV compared with age-matched controls (8.0 vs 7.2 m/s, p < 0.001), suggesting increased central arterial stiffness in individuals with AF [27].",
      "In patients with paroxysmal AF (n = 108), cfPWV was significantly elevated compared with healthy controls (p < 0.05) and was accompanied by impaired ventricular-arterial coupling, reflecting early structural and functional cardiovascular remodeling [29].",
    ],
  },
  {
    title: "Predictive vs Prognostic Value",
    color: "#2a9d8f",
    paragraphs: [
      "Several large prospective and population-based studies evaluated PWV as a predictor of incident or new-onset AF (NOAF). In the Kailuan Study (n = 49,872), higher brachial-ankle PWV (baPWV) was independently associated with increased risk of NOAF. Participants in the highest arterial stiffness quartile exhibited approximately two-fold higher hazard of developing AF compared with those in the lowest quartile (adjusted HR ≈ 2.0, p < 0.001) [20].",
      "In a large Chinese cohort followed for 11 years (n = 96,561), estimated PWV (ePWV) was a significant predictor of incident AF, with each 1 m/s increase in ePWV associated with a 14% higher risk of AF (HR 1.14, 95% CI 1.10–1.18, p < 0.001) [21].",
      "In patients with systolic heart failure (n = 77), higher baseline aPWV was associated with increased incidence of NOAF during follow-up. Patients who developed AF exhibited significantly higher baseline aPWV compared with those who did not (7.1 ± 2.6 vs 5.3 ± 1.9 m/s, p = 0.004) [24].",
      "In contrast, findings from the Framingham Heart Study (n = 5,797) demonstrated that cfPWV was not independently associated with incident AF after full multivariable adjustment (p = 0.18), although other vascular measures including augmentation index (HR 1.16) and central pulse pressure (HR 1.14) remained significantly associated [25].",
      "In patients with AF (n = 167), higher baPWV independently predicted adverse cardiovascular outcomes including stroke and all-cause mortality. Each standard deviation increase in baPWV was associated with approximately 15% higher risk of adverse events (adjusted HR 1.152, 95% CI 1.054–1.259, p = 0.002) [39].",
      "In AF-related stroke patients (n = 30), cfPWV demonstrated a strong positive correlation with CHA₂DS₂-VASc score (r = 0.672, p < 0.001), indicating that greater arterial stiffness was associated with higher thromboembolic risk profiles [40].",
    ],
  },
  {
    title: "Bidirectional Relationship",
    color: "#9b5de5",
    paragraphs: [
      "Among hypertensive patients (n = 268), baPWV was significantly higher in those with AF compared with those without AF (1945 ± 477 vs 1695 ± 384 cm/s, p < 0.001). Patients with persistent AF demonstrated higher baPWV than those with paroxysmal AF (p < 0.05), indicating a potential relationship between arterial stiffness and AF chronicity [28].",
      "In contrast, among patients with heart failure with preserved ejection fraction (HFpEF; n = 52), PWV did not differ significantly between those with permanent AF and those in sinus rhythm (p = 0.52), suggesting the association may be context-dependent in advanced cardiometabolic disease [30].",
      "In patients experiencing a first episode of nonvalvular AF (n = 34), PWV values at baseline and at 12-month follow-up were not significantly different from those observed in healthy controls (10.2 ± 2.5 vs 9.7 ± 2.1 m/s, p = 0.37), indicating arterial stiffness may not be elevated in early or isolated AF presentations [31].",
      "In a retrospective study of ischemic stroke patients (n = 2,738), individuals classified as having early vascular aging based on elevated baPWV demonstrated a significantly higher prevalence of AF compared with those with normal vascular aging profiles (35.8% vs 19.7%, p < 0.001) [32].",
    ],
  },
  {
    title: "Stress-Triggered / Postoperative AF",
    color: "#e63946",
    paragraphs: [
      "In patients undergoing off-pump coronary artery bypass grafting (n = 164), elevated baPWV (>19 m/s) in combination with elevated left ventricular filling pressure (E/e′ >15) was strongly associated with the development of postoperative AF (POAF). The combined presence of both abnormalities was associated with a markedly increased risk of POAF (adjusted OR 12.5, 95% CI 2.5–63.8, p = 0.002) [36].",
      "In a prospective observational study (n = 110), patients who developed POAF exhibited significantly higher aortic PWV compared with those who did not (9.4 ± 1.2 vs 8.6 ± 1.3 m/s, p = 0.006), with an aPWV threshold >9.5 m/s demonstrating modest discriminative ability for POAF (AUC 0.668) [37].",
      "In a model of acute intravascular volume expansion, higher baseline cfPWV predicted short-term adverse outcomes, including new-onset atrial fibrillation (NOAF) [38].",
    ],
  },
  {
    title: "Context-Dependent Utility",
    color: "#457b9d",
    paragraphs: [
      "In a prospective clinical study of patients with paroxysmal AF (n = 104), higher aPWV was significantly associated with more frequent AF recurrences, with an aPWV threshold >10.0 m/s emerging as a strong independent predictor of recurrence frequency (p < 0.001) [33].",
      "In contrast, among patients undergoing pulmonary vein isolation for paroxysmal AF (n = 44), cfPWV did not differ significantly between those who experienced AF recurrence and those who remained in sinus rhythm during follow-up (p = 0.91), indicating no association between arterial stiffness and post-ablation recurrence [34].",
      "In an electrophysiology laboratory study (n = 87), cfPWV was not associated with AF inducibility. Instead, endothelial dysfunction, as assessed by flow-mediated dilation (FMD), was the primary predictor of induced AF (OR 0.853 per unit decrease in FMD) [35].",
    ],
  },
  {
    title: "Measurements & Research Gap",
    color: "#a8dadc",
    paragraphs: [
      "PWV measurements obtained during AF were slightly higher and more variable compared with measurements during sinus rhythm following cardioversion. For cfPWV, mean values were higher during AF than sinus rhythm (9.3 ± 1.8 vs 8.5 ± 1.6 m/s, p < 0.001), although single-site PWV measurements remained comparable between rhythms [42].",
      "In a proof-of-concept interventional study (n = 34), cfPWV decreased significantly following successful cardioversion from AF to sinus rhythm (11.8 to 10.7 m/s), and PWV measurements demonstrated excellent reproducibility (intraclass correlation coefficient 0.89), supporting the reliability of PWV assessment in AF [43].",
      "In a longitudinal study evaluating anticoagulation therapy (n = 21), switching from warfarin to rivaroxaban was associated with significant reductions in both augmentation index and baPWV after 6 months (p = 0.03) [44].",
      "In a multicenter randomized controlled trial involving hemodialysis patients with AF (n = 132), PWV changes over 18 months did not differ significantly between anticoagulation treatment strategies (p = 0.29), indicating no measurable effect of anticoagulant choice on arterial stiffness in advanced vascular disease states [45].",
    ],
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    y: (dir || 1) > 0 ? 40 : -40,
  }),
  center: { opacity: 1, y: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    y: (dir || 1) > 0 ? -40 : 40,
  }),
};

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mounted, setMounted] = useState(false);
  const currentRef = useRef(0);
  const cooldownRef = useRef(false);
  const touchStartRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const navigateTo = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(target, SLIDES.length - 1));
    if (clamped === currentRef.current) return;
    setDirection(clamped > currentRef.current ? 1 : -1);
    setCurrent(clamped);
    currentRef.current = clamped;
  }, []);

  const navigateDelta = useCallback(
    (delta: number) => navigateTo(currentRef.current + delta),
    [navigateTo]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        navigateDelta(1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigateDelta(-1);
      }
    };

    const canScrollInside = (el: HTMLElement, direction: number): boolean => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 2;
      if (!hasOverflow) return false;
      if (direction > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      return el.scrollTop > 2;
    };

    const onWheel = (e: WheelEvent) => {
      const t = e.target as HTMLElement;
      const scrollEl = t.closest(".slide-scroll") as HTMLElement | null;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (scrollEl && canScrollInside(scrollEl, dir)) return;
      e.preventDefault();
      if (cooldownRef.current || Math.abs(e.deltaY) < 25) return;
      cooldownRef.current = true;
      navigateDelta(dir);
      setTimeout(() => {
        cooldownRef.current = false;
      }, 1000);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchStartRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      const dir = delta > 0 ? 1 : -1;
      const t = e.target as HTMLElement;
      const scrollEl = t.closest(".slide-scroll") as HTMLElement | null;
      if (scrollEl && canScrollInside(scrollEl, dir)) return;
      navigateDelta(dir);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigateDelta]);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[var(--background)]">
      {/* ── Top progress bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-[rgba(255,255,255,0.03)]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#e63946] to-[#457b9d]"
          animate={{ width: `${((current + 1) / SLIDES.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* ── Desktop side dots ── */}
      <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => navigateTo(i)}
            className="group flex items-center gap-3 outline-none"
          >
            <span
              className={`text-[11px] font-medium tracking-[0.12em] uppercase transition-all duration-300 ${
                current === i
                  ? "opacity-100 text-[rgba(232,232,240,0.8)]"
                  : "opacity-0 group-hover:opacity-100 text-[rgba(232,232,240,0.35)]"
              }`}
            >
              {slide.label}
            </span>
            <div
              className={`rounded-full transition-all duration-300 ${
                current === i
                  ? "w-3 h-3 bg-[#e63946] shadow-[0_0_10px_rgba(230,57,70,0.4)]"
                  : "w-[7px] h-[7px] bg-[rgba(232,232,240,0.12)] group-hover:bg-[rgba(232,232,240,0.35)]"
              }`}
            />
          </button>
        ))}
      </nav>

      {/* ── Mobile bottom dots ── */}
      <div className="fixed bottom-3 left-0 right-0 z-50 flex md:hidden items-center justify-center gap-2.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => navigateTo(i)}
            className="outline-none p-1"
            aria-label={slide.label}
          >
            <div
              className={`rounded-full transition-all duration-300 ${
                current === i
                  ? "w-2.5 h-2.5 bg-[#e63946]"
                  : "w-[6px] h-[6px] bg-[rgba(232,232,240,0.15)]"
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Desktop bottom bar ── */}
      <div className="fixed bottom-5 left-0 right-0 z-50 hidden md:flex items-center justify-between px-6">
        <span className="text-[11px] text-[rgba(232,232,240,0.12)] tracking-[0.15em] font-mono">
          {String(current + 1).padStart(2, "0")} — {String(SLIDES.length).padStart(2, "0")}
        </span>
        <span className="text-[11px] text-[rgba(232,232,240,0.14)] tracking-wider">
          Use your scroll wheel, arrow keys, or click the dots on the right to navigate between sections
        </span>
      </div>

      {/* ── Slides ── */}
      {mounted ? (
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {current === 0 && <CoverSlide />}
            {current === 1 && <VesselSlide />}
            {current === 2 && <PathwaySlide />}
            {current === 3 && <EvidenceSlide />}
            {current === 4 && <TableSlide />}
            {current === 5 && <FAQSlide />}
            {current === 6 && <SourcesSlide />}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0">
          <CoverSlide />
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SLIDE 0 — COVER
   ================================================================ */
function CoverSlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col items-center justify-between px-5 md:px-6 py-10 md:py-14 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(230,57,70,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_25%_60%,rgba(69,123,157,0.03)_0%,transparent_50%)]" />

        {/* ─ Top spacer for vertical centering balance ─ */}
        <div className="flex-1" />

        {/* ─ Main content ─ */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-[rgba(230,57,70,0.07)] border border-[rgba(230,57,70,0.12)] mb-6 md:mb-8">
            <span className="w-[6px] h-[6px] rounded-full bg-[#e63946] pulse-dot-sm" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e63946]">
              Scoping Review
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[0.92] tracking-tight mb-3 md:mb-4">
            <span className="gradient-text block">Pulse Wave</span>
            <span className="gradient-text block">Velocity</span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-4xl font-light text-[rgba(232,232,240,0.85)] mb-1 md:mb-2 tracking-tight">
            in <span className="gradient-text-blue font-bold">Atrial Fibrillation</span>
          </p>

          <p className="text-sm md:text-base text-[rgba(232,232,240,0.35)] mb-5 md:mb-6 tracking-wide">
            Clinical Significance and Current Evidence
          </p>

          <div className="max-w-xs mx-auto mb-5 md:mb-7 opacity-60">
            <ECGLine />
          </div>

          {/* Authors */}
          <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-3 gap-y-1 text-[13px] text-[rgba(232,232,240,0.5)] mb-2">
            {["Oren Nedjar, B.S.¹", "Zaneh Kahook, B.S.¹", "Syed Maaz Shah, B.S.²", "Christos G. Mihos, D.O.³", "Marc Kesselman, D.O.¹"].map(
              (a, i, arr) => (
                <span key={i}>
                  {a}
                  {i < arr.length - 1 && (
                    <span className="ml-1 md:ml-2 text-[rgba(232,232,240,0.15)]">·</span>
                  )}
                </span>
              )
            )}
          </div>

          {/* Affiliations */}
          <p className="text-[11px] text-[rgba(232,232,240,0.25)] leading-relaxed max-w-xl mx-auto hidden sm:block">
            ¹ Nova Southeastern University Dr. Kiran C. Patel College of Osteopathic Medicine ·{" "}
            ² Kansas City College of Osteopathic Medicine ·{" "}
            ³ Division of Cardiology, Mount Sinai Medical Center, Miami Beach, FL
          </p>
          <p className="text-[11px] text-[rgba(232,232,240,0.25)] leading-relaxed sm:hidden">
            ¹ NSU KPCOM · ² Kansas City COM · ³ Mount Sinai, Miami Beach
          </p>

          {/* Award callout */}
          <p className="mt-4 md:mt-5 text-[12px] text-[rgba(232,232,240,0.35)] italic">
            Previously presented and awarded at the FIU Translational Research Conference
          </p>

          {/* Supplemental note */}
          <p className="mt-4 md:mt-5 text-[12px] text-[rgba(232,232,240,0.32)] leading-relaxed max-w-lg mx-auto">
            This website is a supplemental academic companion to the poster presented. It is intended
            to provide expanded mechanistic context, supporting evidence, and anticipated
            discussion points for viewers who wish to explore the topic in greater depth. It is
            best experienced alongside the printed poster.
          </p>
        </div>

        {/* ─ Bottom spacer ─ */}
        <div className="flex-1" />

        {/* ─ Contact footer ─ */}
        <div className="relative z-10 w-full max-w-lg mx-auto text-center pt-6 md:pt-8 border-t border-[rgba(232,232,240,0.06)]">
          <p className="text-[12px] text-[rgba(232,232,240,0.3)] mb-3">
            Open to collaboration and research connections in cardiovascular medicine.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:on68@mynsu.nova.edu"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[12px] text-[rgba(232,232,240,0.45)] hover:text-[rgba(232,232,240,0.7)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
            >
              <span>✉</span> on68@mynsu.nova.edu
            </a>
            <a
              href="http://www.linkedin.com/in/oren-nedjar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[12px] text-[rgba(232,232,240,0.45)] hover:text-[rgba(232,232,240,0.7)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
            >
              <span>in</span> LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 1 — VESSEL DYNAMICS
   ================================================================ */
function VesselSlide() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-2 md:px-6 relative">
      <div className="text-center mb-2 md:mb-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[rgba(232,232,240,0.25)] mb-1">
          Mechanistic Model
        </p>
        <h2 className="text-sm md:text-xl font-bold mb-0.5 md:mb-1 text-[rgba(232,232,240,0.9)]">
          How does <span className="gradient-text-blue">PWV</span> help us assess{" "}
          <span className="gradient-text">arterial stiffness</span>?
        </h2>
        <p className="text-[12px] text-[rgba(232,232,240,0.3)] hidden sm:block">
          Compliant vessel → wall deforms → energy absorbed → slow wave &nbsp;|&nbsp;
          Stiff vessel → minimal deformation → fast wave
        </p>
      </div>

      <div className="w-full max-w-5xl vessel-canvas-wrap">
        <VesselAnimation compact />
      </div>

      {/* cfPWV Measurement Scheme */}
      <div className="mt-2 md:mt-3 flex items-center gap-4 md:gap-8">
        <div className="flex items-center gap-2 md:gap-3">
          <svg
            viewBox="0 0 60 120"
            className="w-8 md:w-10 h-16 md:h-20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Simplified body / aortic path */}
            <circle cx="30" cy="8" r="5" stroke="rgba(232,232,240,0.3)" strokeWidth="1" fill="none" />
            <line x1="30" y1="13" x2="30" y2="65" stroke="rgba(232,232,240,0.2)" strokeWidth="1.5" />
            <line x1="30" y1="65" x2="18" y2="110" stroke="rgba(232,232,240,0.15)" strokeWidth="1" />
            <line x1="30" y1="65" x2="42" y2="110" stroke="rgba(232,232,240,0.15)" strokeWidth="1" />
            {/* Point A — Carotid */}
            <circle cx="30" cy="22" r="3" fill="#e63946" />
            <text x="42" y="25" fill="#e88080" fontSize="7" fontFamily="Inter, sans-serif" fontWeight="bold">A</text>
            {/* Point B — Femoral */}
            <circle cx="30" cy="68" r="3" fill="#457b9d" />
            <text x="42" y="71" fill="#5dade2" fontSize="7" fontFamily="Inter, sans-serif" fontWeight="bold">B</text>
            {/* ΔL arrow */}
            <line x1="10" y1="24" x2="10" y2="66" stroke="rgba(232,232,240,0.35)" strokeWidth="0.8" markerStart="url(#arrowUp)" markerEnd="url(#arrowDown)" />
            <text x="3" y="48" fill="rgba(232,232,240,0.4)" fontSize="6" fontFamily="Inter, sans-serif">ΔL</text>
            <defs>
              <marker id="arrowUp" markerWidth="4" markerHeight="4" refX="2" refY="4" orient="auto">
                <path d="M0,4 L2,0 L4,4" fill="none" stroke="rgba(232,232,240,0.35)" strokeWidth="0.5" />
              </marker>
              <marker id="arrowDown" markerWidth="4" markerHeight="4" refX="2" refY="0" orient="auto">
                <path d="M0,0 L2,4 L4,0" fill="none" stroke="rgba(232,232,240,0.35)" strokeWidth="0.5" />
              </marker>
            </defs>
          </svg>
          <div className="text-left">
            <p className="text-[11px] text-[rgba(232,232,240,0.3)] leading-relaxed">
              <span className="text-[#e88080] font-semibold">A</span> = Carotid artery &nbsp;
              <span className="text-[#5dade2] font-semibold">B</span> = Femoral artery
            </p>
            <p className="text-[12px] text-[rgba(232,232,240,0.5)] font-mono mt-0.5">
              cfPWV = ΔL / Δt
            </p>
            <p className="text-[10px] text-[rgba(232,232,240,0.2)] mt-0.5">
              Probe placement determines PWV type (e.g. cfPWV, baPWV)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 3 — MECHANISTIC MODEL 2: AS → AF PATHWAY
   ================================================================ */

const pathwaySteps = [
  {
    num: "1",
    title: "Arterial Stiffness Increases",
    detail:
      "Vascular aging, hypertension, and metabolic risk factors reduce arterial compliance. The vessel wall becomes rigid with loss of elastin and increased collagen/calcification.",
    color: "#e63946",
    image: "/vessel-cross-section.png",
    imageAlt: "Stiffened vessel cross-section with plaque",
  },
  {
    num: "2",
    title: "Early Wave Reflection",
    detail:
      "The pressure wave reaches peripheral resistance sites faster in a stiff vessel. Maximum resistance is met earlier, so the reflected wave returns sooner toward the heart.",
    color: "#f4a261",
  },
  {
    num: "3",
    title: "Reflected Wave Returns During Diastole",
    detail:
      "In healthy arteries, the reflected wave arrives during systole (contraction) and assists coronary perfusion. In stiff arteries, it arrives during diastole (relaxation), augmenting late systolic pressure.",
    color: "#2a9d8f",
  },
  {
    num: "4",
    title: "Impaired LV Relaxation → LA Pressure ↑",
    detail:
      "The left ventricle (LV) relaxes less efficiently under augmented pressure. Less blood flows from the left atrium (LA) to the LV during diastole, increasing blood retention and chronic pressure/stretch on the LA.",
    color: "#457b9d",
  },
  {
    num: "5",
    title: "LA Remodeling & Fibrosis",
    detail:
      "Chronic pressure overload causes the left atrium to dilate and undergo structural remodeling. Fibroblasts deposit excess collagen, creating a fibrotic substrate that disrupts normal electrical conduction.",
    color: "#9b5de5",
    image: "/la-fibrosis.png",
    imageAlt: "Left atrial fibrosis — detection and treatment",
  },
  {
    num: "6",
    title: "Ectopic Foci → Atrial Fibrillation",
    detail:
      "Fibrotic tissue creates re-entry circuits and triggers abnormal electrical activity (ectopic foci). The result is the chaotic, irregular atrial contraction characteristic of AF.",
    color: "#e63946",
    image: "/normal-vs-af.png",
    imageAlt: "Normal sinus rhythm vs atrial fibrillation",
    hasVideo: true,
    hasECG: true,
  },
];

function PathwaySlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-10 py-10 md:py-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_30%,rgba(155,93,229,0.03)_0%,transparent_60%)]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 md:mb-6">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[rgba(232,232,240,0.25)] mb-1">
              Mechanistic Model 2
            </p>
            <h2 className="text-base md:text-xl font-bold text-[rgba(232,232,240,0.9)] mb-1.5">
              How does <span className="gradient-text">arterial stiffness</span> lead to{" "}
              <span className="gradient-text-blue">atrial fibrillation</span>?
            </h2>
            <p className="text-[11px] text-[rgba(232,232,240,0.28)] italic max-w-lg mx-auto">
              Proposed mechanistic pathway (supported by observational and mechanistic evidence)
            </p>
          </div>

          {/* Pathway — 2 rows of 3 on desktop, vertical on mobile */}
          <div className="hidden md:block">
            {/* Row 1: Steps 1-3 */}
            <div className="flex items-stretch gap-0 mb-2">
              {pathwaySteps.slice(0, 3).map((step, i) => (
                <Fragment key={step.num}>
                  <PathwayCard step={step} />
                  {i < 2 && <PathwayArrow />}
                </Fragment>
              ))}
            </div>
            {/* Connecting arrow from row 1 to row 2 */}
            <div className="flex justify-end pr-[calc(16.67%-12px)] mb-2">
              <span className="text-[rgba(232,232,240,0.15)] text-lg">↓</span>
            </div>
            {/* Row 2: Steps 4-6 (reversed visually for flow) */}
            <div className="flex items-stretch gap-0">
              {pathwaySteps.slice(3, 6).map((step, i) => (
                <Fragment key={step.num}>
                  <PathwayCard step={step} />
                  {i < 2 && <PathwayArrow />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Mobile: vertical stack */}
          <div className="md:hidden space-y-1.5">
            {pathwaySteps.map((step, i) => (
              <Fragment key={step.num}>
                <PathwayCard step={step} />
                {i < pathwaySteps.length - 1 && (
                  <div className="flex justify-center">
                    <span className="text-[rgba(232,232,240,0.15)] text-sm">↓</span>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PathwayCard({
  step,
}: {
  step: (typeof pathwaySteps)[number];
}) {
  return (
    <div
      className="flex-1 p-2.5 md:p-3 rounded-xl relative overflow-hidden"
      style={{
        background: `${step.color}05`,
        border: `1px solid ${step.color}15`,
        borderLeft: `3px solid ${step.color}`,
      }}
    >
      <div className="flex items-start gap-2 mb-1">
        <span
          className="text-[12px] font-mono font-bold flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: `${step.color}18`, color: step.color }}
        >
          {step.num}
        </span>
        <h3
          className="text-[13px] font-semibold leading-tight"
          style={{ color: step.color }}
        >
          {step.title}
        </h3>
      </div>
      <p className="text-[11px] text-[rgba(232,232,240,0.42)] leading-relaxed pl-7">
        {step.detail}
      </p>
      {/* Thumbnail image */}
      {step.image && (
        <div className="mt-1.5 pl-7">
          <img
            src={step.image}
            alt={step.imageAlt}
            className="w-full max-w-[140px] h-auto rounded-md border border-[rgba(255,255,255,0.06)] opacity-80"
          />
        </div>
      )}
      {/* Video for AF step */}
      {step.hasVideo && (
        <div className="mt-1.5 pl-7">
          <video
            src="/What_is_Atrial_Fibrillation_Chapter_1_HRS_Patient_Video.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full max-w-[140px] h-auto rounded-md border border-[rgba(255,255,255,0.06)] opacity-70"
          />
        </div>
      )}
      {/* ECG strip for AF step */}
      {step.hasECG && (
        <div className="mt-1.5 pl-7 max-w-[160px] opacity-50">
          <ECGLine />
        </div>
      )}
    </div>
  );
}

function PathwayArrow() {
  return (
    <div className="flex items-center px-1 flex-shrink-0">
      <span className="text-[rgba(232,232,240,0.12)] text-sm">→</span>
    </div>
  );
}

/* ================================================================
   SLIDE 4 — EVIDENCE (ACCORDION)
   ================================================================ */
function EvidenceSlide() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col justify-center px-5 md:px-6 lg:px-14 py-10 md:py-8 relative">
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-5 md:mb-7">
            <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#e63946] to-[#a8dadc]" />
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-[rgba(232,232,240,0.95)]">
                Evidence Summary
              </h2>
              <p className="text-[11px] text-[rgba(232,232,240,0.25)] tracking-wider uppercase">
                Results & Discussion — click a section to expand
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {evidenceSections.map((section, i) => {
              const isOpen = openIdx === i;
              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden transition-colors"
                  style={{
                    background: isOpen ? `${section.color}08` : `${section.color}03`,
                    border: `1px solid ${isOpen ? section.color + "25" : section.color + "10"}`,
                  }}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 px-3.5 md:px-4 py-2.5 md:py-3 text-left outline-none group"
                  >
                    <div
                      className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-mono font-bold transition-colors"
                      style={{
                        background: isOpen ? section.color : `${section.color}18`,
                        color: isOpen ? "#050510" : section.color,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-[12px] md:text-[13px] font-semibold flex-1 transition-colors"
                      style={{ color: isOpen ? section.color : `${section.color}cc` }}
                    >
                      {section.title}
                    </span>
                    <span
                      className="text-[rgba(232,232,240,0.25)] text-sm transition-transform duration-200 flex-shrink-0"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3.5 md:px-4 pb-3.5 md:pb-4 pt-0">
                      <div className="pl-8 md:pl-9 space-y-2.5">
                        {section.paragraphs.map((para, j) => (
                          <p
                            key={j}
                            className="text-[12px] text-[rgba(232,232,240,0.45)] leading-relaxed"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 5 — FULL EVIDENCE TABLE
   ================================================================ */
const tableStudies = [
  { ref: "Song et al. 2024 [20]", title: "Association between brachial ankle pulse wave velocity and new-onset atrial fibrillation: Kailuan Study", afType: "Incident AF", pwv: "baPWV", sample: "N=49,872; mean age 51.6±12.4 years", findings: "Highest quartile vs lowest: HR ~2.0 (p<0.001); association stronger in non-hypertensive individuals and higher BMI", design: "Prospective cohort" },
  { ref: "Chen et al. 2022 [21]", title: "Estimated pulse wave velocity predicts new-onset atrial fibrillation", afType: "Incident AF", pwv: "ePWV", sample: "N=96,561; mean age 50.8±12.3 years; 11-year follow-up", findings: "Each 1 m/s increase in ePWV: HR 1.14 (95% CI 1.10–1.18, p<0.001); highest vs lowest quartile showed markedly higher cumulative incidence", design: "Prospective cohort" },
  { ref: "Almuwaqqat et al. 2021 [22]", title: "Association of arterial stiffness with incident atrial fibrillation", afType: "Incident AF", pwv: "cfPWV", sample: "N=3,882; mean age 75±5 years", findings: "U-shaped association: HR 1.49–1.59 for extreme quartiles vs second quartile; median follow-up 5.5 years", design: "Prospective cohort" },
  { ref: "Chen et al. 2016 [23]", title: "Carotid intima-media thickness, arterial stiffness and the risk of atrial fibrillation", afType: "Incident AF", pwv: "aPWV", sample: "N>25,000 (ARIC n=13,907; MESA n=6,640; Rotterdam n=5,220)", findings: "aPWV independently associated with incident AF (HR ~1.2–1.3 per SD) independent of carotid IMT", design: "Prospective cohort (pooled analysis)" },
  { ref: "Bonapace et al. 2016 [24]", title: "Echocardiographically derived PWV and diastolic dysfunction associated with increased AF incidence", afType: "Incident AF in systolic HF", pwv: "aPWV (echo-derived)", sample: "N=77; mean age 63±9 years", findings: "Higher aPWV in patients who developed AF (7.1±2.6 vs 5.3±1.9 m/s, p=0.004)", design: "Prospective cohort" },
  { ref: "Shaikh et al. 2016 [25]", title: "Relations of arterial stiffness and brachial FMD with new-onset AF: Framingham", afType: "Incident AF", pwv: "cfPWV", sample: "N=5,797; median follow-up 7.1 years", findings: "cfPWV not associated with AF after full adjustment (p=0.18); augmentation index (HR 1.16, p=0.02), central PP (HR 1.14, p=0.02), and FMD (HR 0.79, p=0.04) were significant", design: "Prospective cohort" },
  { ref: "Frary et al. 2024 [26]", title: "NT-proBNP and cardiovascular risk independent of arterial stiffness", afType: "Composite outcome (HF hospitalization or AF)", pwv: "cfPWV", sample: "N=1,872; mean age 69±8 years", findings: "cfPWV not independently associated with composite HF/AF outcome after adjustment (p>0.05)", design: "Population-based cohort" },
  { ref: "Pauklin et al. 2021 [27]", title: "Atrial fibrillation is associated with increased central blood pressure and arterial stiffness", afType: "Established AF (paroxysmal and persistent)", pwv: "cfPWV", sample: "N=151; age-matched (mean 62±9 years)", findings: "cfPWV higher in AF patients vs controls (8.0 vs 7.2 m/s, p<0.001)", design: "Cross-sectional case-control" },
  { ref: "Shi et al. 2016 [28]", title: "Factors influencing arterial stiffness in elderly hypertensive patients with AF", afType: "Established AF in hypertensive patients", pwv: "baPWV", sample: "N=268; mean age 75±7 years", findings: "baPWV higher in AF vs no AF (1945±477 vs 1695±384 cm/s, p<0.001); persistent AF had higher baPWV than paroxysmal (p<0.05)", design: "Cross-sectional" },
  { ref: "Gaczol et al. 2023 [29]", title: "Ventricular-arterial coupling in atrial fibrillation", afType: "Established paroxysmal AF", pwv: "cfPWV", sample: "N=108; paroxysmal AF patients", findings: "cfPWV elevated vs controls (p<0.05); impaired ventricular-arterial coupling", design: "Cross-sectional" },
  { ref: "Bosanac et al. 2022 [30]", title: "HFpEF and atrial fibrillation: Vascular and metabolic interplay", afType: "Established AF in HFpEF", pwv: "PWV (type not specified)", sample: "N=52; HFpEF patients", findings: "No significant PWV difference between permanent AF and sinus rhythm (p=0.52)", design: "Cross-sectional" },
  { ref: "Kilicgedik et al. 2017 [31]", title: "Left atrial mechanical function and aortic stiffness in first-episode AF", afType: "First-episode AF", pwv: "PWV (type not specified)", sample: "N=34; mean age 54±12 years", findings: "PWV not different from controls at baseline or 12-month follow-up (10.2±2.5 vs 9.7±2.1 m/s, p=0.37)", design: "Prospective observational" },
  { ref: "Han et al. 2024 [32]", title: "Early vascular aging determined by baPWV and ischemic stroke outcome", afType: "AF prevalence in stroke patients", pwv: "baPWV", sample: "N=2,738; median age 68 years", findings: "Early vascular aging associated with higher AF prevalence (35.8% vs 19.7%, p<0.001)", design: "Retrospective cohort" },
  { ref: "Kizilirmak et al. 2015 [33]", title: "Impact of aortic stiffness on paroxysmal atrial fibrillation recurrence", afType: "AF recurrence", pwv: "aPWV", sample: "N=104; paroxysmal AF patients", findings: "aPWV >10.0 m/s strong predictor of AF recurrence frequency (p<0.001)", design: "Prospective clinical study" },
  { ref: "Gaczol et al. 2024 [34]", title: "Predicting AF recurrence after pulmonary vein isolation", afType: "AF recurrence post-ablation", pwv: "cfPWV", sample: "N=44; paroxysmal AF undergoing PVI", findings: "cfPWV did not differ between recurrence and no recurrence groups (p=0.91)", design: "Prospective observational" },
  { ref: "Durak et al. 2024 [35]", title: "Association of induced atrial fibrillation with endothelial dysfunction", afType: "AF inducibility", pwv: "cfPWV", sample: "N=87; mean age 56±11 years", findings: "cfPWV not associated with AF inducibility; endothelial dysfunction (FMD) was primary predictor (OR 0.853)", design: "Cross-sectional" },
  { ref: "Choi et al. 2022 [36]", title: "Combined impact of elevated arterial stiffness and LV filling pressure on outcomes after OPCAB", afType: "Postoperative AF", pwv: "baPWV", sample: "N=164; mean age 65±9 years", findings: "Combined baPWV >19 m/s + E/e′ >15 strongly predicted POAF (OR 12.5, 95% CI 2.5–63.8, p=0.002)", design: "Prospective observational" },
  { ref: "Apaydin et al. 2023 [37]", title: "Could we predict postoperative atrial fibrillation with ambulatory oscillometry evaluating aortic stiffness?", afType: "Postoperative AF", pwv: "aPWV", sample: "N=110; mean age 62±9 years", findings: "Higher aPWV in POAF patients (9.4±1.2 vs 8.6±1.3 m/s, p=0.006); aPWV >9.5 m/s had AUC 0.668", design: "Prospective observational" },
  { ref: "Milan et al. 2020 [38]", title: "PWV and short-term outcomes after volume expansion", afType: "NOAF during acute hemodynamic stress", pwv: "cfPWV", sample: "N=41; pilot study", findings: "Higher baseline cfPWV associated with adverse outcomes including NOAF", design: "Pilot observational" },
  { ref: "Chen et al. 2016 [39]", title: "Association of brachial ankle pulse wave velocity with cardiovascular events in atrial fibrillation", afType: "Prognostic outcomes in established AF", pwv: "baPWV", sample: "N=167; mean age 71±11 years", findings: "baPWV independently predicted CV events (HR 1.152 per SD, 95% CI 1.054–1.259, p=0.002); median follow-up 26 months", design: "Prospective cohort" },
  { ref: "Akkaya et al. 2023 [40]", title: "Arterial stiffness and CHA₂DS₂-VASc score in AF-related stroke", afType: "AF-related stroke", pwv: "cfPWV", sample: "N=30; AF-related stroke patients", findings: "Strong correlation between cfPWV and CHA₂DS₂-VASc score (r=0.672, p<0.001)", design: "Cross-sectional" },
  { ref: "Szmigielski et al. 2016 [41]", title: "PWV correlates with aortic atherosclerosis in AF patients undergoing TEE", afType: "Aortic atherosclerosis in AF", pwv: "PWV (type not specified)", sample: "N=99; mean age 70.4±11.5 years", findings: "Higher PWV associated with advanced aortic atherosclerosis (p<0.0001)", design: "Cross-sectional" },
  { ref: "Lundwall et al. 2024 [42]", title: "Assessment of aortic stiffness during atrial fibrillation: Solutions and considerations", afType: "Measurement reliability in AF vs sinus rhythm", pwv: "cfPWV, single-site PWV", sample: "N=34; mean age 68±9 years", findings: "cfPWV higher during AF than sinus rhythm (9.3±1.8 vs 8.5±1.6 m/s, p<0.001); single-site PWV comparable between rhythms", design: "Observational cross-sectional" },
  { ref: "Caluwé et al. 2018 [43]", title: "Measurement of PWV in atrial fibrillation; effect of cardioversion", afType: "Measurement reliability; effect of cardioversion", pwv: "cfPWV", sample: "N=34; mean age 71±9 years", findings: "cfPWV decreased after cardioversion (11.8 to 10.7 m/s); excellent reproducibility (ICC 0.89)", design: "Proof-of-concept interventional" },
  { ref: "Namba et al. 2017 [44]", title: "Effects of switching from warfarin to rivaroxaban on arterial stiffness", afType: "Modifiability of PWV in AF", pwv: "baPWV", sample: "N=21; mean age 72±8 years", findings: "Switching to rivaroxaban reduced augmentation index and baPWV at 6 months (p=0.03)", design: "Longitudinal interventional" },
  { ref: "De Vriese et al. 2020 [45]", title: "The Valkyrie study", afType: "Modifiability of PWV by anticoagulation in hemodialysis AF patients", pwv: "cfPWV", sample: "N=132; mean age 71±10 years; hemodialysis patients", findings: "No difference in PWV changes over 18 months between anticoagulation strategies (p=0.29)", design: "Multicenter RCT" },
];

function TableSlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col px-3 md:px-6 lg:px-10 py-6 md:py-6 relative">
        <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3 md:mb-4 flex-shrink-0">
            <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#457b9d] to-[#a8dadc]" />
            <div>
              <h2 className="text-base md:text-xl font-bold text-[rgba(232,232,240,0.95)]">
                Table 1: Studies Included in the Review
              </h2>
              <p className="text-[10px] text-[rgba(232,232,240,0.25)] tracking-wider uppercase">
                Full evidence table — scroll horizontally and vertically to browse
              </p>
            </div>
          </div>

          {/* Table wrapper */}
          <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-[rgba(69,123,157,0.12)]">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[rgba(29,53,87,0.7)] backdrop-blur-sm">
                  {["Reference", "Title", "AF Subtype", "PWV Type", "Sample", "Key Findings", "Design"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-2.5 md:px-3 py-2 text-[10px] font-semibold text-[#a8dadc] tracking-[0.08em] uppercase border-b border-[rgba(69,123,157,0.2)] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableStudies.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(69,123,157,0.06)] transition-colors"
                  >
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[#a8dadc] font-semibold whitespace-nowrap align-top">
                      {s.ref}
                    </td>
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[rgba(232,232,240,0.5)] leading-snug align-top max-w-[200px]">
                      {s.title}
                    </td>
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[rgba(232,232,240,0.55)] align-top max-w-[120px]">
                      {s.afType}
                    </td>
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[#f4a261] font-medium whitespace-nowrap align-top">
                      {s.pwv}
                    </td>
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[rgba(232,232,240,0.45)] align-top max-w-[140px]">
                      {s.sample}
                    </td>
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[rgba(232,232,240,0.55)] leading-snug align-top max-w-[280px]">
                      {s.findings}
                    </td>
                    <td className="px-2.5 md:px-3 py-2 text-[11px] text-[rgba(232,232,240,0.35)] align-top whitespace-nowrap">
                      {s.design}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend / abbreviations */}
          <div className="mt-3 flex-shrink-0">
            <p className="text-[9px] text-[rgba(232,232,240,0.2)] leading-relaxed max-w-5xl">
              <span className="font-semibold text-[rgba(232,232,240,0.3)]">Abbreviations: </span>
              AF: atrial fibrillation, POAF: postoperative AF, PWV: pulse wave velocity, cfPWV: carotid-femoral PWV, aPWV: aortic PWV, baPWV: brachial-ankle PWV, ePWV: estimated PWV, BMI: body mass index, HF: heart failure, HFpEF: heart failure with preserved ejection fraction, FMD: flow-mediated dilation, E/e′: ratio of early mitral inflow velocity to mitral annular early diastolic velocity, CHA₂DS₂-VASc: congestive heart failure, hypertension, age ≥75, diabetes, stroke/TIA, vascular disease, age 65–74, sex category score, HR: hazard ratio, OR: odds ratio, CI: confidence interval, SD: standard deviation, ICC: intraclass correlation coefficient, AUC: area under the curve, CV: cardiovascular, PP: pulse pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 6 — FAQ
   ================================================================ */
const faqClinical: { q: string; a: string }[] = [
  { q: "Why use PWV instead of blood pressure?", a: "Blood pressure is an indirect and imperfect surrogate for arterial stiffness. PWV more directly measures arterial wall mechanical properties and may capture cumulative vascular remodeling and target-organ damage beyond a single blood pressure reading (9,10,63,64)." },
  { q: "If PWV overlaps heavily with BP, why bother measuring it?", a: "Although correlated with BP, PWV integrates vascular aging, cumulative hemodynamic burden, and structural arterial remodeling into one physiologic measure. It may therefore provide a more holistic marker of vascular health in selected contexts (9,10)." },
  { q: "Why not just use augmentation index instead?", a: "Augmentation index may better reflect pulsatile load and wave reflection in some contexts and may outperform PWV for incident AF prediction in certain populations. However, PWV remains the gold-standard noninvasive measure of arterial stiffness and has stronger validation across broader cardiovascular literature (10,11,25)." },
  { q: "What are the practical limitations of PWV clinically?", a: "Limitations include equipment availability, operator/training variability, lack of standardized protocols in AF, rhythm-related measurement variability, and uncertain incremental value beyond existing clinical tools." },
  { q: "Why is PWV not in AF guidelines?", a: "Evidence remains insufficient to support routine clinical implementation. Current data are heterogeneous, largely observational, and do not yet demonstrate that PWV-guided management improves outcomes." },
  { q: "Could PWV ever become clinically useful in AF care?", a: "Potentially yes, particularly in perioperative risk stratification, recurrence prognostication in medically managed AF, and integrated atrial cardiomyopathy phenotyping when combined with imaging and clinical risk markers." },
  { q: "What would need to happen before PWV could be clinically adopted?", a: "Prospective validation in targeted populations, protocol standardization, demonstration of incremental predictive value beyond existing tools, and ideally evidence that PWV-guided interventions improve outcomes." },
  { q: "Is PWV truly adding independent information, or just repackaging age and hypertension?", a: "Likely both. PWV is partly a surrogate for cumulative age- and BP-mediated vascular damage, but it may also integrate vascular, metabolic, and hemodynamic burden into a single biologically meaningful marker beyond any one isolated risk factor (9,10,63–66)." },
  { q: "Could PWV be more useful in younger patients?", a: "Possibly. PWV may provide greater incremental value in younger or intermediate-risk individuals where blood pressure is a less reliable surrogate for true vascular stiffness and target-organ damage (67)." },
  { q: "What is your biggest take-home clinical message?", a: "PWV is unlikely to serve as a universal screening tool for AF prediction in the general population, but it may have meaningful value as a contextual biomarker of vascular/atrial remodeling and prognostic risk in selected higher-risk AF populations." },
];

const faqProject: { q: string; a: string }[] = [
  { q: "Why did central PWV show stronger associations with AF than peripheral PWV?", a: "Central PWV likely better reflects stiffness of the elastic aorta, which directly influences ventricular-arterial coupling, wave reflection timing, and left-sided cardiac loading conditions. These hemodynamic mechanisms are more proximal to atrial remodeling than stiffness in peripheral muscular arteries, which may explain why central PWV demonstrated stronger and more consistent associations with AF-related outcomes (10,15,16,22,36,37,46–48)." },
  { q: "Why might peripheral PWV be less predictive of AF?", a: "Peripheral PWV primarily reflects stiffness of muscular arteries, which have less direct impact on central hemodynamics and left ventricular loading. As a result, peripheral stiffness may be less mechanistically linked to diastolic dysfunction and atrial remodeling, explaining its weaker or null associations with AF in multiple studies (22,47,48)." },
  { q: "Why were some studies unable to show PWV predicts incident AF?", a: "PWV often overlaps substantially with age, blood pressure, and comorbidities already included in traditional risk models, so its independent association may attenuate after multivariable adjustment. This likely reflects collinearity and overadjustment rather than absence of biological relevance (25,26,63–66)." },
  { q: "Why might PWV have a U-shaped relationship with incident AF?", a: "Both very low and very high PWV may be associated with increased AF risk through different mechanisms. High PWV likely reflects advanced vascular stiffening and pressure-mediated atrial remodeling, whereas low PWV may identify frail or autonomically dysregulated individuals at elevated AF risk through non-hemodynamic mechanisms (22,49–51)." },
  { q: "Why would low PWV ever be associated with higher AF risk?", a: "Low PWV can occur in frailty, autonomic dysfunction, low blood pressure states, sarcopenia, or reduced cardiac output. In such populations, AF risk may arise from autonomic and electrophysiologic vulnerability rather than pressure-mediated atrial remodeling, producing paradoxically elevated AF risk despite low PWV (22,49–51)." },
  { q: "Why does PWV appear more associated with established AF than first-episode AF?", a: "Established AF may both result from and contribute to vascular dysfunction, creating a bidirectional relationship over time. In first-episode AF, there may not yet have been sufficient time for fixed vascular remodeling to develop, and rhythm-related measurement variability may also obscure differences (27–31,42,43,55–57)." },
  { q: "Do you think arterial stiffness causes AF, or is it merely associated with it?", a: "Current evidence suggests a likely bidirectional relationship. Arterial stiffness may contribute to AF susceptibility via adverse ventricular-arterial coupling and atrial remodeling, while persistent AF may further worsen vascular function through hemodynamic and neurohormonal stress; however, causality remains unproven due to the observational nature of most available data (12,14,55–57)." },
  { q: "Why was PWV not elevated in first-episode AF patients?", a: "This may reflect insufficient duration of disease for chronic vascular remodeling to occur, as well as rhythm-related measurement variability when PWV is assessed during AF. It suggests that elevated PWV may be more characteristic of chronic disease burden than very early AF presentations (31,42,43)." },
  { q: "Why might augmentation index or central pulse pressure outperform PWV for incident AF prediction in some studies?", a: "Augmentation index and central pulse pressure may more directly reflect pulsatile load and wave reflection abnormalities that influence atrial stretch and ventricular loading. PWV is a broader marker of arterial stiffness, whereas these indices may more specifically capture the hemodynamic disturbances most immediately relevant to AF initiation (10,12,14,25)." },
  { q: "Why is PWV more useful prognostically than predictively?", a: "PWV appears to better reflect cumulative vascular and hemodynamic burden once cardiovascular disease is established. In contrast, for incident AF prediction in general populations, its signal overlaps substantially with traditional risk factors, limiting incremental predictive value beyond established models (25,26,32,39–41)." },
  { q: "Why does PWV seem most useful in patients with established cardiovascular disease?", a: "In higher-risk populations, PWV may identify the cumulative burden of vascular remodeling, subclinical organ damage, and hemodynamic dysfunction more effectively than in healthier cohorts. This likely explains why associations are strongest in established AF, postoperative AF, and patients with significant cardiovascular comorbidity (20–24,32,39–41)." },
  { q: "Why might PWV be useful in postoperative AF prediction?", a: "PWV may identify patients with latent atrial vulnerability and subclinical atrial myopathy that remain clinically silent until exposed to acute physiologic stress. Perioperative inflammation, oxidative stress, autonomic imbalance, and volume shifts may then act as a second hit, triggering AF in predisposed individuals (12,14,16,17,36–38,58–60)." },
  { q: 'Can you explain your "two-hit" model for postoperative AF?', a: "The first hit is chronic vascular remodeling and arterial stiffness creating an atrial substrate through fibrosis, stretch, and electrical heterogeneity. The second hit is acute perioperative stress (such as inflammation, ischemia-reperfusion injury, autonomic shifts, or volume overload) which lowers the threshold for AF initiation (12,14,58–60)." },
  { q: "Why might PWV identify subclinical atrial myopathy?", a: "Higher central PWV has been associated with impaired left atrial reservoir and conduit function even before overt AF develops, suggesting it may reflect upstream hemodynamic conditions that promote early atrial dysfunction before clinical arrhythmia becomes manifest (15–17)." },
  { q: "Why might the PWV-AF association attenuate in older populations?", a: "In older adults, competing risks such as MI, stroke, heart failure, and non-cardiovascular mortality may prevent AF from manifesting before death. Additionally, systolic blood pressure becomes a stronger surrogate of aortic stiffness in older age, reducing the incremental predictive value of PWV (52–54,67)." },
  { q: "Why did PWV predict AF recurrence in medically managed patients but not after ablation?", a: "In medically managed AF, PWV may continue to reflect systemic hemodynamic and structural drivers of progressive atrial remodeling. After pulmonary vein isolation, recurrence is more heavily determined by local atrial substrate and procedural factors (such as pulmonary vein reconnection) rather than systemic vascular stiffness (33,34,68–71)." },
  { q: "Why was PWV not associated with AF inducibility in EP lab studies?", a: "AF inducibility may depend more on acute endothelial, inflammatory, and autonomic perturbations than on chronic vascular remodeling. This suggests inducibility reflects a different pathophysiologic process than chronic AF substrate formation (35,56,72)." },
  { q: "Why does PWV sometimes decrease after cardioversion if arterial stiffness is structural?", a: "PWV reflects both structural vascular remodeling and dynamic hemodynamic influences. Restoration of sinus rhythm may transiently improve cardiac efficiency, reduce beat-to-beat variability, and normalize loading conditions, producing modest functional reductions in PWV without altering arterial structure (10,12,43,55,74)." },
  { q: "Why might rivaroxaban reduce PWV compared with warfarin?", a: "Potential mechanisms include improved endothelial function, reduced inflammatory signaling, and avoidance of vitamin K antagonism–related vascular calcification. However, these findings remain preliminary and hypothesis-generating (44,75–78)." },
  { q: "Why did PWV not improve in ESRD populations?", a: "In advanced ESRD, arterial stiffness may represent largely irreversible vascular calcification and fibrosis rather than modifiable functional vascular tone. In this setting, PWV likely reflects fixed vascular damage rather than a readily modifiable physiologic parameter (45,73)." },
  { q: "Is PWV a structural or dynamic marker?", a: "PWV is both. It reflects chronic structural arterial remodeling but is also influenced by dynamic physiologic variables such as blood pressure, rhythm regularity, and metabolic state, which likely explains heterogeneous modifiability across clinical contexts (10,12,74)." },
  { q: "Why are PWV findings heterogeneous across studies?", a: "Heterogeneity likely reflects differences in vascular territories measured, PWV modalities used, rhythm at time of measurement, AF subtype/stage, population risk profile, adjustment strategies, and outcome definitions (42,63–66)." },
  { q: "What are the main limitations preventing stronger conclusions?", a: "Most available studies are observational and cross-sectional, limiting causal inference. Additional limitations include heterogeneity in PWV measurement techniques, rhythm-related measurement variability, residual confounding, and lack of standardized AF-specific PWV protocols (42,63–66)." },
  { q: "Why is causality still uncertain?", a: "Because most studies are observational, it remains unclear whether arterial stiffness precedes AF, results from AF, or both. Longitudinal studies with serial vascular and atrial phenotyping are needed to clarify temporal relationships (55–57)." },
  { q: "What future research is most needed?", a: "Priority areas include longitudinal serial studies, AF-specific PWV measurement standardization, interventional studies testing whether modifying PWV alters AF risk, and targeted evaluation in high-yield contexts such as perioperative AF and younger/intermediate-risk populations." },
];

function FAQSlide() {
  const [openIdx, setOpenIdx] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const categories = [
    { label: "Clinical & Methodologic", color: "#2a9d8f", items: faqClinical },
    { label: "Project-Specific Discussion", color: "#9b5de5", items: faqProject },
  ];
  const cat = categories[activeTab];

  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col px-4 md:px-6 lg:px-14 py-8 md:py-6 relative">
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#2a9d8f] to-[#9b5de5]" />
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-[rgba(232,232,240,0.95)]">
                Anticipated Discussion Points
              </h2>
              <p className="text-[11px] text-[rgba(232,232,240,0.25)] tracking-wider uppercase">
                Frequently asked questions — tap to expand
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4 flex-shrink-0">
            {categories.map((c, i) => (
              <button
                key={i}
                onClick={() => { setActiveTab(i as 0 | 1); setOpenIdx(null); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors outline-none"
                style={{
                  background: activeTab === i ? `${c.color}20` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activeTab === i ? c.color + "40" : "rgba(255,255,255,0.05)"}`,
                  color: activeTab === i ? c.color : "rgba(232,232,240,0.35)",
                }}
              >
                {c.label}
                <span className="ml-1.5 opacity-50">({c.items.length})</span>
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
            {cat.items.map((faq, i) => {
              const key = `${activeTab}-${i}`;
              const isOpen = openIdx === key;
              return (
                <div
                  key={key}
                  className="rounded-lg overflow-hidden transition-colors"
                  style={{
                    background: isOpen ? `${cat.color}08` : `${cat.color}02`,
                    border: `1px solid ${isOpen ? cat.color + "20" : "rgba(255,255,255,0.03)"}`,
                  }}
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : key)}
                    className="w-full flex items-start gap-2.5 px-3 md:px-3.5 py-2 md:py-2.5 text-left outline-none"
                  >
                    <span
                      className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-mono font-bold"
                      style={{
                        background: isOpen ? cat.color : `${cat.color}15`,
                        color: isOpen ? "#050510" : cat.color,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-[13px] font-medium flex-1 leading-snug"
                      style={{ color: isOpen ? "rgba(232,232,240,0.9)" : "rgba(232,232,240,0.55)" }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className="text-[rgba(232,232,240,0.2)] text-xs flex-shrink-0 mt-0.5 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3 md:px-3.5 pb-3 pt-0">
                      <p className="pl-6.5 md:pl-[30px] text-[12px] text-[rgba(232,232,240,0.45)] leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 7 — SOURCES
   ================================================================ */
const references: string[] = [
  "Ko D, Chung MK, Evans PT, Benjamin EJ, Helm RH: Atrial Fibrillation: A Review. JAMA. 2025, 333:329. 10.1001/jama.2024.22451",
  "Odutayo A, Wong CX, Hsiao AJ, Hopewell S, Altman DG, Emdin CA: Atrial fibrillation and risks of cardiovascular disease, renal disease, and death: systematic review and meta-analysis. BMJ. 2016, i4482. 10.1136/bmj.i4482",
  "Michaud GF, Stevenson WG: Atrial Fibrillation. N Engl J Med. 2021, 384:353–61. 10.1056/NEJMcp2023658",
  "Joglar JA, Chung MK, Armbruster AL, et al.: 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation. J Am Coll Cardiol. 2024, 83:109–279. 10.1016/j.jacc.2023.08.017",
  "Chung MK, Refaat M, Shen W-K, et al.: Atrial Fibrillation. J Am Coll Cardiol. 2020, 75:1689–713. 10.1016/j.jacc.2020.02.025",
  "Goette A, Kalman JM, Aguinaga L, et al.: EHRA/HRS/APHRS/SOLAECE expert consensus on atrial cardiomyopathies. Heart Rhythm. 2017, 14:e3–40. 10.1016/j.hrthm.2016.05.028",
  "Nattel S, Harada M: Atrial Remodeling and Atrial Fibrillation. J Am Coll Cardiol. 2014, 63:2335–45. 10.1016/j.jacc.2014.02.555",
  "January CT, Wann LS, Alpert JS, et al.: 2014 AHA/ACC/HRS Guideline for the Management of Patients With Atrial Fibrillation. Circulation. 2014, 130. 10.1161/CIR.0000000000000041",
  "Vasan RS, Pan S, Xanthakis V, Beiser A, Larson MG, Seshadri S, Mitchell GF: Arterial Stiffness and Long-Term Risk of Health Outcomes: The Framingham Heart Study. Hypertension. 2022, 79:1045–56. 10.1161/HYPERTENSIONAHA.121.18776",
  "Townsend RR, Wilkinson IB, Schiffrin EL, et al.: Recommendations for Improving and Standardizing Vascular Research on Arterial Stiffness. Hypertension. 2015, 66:698–722. 10.1161/HYP.0000000000000033",
  "Vlachopoulos C, Aznaouridis K, Stefanadis C: Prediction of Cardiovascular Events and All-Cause Mortality With Arterial Stiffness. J Am Coll Cardiol. 2010, 55:1318–27. 10.1016/j.jacc.2009.10.061",
  "Chirinos JA, Segers P, Hughes T, Townsend R: Large-Artery Stiffness in Health and Disease. J Am Coll Cardiol. 2019, 74:1237–63. 10.1016/j.jacc.2019.07.012",
  "Cavalcante JL, Lima JAC, Redheuil A, Al-Mallah MH: Aortic Stiffness. J Am Coll Cardiol. 2011, 57:1511–22. 10.1016/j.jacc.2010.12.017",
  "Ikonomidis I, Aboyans V, Blacher J, et al.: The Role of Ventricular–Arterial Coupling in Cardiac Disease and Heart Failure. Eur J Heart Fail. 2019, 21:402–24. 10.1002/ejhf.1436",
  "Yoshida Y, Nakanishi K, Daimon M, et al.: Association of arterial stiffness with left atrial structure and phasic function. J Hypertens. 2020, 38:1140–8. 10.1097/HJH.0000000000002367",
  "Mascarenhas LA, Ji Y, Wang W, et al.: Association of central arterial stiffness with atrial myopathy: the ARIC study. Hypertens Res. 2024, 47:2902–13. 10.1038/s41440-024-01831-3",
  "Kyhl K, Von Huth S, Bojer A, Thomsen C, Engstrøm T, Vejlstrup N, Madsen PL: Conductance artery stiffness impairs atrio-ventriculo-arterial coupling. Sci Rep. 2021, 11:14467. 10.1038/s41598-021-93614-w",
  "Vio R, Giordani AS, Stefil M, et al.: Arterial stiffness and atrial fibrillation: shared mechanisms, clinical implications and therapeutic options. J Hypertens. 2022, 40:1639–46. 10.1097/HJH.0000000000003223",
  "Lage JGB, Bortolotto AL, Scanavacca MI, Bortolotto LA, Darrieux FCDC: Arterial stiffness and atrial fibrillation: A review. Clinics. 2022, 77:100014. 10.1016/j.clinsp.2022.100014",
  "Song W, Song Z, Zhang N, et al.: Association between brachial-ankle pulse wave velocity and the risk of new-onset atrial fibrillation: Kailuan Study. Npj Cardiovasc Health. 2024, 1:1. 10.1038/s44325-023-00001-7",
  "Chen H, Chen G, Zhang L, et al.: Estimated pulse wave velocity can predict the incidence of new-onset atrial fibrillation. Front Cardiovasc Med. 2022, 9:912573. 10.3389/fcvm.2022.912573",
  "Almuwaqqat Z, Claxton J, Norby FL, et al.: Association of arterial stiffness with incident atrial fibrillation. BMC Cardiovasc Disord. 2021, 21:247. 10.1186/s12872-021-02057-8",
  "Chen LY, Leening MJG, Norby FL, et al.: Carotid Intima-Media Thickness and Arterial Stiffness and the Risk of Atrial Fibrillation: ARIC, MESA, and Rotterdam Study. J Am Heart Assoc. 2016, 5:e002907. 10.1161/JAHA.115.002907",
  "Bonapace S, Rossi A, Cicoira M, et al.: Echocardiographically Derived Pulse Wave Velocity and Diastolic Dysfunction Associated with Increased AF Incidence. Echocardiography. 2016, 33:1024–31. 10.1111/echo.13230",
  "Shaikh AY, Wang N, Yin X, et al.: Relations of Arterial Stiffness and Brachial Flow-Mediated Dilation With New-Onset Atrial Fibrillation: Framingham Heart Study. Hypertension. 2016, 68:590–6. 10.1161/HYPERTENSIONAHA.116.07650",
  "Frary CE, Blicher MK, Olesen TB, et al.: N-Terminal Pro-Brain Type Natriuretic Peptide Predicts Cardiovascular Events Independently of Arterial Stiffness. Heart Lung Circ. 2024, 33:392–400. 10.1016/j.hlc.2023.11.015",
  "Pauklin P, Eha J, Tootsi K, Kolk R, Paju R, Kals M, Kampus P: Atrial fibrillation is associated with increased central blood pressure and arterial stiffness. J Clin Hypertens. 2021, 23:1581–7. 10.1111/jch.14323",
  "Shi D, Meng Q, Zhou X, et al.: Factors influencing the relationship between atrial fibrillation and artery stiffness in elderly Chinese patients with hypertension. Aging Clin Exp Res. 2016, 28:653–8. 10.1007/s40520-015-0455-8",
  "Gaczol M, Olszanecka A, Stolarz-Skrzypek K, Rajzer M, Wojciechowska W: Ventricular–arterial coupling indices reflect early stage of left ventricular remodelling in atrial fibrillation. Arter Hypertens. 2023, 27:240–51. 10.5603/ah.97127",
  "Bosanac J, Straus L, Novaković M, et al.: HFpEF and Atrial Fibrillation: The Enigmatic Interplay of Dysmetabolism, Biomarkers, and Vascular Endothelial Dysfunction. Dis Markers. 2022, 2022:1–7. 10.1155/2022/9539676",
  "Kilicgedik A, Efe SC, Gürbüz AS, et al.: Left Atrial Mechanical Function and Aortic Stiffness in Middle-aged Patients with the First Episode of Atrial Fibrillation. Chin Med J. 2017, 130:143–8. 10.4103/0366-6999.197979",
  "Han M, Yun J, Kim KH, et al.: Early vascular aging determined by brachial-ankle pulse wave velocity and its impact on ischemic stroke outcome. Sci Rep. 2024, 14:13659. 10.1038/s41598-024-62847-w",
  "Kizilirmak F, Guler GB, Guler E, et al.: Impact of aortic stiffness on the frequency of paroxysmal atrial fibrillation recurrences. Acta Cardiol. 2015, 70:414–21. 10.1080/AC.70.4.3094650",
  "Gaczoł M, Olszanecka A, Bednarek A, et al.: Selected echocardiographic and blood pressure parameters in predicting recurrence of atrial fibrillation after pulmonary vein isolation. Kardiol Pol. 2024, 82:1139–41. 10.33963/v.phj.103199",
  "Durak H, Ergül E: Association of induced atrial fibrillation in the electrophysiology laboratory with endothelial dysfunction. Int J Cardiol. 2024, 415:132465. 10.1016/j.ijcard.2024.132465",
  "Choi J-S, Oh SJ, Oh S: Combined impact of elevated arterial stiffness and left ventricular filling pressure on outcomes after off-pump CABG. J Cardiothorac Surg. 2022, 17:248. 10.1186/s13019-022-01994-5",
  "Apaydin Z, Ozturk S, Kilinc AY, et al.: Could We Predict POAF With a Simple Ambulatory Oscillometry Evaluating Aortic Stiffness? Braz J Cardiovasc Surg. 2023, 38. 10.21470/1678-9741-2023-0017",
  "Milan A, Maldari P, Iannaccone A, et al.: Pulse wave velocity and short-term outcome in patients requiring intravascular volume expansion. Emerg Med J. 2020, 37:217–22. 10.1136/emermed-2018-208089",
  "Chen S-C, Lee W-H, Hsu P-C, et al.: Association of Brachial–Ankle Pulse Wave Velocity With Cardiovascular Events in Atrial Fibrillation. Am J Hypertens. 2016, 29:348–56. 10.1093/ajh/hpv124",
  "Akkaya F, Hoşoğlu Y, İnç M, et al.: Relationship between Arterial Stiffness and CHA₂DS₂-VASc Score in AF-related Stroke Patients. Med Rec. 2023, 5:295–8. 10.37990/medr.1207426",
  "Szmigielski C, Styczyński G, Sobczyńska M, et al.: Pulse wave velocity correlates with aortic atherosclerosis assessed with TEE. J Hum Hypertens. 2016, 30:90–4. 10.1038/jhh.2015.35",
  "Lundwall K, Al Nouh M, Kahan T, Spaak J: Assessment of aortic stiffness during atrial fibrillation: solutions and considerations. Front Cardiovasc Med. 2024, 11:1449168. 10.3389/fcvm.2024.1449168",
  "Caluwé R, De Vriese AS, Van Vlem B, Verbeke F: Measurement of pulse wave velocity, augmentation index, and central pulse pressure in atrial fibrillation. J Am Soc Hypertens. 2018, 12:627–32. 10.1016/j.jash.2018.06.016",
  "Namba S, Yamaoka-Tojo M, Kakizaki R, et al.: Effects on bone metabolism markers and arterial stiffness by switching to rivaroxaban from warfarin in patients with atrial fibrillation. Heart Vessels. 2017, 32:983. 10.1007/s00380-017-0966-7",
  "De Vriese AS, Caluwé R, Pyfferoen L, et al.: Multicenter Randomized Controlled Trial of Vitamin K Antagonist Replacement by Rivaroxaban in Hemodialysis Patients with AF: the Valkyrie Study. J Am Soc Nephrol. 2020, 31:186–96. 10.1681/ASN.2019060579",
  "Liu S, Kim ED, Wu A, et al.: Central and peripheral pulse wave velocity and subclinical myocardial stress and damage in older adults. PLoS ONE. 2019, 14:e0212892. 10.1371/journal.pone.0212892",
  "Shibata T, Mok Y, Ballew SH, Tanaka H, Matsushita K: Peripheral vs. central arterial stiffness and cardiovascular events in older adults: the ARIC study. Eur J Prev Cardiol. 2025, zwaf545. 10.1093/eurjpc/zwaf545",
  "Yu S, McEniery CM: Central Versus Peripheral Artery Stiffening and Cardiovascular Risk. Arterioscler Thromb Vasc Biol. 2020, 40:1028–33. 10.1161/ATVBAHA.120.313128",
  "Orkaby AR, Lunetta KL, Sun FJ, et al.: Cross-Sectional Association of Frailty and Arterial Stiffness in Community-Dwelling Older Adults: Framingham Heart Study. J Gerontol A. 2019, 74:373–9. 10.1093/gerona/gly134",
  "Piotrowicz K, Gryglewska B, Grodzicki T, Gąsowski J: Arterial stiffness and frailty — A systematic review and metaanalysis. Exp Gerontol. 2021, 153:111480. 10.1016/j.exger.2021.111480",
  "Álvarez-Bustos A, Carnicero JA, Rodríguez-Sánchez B, et al.: Association Between Pulse Wave Velocity and Frailty, Disability, and Mortality in Community-Dwelling Older Adults. JACC Adv. 2023, 2:100423. 10.1016/j.jacadv.2023.100423",
  "Austin PC, Lee DS, Fine JP: Introduction to the Analysis of Survival Data in the Presence of Competing Risks. Circulation. 2016, 133:601–9. 10.1161/CIRCULATIONAHA.115.017719",
  "Cooper H, Wells S, Mehta S: Are competing-risk models superior to standard Cox models for predicting cardiovascular risk in older adults? Int J Epidemiol. 2022, 51:604–14. 10.1093/ije/dyab116",
  "Hageman SHJ, Dorresteijn JAN, Pennells L, et al.: The relevance of competing risk adjustment in cardiovascular risk prediction models for clinical practice. Eur J Prev Cardiol. 2023, 30:1741–7. 10.1093/eurjpc/zwad202",
  "Kotecha D, Piccini JP: Atrial fibrillation in heart failure: what should we do? Eur Heart J. 2015, ehv513. 10.1093/eurheartj/ehv513",
  "Corban MT, Toya T, Ahmad A, et al.: Atrial Fibrillation and Endothelial Dysfunction. Mayo Clin Proc. 2021, 96:1609–21. 10.1016/j.mayocp.2020.11.005",
  "Khan AA, Thomas GN, Lip GYH, Shantsila A: Endothelial function in patients with atrial fibrillation. Ann Med. 2020, 52:1–11. 10.1080/07853890.2019.1711158",
  "Gaudino M, Di Franco A, Rong LQ, et al.: Pericardial Effusion Provoking Atrial Fibrillation After Cardiac Surgery. J Am Coll Cardiol. 2022, 79:2529–39. 10.1016/j.jacc.2022.04.029",
  "Echahidi N, Pibarot P, O'Hara G, Mathieu P: Mechanisms, Prevention, and Treatment of Atrial Fibrillation After Cardiac Surgery. J Am Coll Cardiol. 2008, 51:793–801. 10.1016/j.jacc.2007.10.043",
  "Hogue CW, Creswell LL, Gutterman DD, Fleisher LA: Epidemiology, Mechanisms, and Risks. Chest. 2005, 128:9S–16S. 10.1378/chest.128.2_suppl.9S",
  "Rosenberg MA, Gottdiener JS, Heckbert SR, Mukamal KJ: Echocardiographic diastolic parameters and risk of atrial fibrillation: the Cardiovascular Health Study. Eur Heart J. 2012, 33:904–12. 10.1093/eurheartj/ehr378",
  "Naser JA, Lee E, Scott CG, et al.: Prevalence and incidence of diastolic dysfunction in atrial fibrillation: clinical implications. Eur Heart J. 2023, 44:5049–60. 10.1093/eurheartj/ehad592",
  "AlGhatrif M, Strait JB, Morrell CH, et al.: Longitudinal Trajectories of Arterial Stiffness and the Role of Blood Pressure: Baltimore Longitudinal Study of Aging. Hypertension. 2013, 62:934–41. 10.1161/HYPERTENSIONAHA.113.01445",
  "Scuteri A, Morrell CH, Orrù M, et al.: Longitudinal Perspective on the Conundrum of Central Arterial Stiffness, Blood Pressure, and Aging. Hypertension. 2014, 64:1219–27. 10.1161/HYPERTENSIONAHA.114.04127",
  "Schwartz JE, Feig PU, Izzo JL: Pulse Wave Velocities Derived From Cuff Ambulatory Pulse Wave Analysis. Hypertension. 2019, 74:111–6. 10.1161/HYPERTENSIONAHA.119.12756",
  "Metcalf PA, Meyer ML, Tanaka H, et al.: Longitudinal associations of blood pressure with aortic stiffness and pulsatility: the ARIC Study. J Hypertens. 2021, 39:987–93. 10.1097/HJH.0000000000002731",
  "Ben-Shlomo Y, Spears M, Boustred C, et al.: Aortic Pulse Wave Velocity Improves Cardiovascular Event Prediction. J Am Coll Cardiol. 2014, 63:636–46. 10.1016/j.jacc.2013.09.063",
  "Nishida K, Datino T, Macle L, Nattel S: Atrial Fibrillation Ablation. J Am Coll Cardiol. 2014, 64:823–31. 10.1016/j.jacc.2014.06.1172",
  "Erhard N, Mauer T, Ouyang F, et al.: Mechanisms of late arrhythmia recurrence after initially successful pulmonary vein isolation. Pacing Clin Electrophysiol. 2023, 46:161–8. 10.1111/pace.14656",
  "Benali K, Barré V, Hermida A, et al.: Recurrences of Atrial Fibrillation Despite Durable Pulmonary Vein Isolation: The PARTY-PVI Study. Circ Arrhythm Electrophysiol. 2023, 16. 10.1161/CIRCEP.122.011354",
  "Lu Y, Zei PC, Jiang C: Current understanding of atrial fibrillation recurrence after ablation. Pacing Clin Electrophysiol. 2022, 45:1216–24. 10.1111/pace.14581",
  "Black N, Mohammad F, Saraf K, Morris G: Endothelial function and atrial fibrillation: A missing piece of the puzzle? J Cardiovasc Electrophysiol. 2022, 33:109–16. 10.1111/jce.15277",
  "Levy DS, Grewal R, Le TH: Vitamin K deficiency: an emerging player in the pathogenesis of vascular calcification. Am J Physiol Renal Physiol. 2020, 319:F618–23. 10.1152/ajprenal.00278.2020",
  "Coutinho T, Borlaug BA, Pellikka PA, Turner ST, Kullo IJ: Sex Differences in Arterial Stiffness and Ventricular-Arterial Interactions. J Am Coll Cardiol. 2013, 61:96–103. 10.1016/j.jacc.2012.08.997",
  "Van Gorp RH, Dijkgraaf I, Bröker V, et al.: Off-target effects of oral anticoagulants — vascular effects of vitamin K antagonist and NOAC dabigatran etexilate. J Thromb Haemost. 2021, 19:1348–63. 10.1111/jth.15289",
  "Poterucha TJ, Goldhaber SZ: Warfarin and Vascular Calcification. Am J Med. 2016, 129:635.e1–635.e4. 10.1016/j.amjmed.2015.11.032",
  "Schurgers LJ, Joosen IA, Laufer EM, et al.: Vitamin K-Antagonists Accelerate Atherosclerotic Calcification and Induce a Vulnerable Plaque Phenotype. PLoS ONE. 2012, 7:e43229. 10.1371/journal.pone.0043229",
  "Shroff GR, Bangalore S, Bhave NM, et al.: Evaluation and Management of Aortic Stenosis in Chronic Kidney Disease. Circulation. 2021, 143. 10.1161/CIR.0000000000000979",
];

function SourcesSlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col px-4 md:px-6 lg:px-14 py-8 md:py-6 relative">
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 md:mb-5 flex-shrink-0">
            <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#a8dadc] to-[#457b9d]" />
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-[rgba(232,232,240,0.95)]">
                References
              </h2>
              <p className="text-[11px] text-[rgba(232,232,240,0.25)] tracking-wider uppercase">
                {references.length} sources cited
              </p>
            </div>
          </div>

          {/* Reference list */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="columns-1 md:columns-2 gap-x-8">
              {references.map((ref, i) => {
                const doiMatch = ref.match(/(10\.\S+)$/);
                const doiStr = doiMatch ? doiMatch[1] : null;
                const text = doiStr ? ref.slice(0, ref.lastIndexOf(doiStr)).trimEnd() : ref;
                return (
                  <div
                    key={i}
                    className="break-inside-avoid mb-1.5 flex items-start gap-2"
                  >
                    <span className="text-[11px] font-mono text-[#457b9d] w-5 md:w-6 text-right flex-shrink-0 pt-px">
                      {i + 1}.
                    </span>
                    <p className="text-[11px] text-[rgba(232,232,240,0.4)] leading-relaxed">
                      {text}
                      {doiStr && (
                        <>
                          {" "}
                          <a
                            href={`https://doi.org/${doiStr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#457b9d] hover:text-[#a8dadc] transition-colors underline underline-offset-2 decoration-[rgba(69,123,157,0.3)]"
                          >
                            doi
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

