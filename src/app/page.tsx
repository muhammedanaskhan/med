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
  { id: "background", label: "Background" },
  { id: "vessel", label: "Vessel" },
  { id: "evidence", label: "Evidence" },
  { id: "conclusions", label: "Conclusions" },
];

const evidenceRows = [
  { context: "Incident AF", assoc: "Mixed", meaning: "Limited screening value", color: "#a8dadc" },
  { context: "Established AF", assoc: "Consistent ↑ PWV", meaning: "Disease severity marker", color: "#e63946" },
  { context: "Post-op AF", assoc: "Strong association", meaning: "Perioperative risk marker", color: "#f4a261" },
  { context: "Prognosis", assoc: "Higher PWV → worse", meaning: "Risk stratification", color: "#2a9d8f" },
  { context: "Recurrence", assoc: "Context dependent", meaning: "Adjunct marker", color: "#9b5de5" },
];

const conclusionSections = [
  {
    title: "Clinical Significance",
    color: "#e63946",
    points: [
      "Elevated PWV is consistently associated with AF, particularly in established disease or high cardiovascular risk.",
      "Supports a mechanistic link between arterial stiffness, impaired ventricular–arterial coupling, and left atrial remodeling.",
      "Central PWV demonstrates stronger associations than peripheral indices.",
      "May reflect early atrial abnormalities preceding clinically overt AF.",
    ],
  },
  {
    title: "Clinical Interpretation",
    color: "#457b9d",
    points: [
      "PWV is more informative as a prognostic marker than a predictor of incident AF.",
      "Strongest associations in established AF, POAF, and high cardiovascular risk populations.",
      "Incident AF relationship attenuated after adjustment for age, BP, and comorbidities.",
      "Evidence suggests a bidirectional relationship between arterial stiffness and AF.",
    ],
  },
  {
    title: "Clinical Application",
    color: "#2a9d8f",
    points: [
      "PWV may provide additional risk stratification alongside clinical risk scores and imaging markers.",
      "Particularly useful in stress-related contexts such as POAF.",
      "In medically managed AF, elevated PWV may identify patients at higher risk of recurrence.",
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
              className={`text-[10px] font-medium tracking-[0.12em] uppercase transition-all duration-300 ${
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
        <span className="text-[10px] text-[rgba(232,232,240,0.12)] tracking-[0.15em] font-mono">
          {String(current + 1).padStart(2, "0")} — {String(SLIDES.length).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-[rgba(232,232,240,0.1)] tracking-wider">
          scroll · arrows · click dots
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
            {current === 1 && <BackgroundSlide />}
            {current === 2 && <VesselSlide />}
            {current === 3 && <EvidenceSlide />}
            {current === 4 && <ConclusionsSlide />}
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
    <div className="h-full flex flex-col items-center justify-center px-5 md:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(230,57,70,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_25%_60%,rgba(69,123,157,0.03)_0%,transparent_50%)]" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-[rgba(230,57,70,0.07)] border border-[rgba(230,57,70,0.12)] mb-6 md:mb-10">
          <span className="w-[6px] h-[6px] rounded-full bg-[#e63946] pulse-dot-sm" />
          <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-[#e63946]">
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

        <p className="text-sm md:text-base text-[rgba(232,232,240,0.35)] mb-5 md:mb-8 tracking-wide">
          Clinical Significance and Current Evidence
        </p>

        <div className="max-w-xs mx-auto mb-6 md:mb-10 opacity-60">
          <ECGLine />
        </div>

        <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-3 gap-y-1 text-[11px] md:text-[12px] text-[rgba(232,232,240,0.4)] mb-2 md:mb-3">
          {["Oren Nedjar¹", "Zaneh Kahook¹", "Syed Maaz Shah²", "C.G. Mihos³", "M. Kesselman¹"].map(
            (a, i, arr) => (
              <span key={i}>
                {a}
                {i < arr.length - 1 && (
                  <span className="ml-1 md:ml-2 text-[rgba(232,232,240,0.12)]">·</span>
                )}
              </span>
            )
          )}
        </div>

        <p className="text-[9px] md:text-[10px] text-[rgba(232,232,240,0.2)] leading-relaxed max-w-xl mx-auto hidden sm:block">
          ¹ Nova Southeastern University Dr. Kiran C. Patel College of Osteopathic Medicine ·{" "}
          ² Kansas City College of Osteopathic Medicine ·{" "}
          ³ Division of Cardiology, Mount Sinai Medical Center, Miami Beach, FL
        </p>
        <p className="text-[9px] text-[rgba(232,232,240,0.2)] leading-relaxed sm:hidden">
          ¹ NSU KPCOM · ² Kansas City COM · ³ Mount Sinai, Miami Beach
        </p>

        <div className="mt-6 md:mt-10 flex flex-wrap justify-center gap-2 md:gap-3">
          {[
            { val: "50M+", desc: "Affected worldwide", color: "#e63946" },
            { val: "PWV", desc: "Gold-standard measure", color: "#457b9d" },
            { val: "Central", desc: "Stronger associations", color: "#2a9d8f" },
            { val: "Bi-directional", desc: "Mutual influence", color: "#9b5de5" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 md:gap-2.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
            >
              <span className="text-xs md:text-sm font-bold" style={{ color: s.color }}>
                {s.val}
              </span>
              <span className="text-[9px] md:text-[10px] text-[rgba(232,232,240,0.3)]">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 1 — BACKGROUND & METHODS
   ================================================================ */
function BackgroundSlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex items-center px-5 md:px-6 lg:px-14 py-10 md:py-0 relative">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(rgba(69,123,157,0.6) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-16 items-start">
          {/* Left: Background */}
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#e63946] to-[#457b9d]" />
              <h2 className="text-xl md:text-3xl font-bold text-[rgba(232,232,240,0.95)]">
                Background
              </h2>
            </div>

            <div className="space-y-2.5 md:space-y-3">
              <div className="p-3 md:p-4 rounded-xl bg-[rgba(230,57,70,0.03)] border border-[rgba(230,57,70,0.1)]">
                <h3 className="font-semibold text-[#e63946] text-xs md:text-sm mb-1">Atrial Fibrillation</h3>
                <p className="text-[11px] md:text-[12px] text-[rgba(232,232,240,0.5)] leading-relaxed">
                  Most common sustained arrhythmia worldwide (&gt;50M people), associated with
                  increased risk of stroke, heart failure, and mortality.
                </p>
              </div>

              <div className="p-3 md:p-4 rounded-xl bg-[rgba(69,123,157,0.03)] border border-[rgba(69,123,157,0.1)]">
                <h3 className="font-semibold text-[#457b9d] text-xs md:text-sm mb-1">Arterial Stiffness & PWV</h3>
                <p className="text-[11px] md:text-[12px] text-[rgba(232,232,240,0.5)] leading-relaxed">
                  Arterial stiffness reflects vascular aging and cumulative cardiovascular risk.
                  PWV is the gold-standard noninvasive measure.
                </p>
              </div>

              <div className="p-3 md:p-4 rounded-xl bg-[rgba(42,157,143,0.03)] border border-[rgba(42,157,143,0.1)]">
                <h3 className="font-semibold text-[#2a9d8f] text-xs md:text-sm mb-1">The Knowledge Gap</h3>
                <p className="text-[11px] md:text-[12px] text-[rgba(232,232,240,0.5)] leading-relaxed">
                  The clinical role of PWV across the spectrum of AF remains unclear — this review
                  evaluates its significance across prediction, association, and management.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Objective + Methods */}
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#457b9d] to-[#2a9d8f]" />
              <h2 className="text-xl md:text-3xl font-bold text-[rgba(232,232,240,0.95)]">
                Study Design
              </h2>
            </div>

            <div className="mb-5 md:mb-8">
              <h4 className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(232,232,240,0.3)] mb-2 md:mb-3">
                Objective
              </h4>
              <ul className="space-y-1 md:space-y-1.5">
                {[
                  "Prediction of incident AF",
                  "Association with established AF",
                  "AF burden, recurrence, and progression",
                  "Post-operative AF risk stratification",
                  "Clinical outcomes and prognosis",
                  "PWV and cardiovascular risk factors",
                  "Clinical utility for risk stratification",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] md:text-[12px] text-[rgba(232,232,240,0.5)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#457b9d] mt-[4px] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(232,232,240,0.3)] mb-3">
                PRISMA Flow
              </h4>
              <div className="flex items-start gap-1.5 md:gap-2">
                {[
                  { num: "01", title: "Identification", sub: "Database search", color: "#457b9d" },
                  { num: "02", title: "Screening", sub: "Title & abstract", color: "#a8dadc" },
                  { num: "03", title: "Eligibility", sub: "Full-text review", color: "#2a9d8f" },
                  { num: "04", title: "Inclusion", sub: "Final studies", color: "#e63946" },
                ].map((step, i) => (
                  <Fragment key={i}>
                    <div
                      className="flex-1 p-2 md:p-3 rounded-xl text-center"
                      style={{
                        background: `${step.color}08`,
                        border: `1px solid ${step.color}18`,
                      }}
                    >
                      <span
                        className="text-[10px] md:text-[11px] font-mono font-bold block"
                        style={{ color: step.color }}
                      >
                        {step.num}
                      </span>
                      <span className="text-[10px] md:text-[11px] font-semibold text-[rgba(232,232,240,0.65)] block mt-0.5">
                        {step.title}
                      </span>
                      <span className="text-[8px] md:text-[9px] text-[rgba(232,232,240,0.25)] hidden sm:inline">{step.sub}</span>
                    </div>
                    {i < 3 && (
                      <span className="text-[rgba(232,232,240,0.1)] text-xs md:text-sm mt-3 md:mt-4 flex-shrink-0">→</span>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 2 — VESSEL DYNAMICS
   ================================================================ */
function VesselSlide() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-2 md:px-6 relative">
      <div className="text-center mb-2 md:mb-3">
        <p className="text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-[rgba(232,232,240,0.25)] mb-1">
          Interactive Diagram
        </p>
        <h2 className="text-base md:text-2xl font-bold mb-0.5 md:mb-1">
          <span className="text-[rgba(232,232,240,0.9)]">Physiological Link: </span>
          <span className="gradient-text">Arterial Stiffness</span>
          <span className="text-[rgba(232,232,240,0.9)]"> & </span>
          <span className="gradient-text-blue">PWV</span>
        </h2>
        <p className="text-[10px] md:text-[12px] text-[rgba(232,232,240,0.3)] hidden sm:block">
          Stiff vessels propagate pressure waves faster — elastic vessels buffer each pulse
        </p>
      </div>

      <div className="w-full max-w-5xl vessel-canvas-wrap">
        <VesselAnimation compact />
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 3 — EVIDENCE & INTERPRETATION
   ================================================================ */
function EvidenceSlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex items-center px-5 md:px-6 lg:px-14 py-10 md:py-0 relative">
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12">
          {/* Evidence table */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#e63946] to-[#a8dadc]" />
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-[rgba(232,232,240,0.95)]">
                  Evidence Summary
                </h2>
                <p className="text-[9px] md:text-[10px] text-[rgba(232,232,240,0.25)] tracking-wider uppercase">
                  Results & Discussion
                </p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-[rgba(69,123,157,0.12)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(29,53,87,0.35)]">
                    <th className="text-left px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-semibold text-[#a8dadc] tracking-[0.1em] uppercase">
                      Context
                    </th>
                    <th className="text-left px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-semibold text-[#a8dadc] tracking-[0.1em] uppercase">
                      Association
                    </th>
                    <th className="text-left px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-semibold text-[#a8dadc] tracking-[0.1em] uppercase hidden sm:table-cell">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-[rgba(255,255,255,0.03)]"
                    >
                      <td className="px-3 md:px-4 py-2">
                        <span className="text-[11px] md:text-[13px] font-semibold" style={{ color: row.color }}>
                          {row.context}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-2 text-[11px] md:text-[13px] text-[rgba(232,232,240,0.6)]">
                        {row.assoc}
                      </td>
                      <td className="px-3 md:px-4 py-2 text-[11px] md:text-[13px] text-[rgba(232,232,240,0.45)] hidden sm:table-cell">
                        {row.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interpretation */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 md:mb-5">
              <div className="w-1 h-6 md:h-8 rounded-full bg-gradient-to-b from-[#9b5de5] to-[#2a9d8f]" />
              <h2 className="text-lg md:text-2xl font-bold text-[rgba(232,232,240,0.95)]">
                Interpretation
              </h2>
            </div>

            <div className="space-y-2 md:space-y-2.5">
              {[
                {
                  label: "Central vs Peripheral PWV",
                  detail: "Central stiffness better reflects aortic load — more relevant to LA stress and remodeling.",
                  color: "#f4a261",
                },
                {
                  label: "Predictive vs Prognostic",
                  detail: "Better as a prognosis marker than a screening tool. Incident AF prediction attenuated after risk adjustment.",
                  color: "#2a9d8f",
                },
                {
                  label: "Bidirectional Relationship",
                  detail: "Arterial stiffness may promote AF substrates. Persistent AF may further impair vascular function.",
                  color: "#9b5de5",
                },
              ].map((node, i) => (
                <div
                  key={i}
                  className="p-3 md:p-3.5 rounded-xl"
                  style={{
                    background: `${node.color}06`,
                    border: `1px solid ${node.color}15`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: node.color }}
                    />
                    <span className="text-[11px] md:text-[12px] font-semibold" style={{ color: node.color }}>
                      {node.label}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-[rgba(232,232,240,0.45)] leading-relaxed pl-4">
                    {node.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 md:mt-5 p-3 md:p-3.5 rounded-xl bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.04)]">
              <h4 className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(232,232,240,0.3)] mb-1.5 md:mb-2">
                Context-Dependent Utility
              </h4>
              <div className="space-y-1 md:space-y-1.5">
                {[
                  { text: "Useful for recurrence in medically managed AF", color: "#2a9d8f" },
                  { text: "Not predictive for post-ablation recurrence", color: "#e63946" },
                  { text: "POAF: chronic stiffness may create vulnerable substrate", color: "#f4a261" },
                  { text: "Need standardized AF-specific PWV protocols", color: "#9b5de5" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-[4px] flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-[10px] md:text-[11px] text-[rgba(232,232,240,0.4)] leading-relaxed">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SLIDE 4 — CONCLUSIONS & CREDITS
   ================================================================ */
function ConclusionsSlide() {
  return (
    <div className="h-full overflow-y-auto slide-scroll">
      <div className="min-h-full flex flex-col items-center justify-center px-5 md:px-6 lg:px-14 py-10 md:py-0 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_90%,rgba(69,123,157,0.03)_0%,transparent_60%)]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="text-center mb-5 md:mb-8">
            <p className="text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-[rgba(232,232,240,0.25)] mb-1 md:mb-2">
              Key Takeaways
            </p>
            <h2 className="text-xl md:text-3xl font-bold text-[rgba(232,232,240,0.95)]">
              Conclusions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-10">
            {conclusionSections.map((section, i) => (
              <div
                key={i}
                className="p-3.5 md:p-5 rounded-xl"
                style={{
                  background: `${section.color}04`,
                  border: `1px solid ${section.color}12`,
                  borderTop: `3px solid ${section.color}`,
                }}
              >
                <h3
                  className="font-semibold text-[13px] md:text-[14px] mb-2 md:mb-3"
                  style={{ color: section.color }}
                >
                  {section.title}
                </h3>
                <ul className="space-y-2 md:space-y-2.5">
                  {section.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span
                        className="w-1 h-1 rounded-full mt-[6px] flex-shrink-0"
                        style={{ background: section.color }}
                      />
                      <span className="text-[10px] md:text-[11px] text-[rgba(232,232,240,0.5)] leading-relaxed">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center space-y-2 md:space-y-3 pb-8 md:pb-0">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[9px] md:text-[10px] text-[rgba(232,232,240,0.25)]">
              Full reference list available in the original research poster
            </div>

            <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-4 gap-y-1">
              {["NSU Florida", "Cleveland Clinic Florida", "Mount Sinai Medical Center"].map(
                (inst, i) => (
                  <span
                    key={i}
                    className="text-[10px] md:text-[11px] text-[rgba(232,232,240,0.25)]"
                  >
                    {inst}
                    {i < 2 && (
                      <span className="ml-2 md:ml-3 text-[rgba(232,232,240,0.08)]">·</span>
                    )}
                  </span>
                )
              )}
            </div>

            <p className="text-[9px] md:text-[10px] text-[rgba(232,232,240,0.12)]">
              © {new Date().getFullYear()} · Nedjar, Kahook, Shah, Mihos, Kesselman
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
