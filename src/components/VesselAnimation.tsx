"use client";

import { useEffect, useRef, useCallback } from "react";

interface VesselAnimationProps {
  canvasHeight?: number;
  compact?: boolean;
}

export default function VesselAnimation({
  canvasHeight,
  compact = false,
}: VesselAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const heartImgRef = useRef<HTMLImageElement | null>(null);

  const cycleRef = useRef({
    stiffProgress: 0,
    elasticProgress: 0,
    stiffDone: false,
    elasticDone: false,
    stiffTime: 0,
    elasticTime: 0,
    cycleTimer: 0,
    paused: false,
    pauseTimer: 0,
  });

  useEffect(() => {
    const img = new Image();
    img.src = "/heart-diagram.svg";
    img.onload = () => {
      heartImgRef.current = img;
    };
  }, []);

  const drawVessel3D = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x1: number,
      centerY: number,
      length: number,
      baseInnerR: number,
      wallThick: number,
      _time: number,
      isStiff: boolean,
      arrowProgress: number,
      scale: number
    ) => {
      const numPts = 300;
      const dx = length / numPts;

      const getInnerR = (i: number): number => {
        if (isStiff) return baseInnerR;
        const progress = i / numPts;
        const wave = Math.sin(progress * Math.PI * 5);
        return baseInnerR + wave * baseInnerR * 0.75;
      };

      const topOuter: [number, number][] = [];
      const topInner: [number, number][] = [];
      const botInner: [number, number][] = [];
      const botOuter: [number, number][] = [];

      for (let i = 0; i <= numPts; i++) {
        const x = x1 + i * dx;
        const ir = getInnerR(i);
        const or_ = ir + wallThick;
        topOuter.push([x, centerY - or_]);
        topInner.push([x, centerY - ir]);
        botInner.push([x, centerY + ir]);
        botOuter.push([x, centerY + or_]);
      }

      const tracePath = (pts: [number, number][]) => {
        pts.forEach(([px, py], idx) =>
          idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        );
      };

      // Blood interior
      ctx.beginPath();
      tracePath(topInner);
      for (let i = botInner.length - 1; i >= 0; i--)
        ctx.lineTo(botInner[i][0], botInner[i][1]);
      ctx.closePath();
      const bloodGrad = ctx.createLinearGradient(
        x1, centerY - baseInnerR * 0.8,
        x1, centerY + baseInnerR * 0.8
      );
      bloodGrad.addColorStop(0, "#8b1a1a");
      bloodGrad.addColorStop(0.25, "#6b0e0e");
      bloodGrad.addColorStop(0.5, "#4a0505");
      bloodGrad.addColorStop(0.75, "#6b0e0e");
      bloodGrad.addColorStop(1, "#8b1a1a");
      ctx.fillStyle = bloodGrad;
      ctx.fill();

      // Top wall
      ctx.beginPath();
      tracePath(topOuter);
      for (let i = topInner.length - 1; i >= 0; i--)
        ctx.lineTo(topInner[i][0], topInner[i][1]);
      ctx.closePath();
      const topWG = ctx.createLinearGradient(
        x1, centerY - baseInnerR - wallThick - 5,
        x1, centerY - baseInnerR + 5
      );
      topWG.addColorStop(0, "#e8a0a0");
      topWG.addColorStop(0.15, "#d88888");
      topWG.addColorStop(0.4, "#c87070");
      topWG.addColorStop(0.7, "#b85858");
      topWG.addColorStop(1, "#982828");
      ctx.fillStyle = topWG;
      ctx.fill();
      ctx.beginPath();
      tracePath(topOuter);
      ctx.strokeStyle = "rgba(255, 200, 200, 0.3)";
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();

      // Bottom wall
      ctx.beginPath();
      tracePath(botInner);
      for (let i = botOuter.length - 1; i >= 0; i--)
        ctx.lineTo(botOuter[i][0], botOuter[i][1]);
      ctx.closePath();
      const botWG = ctx.createLinearGradient(
        x1, centerY + baseInnerR - 5,
        x1, centerY + baseInnerR + wallThick + 5
      );
      botWG.addColorStop(0, "#982828");
      botWG.addColorStop(0.3, "#b85858");
      botWG.addColorStop(0.6, "#c87070");
      botWG.addColorStop(0.85, "#d88888");
      botWG.addColorStop(1, "#e8a0a0");
      ctx.fillStyle = botWG;
      ctx.fill();
      ctx.beginPath();
      tracePath(botOuter);
      ctx.strokeStyle = "rgba(255, 200, 200, 0.25)";
      ctx.lineWidth = scale;
      ctx.stroke();

      // Lumen edges
      ctx.beginPath(); tracePath(topInner);
      ctx.strokeStyle = "rgba(255, 160, 160, 0.2)"; ctx.lineWidth = 0.8 * scale; ctx.stroke();
      ctx.beginPath(); tracePath(botInner);
      ctx.strokeStyle = "rgba(255, 160, 160, 0.2)"; ctx.lineWidth = 0.8 * scale; ctx.stroke();

      // Left end-cap
      {
        const ir0 = getInnerR(0);
        const or0 = ir0 + wallThick;
        ctx.beginPath();
        ctx.ellipse(x1, centerY, 4 * scale, or0, 0, 0, Math.PI * 2);
        const cg = ctx.createRadialGradient(x1, centerY, 0, x1, centerY, or0);
        cg.addColorStop(0, "#4a0505");
        cg.addColorStop(0.5, "#7a1515");
        cg.addColorStop(1, "#b85858");
        ctx.fillStyle = cg;
        ctx.fill();
      }

      // Arrow traveling along the top vessel wall
      if (arrowProgress > 0.01) {
        const arrowLen = 80 * scale;
        const headLen = 18 * scale;
        const headW = 10 * scale;
        const shaftW = 3 * scale;

        const sampleCount = 200;
        const wallPts: [number, number][] = [];
        for (let s = 0; s <= sampleCount; s++) {
          const frac = s / sampleCount;
          const sx = x1 + frac * length;
          const seg = Math.max(0, Math.min(Math.floor(frac * numPts), numPts));
          const ir = getInnerR(seg);
          const or_ = ir + wallThick;
          wallPts.push([sx, centerY]);
        }

        const cumArc: number[] = [0];
        for (let i = 1; i < wallPts.length; i++) {
          const ddx = wallPts[i][0] - wallPts[i - 1][0];
          const ddy = wallPts[i][1] - wallPts[i - 1][1];
          cumArc.push(cumArc[i - 1] + Math.sqrt(ddx * ddx + ddy * ddy));
        }
        const totalArc = cumArc[cumArc.length - 1];

        const tipArc = arrowProgress * totalArc;
        const tailArc = Math.max(0, tipArc - arrowLen);

        const getAtArc = (targetArc: number): { x: number; y: number; angle: number } => {
          for (let i = 1; i < cumArc.length; i++) {
            if (cumArc[i] >= targetArc) {
              const segLen = cumArc[i] - cumArc[i - 1];
              const t = segLen > 0 ? (targetArc - cumArc[i - 1]) / segLen : 0;
              const px = wallPts[i - 1][0] + t * (wallPts[i][0] - wallPts[i - 1][0]);
              const py = wallPts[i - 1][1] + t * (wallPts[i][1] - wallPts[i - 1][1]);
              const angle = Math.atan2(
                wallPts[i][1] - wallPts[i - 1][1],
                wallPts[i][0] - wallPts[i - 1][0]
              );
              return { x: px, y: py, angle };
            }
          }
          const last = wallPts[wallPts.length - 1];
          return { x: last[0], y: last[1], angle: 0 };
        };

        const tip = getAtArc(Math.min(tipArc, totalArc));
        const shaftEnd = getAtArc(Math.min(Math.max(0, tipArc - headLen), totalArc));
        const tail = getAtArc(tailArc);

        ctx.save();
        ctx.globalAlpha = 0.9;

        ctx.beginPath();
        const shaftSteps = 30;
        for (let s = 0; s <= shaftSteps; s++) {
          const arc = tailArc + (s / shaftSteps) * (Math.max(0, tipArc - headLen) - tailArc);
          const pt = getAtArc(Math.min(arc, totalArc));
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const shaftGrad = ctx.createLinearGradient(tail.x, tail.y, shaftEnd.x, shaftEnd.y);
        shaftGrad.addColorStop(0, "rgba(255,255,255,0.15)");
        shaftGrad.addColorStop(0.5, "rgba(255,255,255,0.55)");
        shaftGrad.addColorStop(1, "rgba(255,255,255,0.85)");
        ctx.strokeStyle = shaftGrad;
        ctx.lineWidth = shaftW;
        ctx.lineCap = "round";
        ctx.stroke();

        const angle = tip.angle;
        ctx.translate(tip.x, tip.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headLen, -headW);
        ctx.lineTo(-headLen * 0.6, 0);
        ctx.lineTo(-headLen, headW);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();

        ctx.restore();

        ctx.save();
        const glowR = 16 * scale;
        const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, glowR);
        glow.addColorStop(0, "rgba(255,255,255,0.4)");
        glow.addColorStop(0.5, "rgba(255,255,255,0.1)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Stiff: tapered end + reflection label
      if (isStiff) {
        const endX = x1 + length;
        const taperLen = 35 * scale;
        const ir = baseInnerR;
        const or_ = ir + wallThick;

        ctx.beginPath();
        ctx.moveTo(endX, centerY - or_);
        ctx.lineTo(endX + taperLen, centerY - or_ * 0.45);
        ctx.lineTo(endX + taperLen, centerY - ir * 0.3);
        ctx.lineTo(endX, centerY - ir);
        ctx.closePath();
        const tgt = ctx.createLinearGradient(endX, centerY - or_, endX, centerY);
        tgt.addColorStop(0, "#d08080"); tgt.addColorStop(1, "#8b2020");
        ctx.fillStyle = tgt; ctx.fill();

        ctx.beginPath();
        ctx.moveTo(endX, centerY + ir);
        ctx.lineTo(endX + taperLen, centerY + ir * 0.3);
        ctx.lineTo(endX + taperLen, centerY + or_ * 0.45);
        ctx.lineTo(endX, centerY + or_);
        ctx.closePath();
        const tgb = ctx.createLinearGradient(endX, centerY, endX, centerY + or_);
        tgb.addColorStop(0, "#8b2020"); tgb.addColorStop(1, "#d08080");
        ctx.fillStyle = tgb; ctx.fill();

        ctx.beginPath();
        ctx.moveTo(endX, centerY - ir);
        ctx.lineTo(endX + taperLen, centerY - ir * 0.3);
        ctx.lineTo(endX + taperLen, centerY + ir * 0.3);
        ctx.lineTo(endX, centerY + ir);
        ctx.closePath();
        ctx.fillStyle = "#4a0505"; ctx.fill();

        if (scale > 0.55) {
          ctx.font = `italic ${Math.round(13 * scale)}px 'Inter', sans-serif`;
          ctx.fillStyle = "#e88080";
          ctx.textAlign = "left";
          ctx.fillText("Early wave", endX + taperLen + 8 * scale, centerY - 8 * scale);
          ctx.fillText("reflection", endX + taperLen + 8 * scale, centerY + 8 * scale);
        }
      }

    },
    []
  );

  function drawExpansionArrow(
    ctx: CanvasRenderingContext2D, x: number, y: number, pointsUp: boolean, s: number
  ) {
    const dir = pointsUp ? -1 : 1;
    const r = 16 * s;
    ctx.save();
    ctx.strokeStyle = "#5dade2"; ctx.fillStyle = "#5dade2"; ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(x, y + dir * 3 * s, r,
      pointsUp ? Math.PI * 0.15 : -Math.PI * 0.85,
      pointsUp ? Math.PI * 0.85 : -Math.PI * 0.15
    );
    ctx.stroke();
    const a1 = pointsUp ? Math.PI * 0.15 : -Math.PI * 0.85;
    const a2 = pointsUp ? Math.PI * 0.85 : -Math.PI * 0.15;
    const lx = x + Math.cos(a1) * r, ly = y + dir * 3 * s + Math.sin(a1) * r;
    ctx.beginPath(); ctx.moveTo(lx, ly);
    ctx.lineTo(lx + (pointsUp ? -4 : 4) * s, ly + dir * 5 * s);
    ctx.lineTo(lx + (pointsUp ? 5 : -3) * s, ly + dir * 1 * s);
    ctx.closePath(); ctx.fill();
    const rx = x + Math.cos(a2) * r, ry = y + dir * 3 * s + Math.sin(a2) * r;
    ctx.beginPath(); ctx.moveTo(rx, ry);
    ctx.lineTo(rx + (pointsUp ? 4 : -4) * s, ry + dir * 5 * s);
    ctx.lineTo(rx + (pointsUp ? -5 : 3) * s, ry + dir * 1 * s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawCompressionArrow(
    ctx: CanvasRenderingContext2D, x: number, y: number, pointsUp: boolean, s: number
  ) {
    const dir = pointsUp ? -1 : 1;
    ctx.save();
    ctx.strokeStyle = "rgba(93, 173, 226, 0.7)";
    ctx.fillStyle = "rgba(93, 173, 226, 0.7)";
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y); ctx.lineTo(x, y + dir * 8 * s); ctx.lineTo(x + 8 * s, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + dir * 8 * s);
    ctx.lineTo(x - 3 * s, y + dir * 3 * s); ctx.lineTo(x + 3 * s, y + dir * 3 * s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /*  Main render loop                                                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const dt = 0.016;
    const STIFF_DURATION = 3.0;
    const ELASTIC_DURATION = 5.0;
    const PAUSE_AFTER_DONE = 1.5;

    const animate = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      timeRef.current += dt;
      const t = timeRef.current;
      const c = cycleRef.current;

      // Scale factor: 1.0 at 900px wide, proportional otherwise
      const scale = Math.max(0.35, Math.min(1, w / 900));
      const isMobile = w < 500;

      // Layout — all derived from scale
      const heartImgSize = Math.round(160 * scale);
      const heartAreaW = isMobile ? 0 : heartImgSize + 20 * scale;
      const vesselStartX = isMobile ? 12 : heartAreaW + 10 * scale;
      const vesselEndPad = isMobile ? 90 : 110 * scale;
      const vesselLen = w - vesselStartX - vesselEndPad;
      const baseR = Math.round(20 * scale);
      const wallT = Math.round(14 * scale);
      const stiffY = h * 0.28;
      const elasticY = h * 0.72;

      // ─── Update race ───
      if (!c.paused) {
        c.cycleTimer += dt;
        if (!c.stiffDone) {
          c.stiffProgress += dt / STIFF_DURATION;
          c.stiffTime = c.cycleTimer;
          if (c.stiffProgress >= 1) { c.stiffProgress = 1; c.stiffDone = true; }
        }
        if (!c.elasticDone) {
          c.elasticProgress += dt / ELASTIC_DURATION;
          c.elasticTime = c.cycleTimer;
          if (c.elasticProgress >= 1) { c.elasticProgress = 1; c.elasticDone = true; }
        }
        if (c.stiffDone && c.elasticDone) { c.paused = true; c.pauseTimer = 0; }
      } else {
        c.pauseTimer += dt;
        if (c.pauseTimer >= PAUSE_AFTER_DONE) {
          c.stiffProgress = 0; c.elasticProgress = 0;
          c.stiffDone = false; c.elasticDone = false;
          c.stiffTime = 0; c.elasticTime = 0;
          c.cycleTimer = 0; c.paused = false; c.pauseTimer = 0;
        }
      }

      // ──── STIFF VESSEL ────
      const titleSize = Math.round(18 * scale);
      const stiffTitleOffset = isMobile ? baseR + wallT + 14 : 62 * scale;
      ctx.font = `bold ${titleSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "#e88080";
      ctx.textAlign = "center";
      ctx.fillText("Stiff Vessel (↓ Compliance)", vesselStartX + vesselLen / 2, stiffY - stiffTitleOffset);

      // Heart image (hidden on mobile)
      if (!isMobile && heartImgRef.current) {
        const img = heartImgRef.current;
        const imgAspect = img.width / img.height;
        const drawH = heartImgSize;
        const drawW = drawH * imgAspect;
        const imgX = 10 * scale;
        const imgY = stiffY - drawH / 2;
        ctx.drawImage(img, imgX, imgY, drawW, drawH);

        ctx.beginPath();
        ctx.moveTo(imgX + drawW - 5, stiffY + 5);
        ctx.lineTo(vesselStartX, stiffY);
        const cg = ctx.createLinearGradient(imgX + drawW, stiffY, vesselStartX, stiffY);
        cg.addColorStop(0, "#d08080"); cg.addColorStop(1, "#8b2020");
        ctx.strokeStyle = cg; ctx.lineWidth = 5 * scale; ctx.stroke();
      }

      drawVessel3D(ctx, vesselStartX, stiffY, vesselLen, baseR, wallT, t, true, c.stiffProgress, scale);

      // Divider
      ctx.beginPath();
      ctx.moveTo(20, h * 0.5);
      ctx.lineTo(w - 20, h * 0.5);
      ctx.strokeStyle = "rgba(232,232,240,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ──── ELASTIC VESSEL ────
      const elasticTitleOffset = isMobile
        ? Math.round(baseR * 1.75) + wallT + 18
        : 78 * scale;
      ctx.font = `bold ${titleSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "#5dade2";
      ctx.textAlign = "center";
      ctx.fillText("Elastic Vessel (↑ Compliance)", vesselStartX + vesselLen / 2, elasticY - elasticTitleOffset);

      if (!isMobile) {
        const barX = vesselStartX - 30 * scale;
        const barH = 56 * scale;
        ctx.fillStyle = "rgba(232,232,240,0.12)";
        ctx.fillRect(barX - 4, elasticY - barH / 2, 8, barH);
        ctx.strokeStyle = "rgba(232,232,240,0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 4, elasticY - barH / 2, 8, barH);
        ctx.beginPath();
        ctx.moveTo(barX + 4, elasticY);
        ctx.lineTo(vesselStartX, elasticY);
        const cg2 = ctx.createLinearGradient(barX, elasticY, vesselStartX, elasticY);
        cg2.addColorStop(0, "#d08080"); cg2.addColorStop(1, "#8b2020");
        ctx.strokeStyle = cg2; ctx.lineWidth = 5 * scale; ctx.stroke();
      }

      drawVessel3D(ctx, vesselStartX, elasticY, vesselLen, baseR, wallT, t, false, c.elasticProgress, scale);

      // ──── TIMERS ────
      if (!isMobile) {
        const stiffTimerY = stiffY + 52 * scale;
        const timerX = vesselStartX + vesselLen + 65 * scale;
        drawTimer(ctx, timerX, stiffTimerY, c.stiffTime, c.stiffDone, "#e88080", "Stiff", scale);
        const elasticTimerY = elasticY + 52 * scale;
        drawTimer(ctx, timerX, elasticTimerY, c.elasticTime, c.elasticDone, "#5dade2", "Elastic", scale);
      } else {
        const tSize = 0.6;
        const timerX = vesselStartX + vesselLen + 45;
        drawTimer(ctx, timerX, stiffY, c.stiffTime, c.stiffDone, "#e88080", "Stiff", tSize);
        drawTimer(ctx, timerX, elasticY, c.elasticTime, c.elasticDone, "#5dade2", "Elastic", tSize);
      }

      // ──── LABEL CHAINS ────
      if (!isMobile) {
        const labelFont = Math.round(13 * scale);
        const arrowFont = Math.round(16 * scale);

        // Stiff labels (latest copy from 0ebb9da)
        const chainY = stiffY + 56 * scale;
        ctx.textAlign = "center";
        ctx.font = `bold ${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.8)";
        ctx.fillText("↓ Arterial distensibility", vesselStartX + vesselLen * 0.12, chainY);
        ctx.font = `${arrowFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.3)";
        ctx.fillText("→", vesselStartX + vesselLen * 0.27, chainY);
        ctx.font = `bold ${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "#e88080";
        ctx.fillText("Minimal wall", vesselStartX + vesselLen * 0.38, chainY);
        ctx.fillText("deformation", vesselStartX + vesselLen * 0.38, chainY + 16 * scale);
        ctx.font = `${arrowFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.3)";
        ctx.fillText("→", vesselStartX + vesselLen * 0.50, chainY);
        ctx.font = `${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.7)";
        ctx.fillText("No energy absorbed", vesselStartX + vesselLen * 0.63, chainY);
        ctx.fillText("→ fast wave", vesselStartX + vesselLen * 0.63, chainY + 16 * scale);
        ctx.font = `bold ${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "#e88080";
        ctx.fillText("→ ↑ PWV", vesselStartX + vesselLen * 0.82, chainY + 8 * scale);

        // Elastic labels (latest copy from 0ebb9da)
        const chainY2 = elasticY + 72 * scale;
        ctx.font = `bold ${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.8)";
        ctx.textAlign = "center";
        ctx.fillText("↑ Arterial distensibility", vesselStartX + vesselLen * 0.12, chainY2);
        ctx.font = `${arrowFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.3)";
        ctx.fillText("→", vesselStartX + vesselLen * 0.27, chainY2);
        ctx.font = `bold ${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "#5dade2";
        ctx.fillText("Greater wall", vesselStartX + vesselLen * 0.38, chainY2);
        ctx.fillText("deformation", vesselStartX + vesselLen * 0.38, chainY2 + 16 * scale);
        ctx.font = `${arrowFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.3)";
        ctx.fillText("→", vesselStartX + vesselLen * 0.50, chainY2);
        ctx.font = `${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(232,232,240,0.7)";
        ctx.fillText("Energy absorbed", vesselStartX + vesselLen * 0.63, chainY2);
        ctx.fillText("→ slow wave", vesselStartX + vesselLen * 0.63, chainY2 + 16 * scale);
        ctx.font = `bold ${labelFont}px 'Inter', sans-serif`;
        ctx.fillStyle = "#5dade2";
        ctx.fillText("→ ↓ PWV", vesselStartX + vesselLen * 0.82, chainY2 + 8 * scale);
      } else {
        const mf = Math.max(8, Math.round(9 * Math.max(scale, 0.7)));
        const labelGap = baseR + wallT + 14;
        const chainY = stiffY + labelGap;
        ctx.textAlign = "center";
        ctx.font = `bold ${mf}px 'Inter', sans-serif`;
        ctx.fillStyle = "#e88080";
        ctx.fillText("↓ Distensibility → No energy absorbed → ↑ PWV", vesselStartX + vesselLen / 2, chainY);

        const chainY2 = elasticY + (Math.round(baseR * 1.75) + wallT) + 14;
        ctx.fillStyle = "#5dade2";
        ctx.fillText("↑ Distensibility → Energy absorbed → ↓ PWV", vesselStartX + vesselLen / 2, chainY2);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [drawVessel3D]);

  function drawTimer(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    elapsed: number, done: boolean,
    color: string, label: string,
    s: number
  ) {
    const timeStr = elapsed.toFixed(1) + "s";
    const pillW = 90 * s;
    const pillH = 52 * s;
    const pillX = x - pillW / 2;
    const pillY = y - pillH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 10 * s);
    ctx.fillStyle = done ? "rgba(40, 180, 80, 0.12)" : "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.strokeStyle = done ? "rgba(40, 180, 80, 0.4)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `${Math.round(11 * s)}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(232,232,240,0.45)";
    ctx.textAlign = "center";
    ctx.fillText("⏱ " + label, x, pillY + 16 * s);

    ctx.font = `bold ${Math.round(20 * s)}px 'Space Grotesk', monospace`;
    ctx.fillStyle = done ? "#4ade80" : color;
    ctx.fillText(timeStr, x, pillY + 40 * s);

    if (done) {
      ctx.font = `${Math.round(14 * s)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#4ade80";
      ctx.fillText("✓", x + 32 * s, pillY + 40 * s);
    }
    ctx.restore();
  }

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full vessel-canvas"
        style={{ height: canvasHeight ?? undefined, display: "block" }}
      />
      {!compact && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[rgba(230,57,70,0.2)] bg-[rgba(230,57,70,0.03)]">
            <h4 className="font-semibold text-[#e88080] text-sm mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#e88080] inline-block" />
              Stiff Vessel — ↓ Compliance
            </h4>
            <p className="text-xs text-[rgba(232,232,240,0.55)] leading-relaxed">
              Rigid walls → pulse wave propagates faster, arrives sooner.
              Watch the arrow: same distance, less time. Higher PWV = faster
              arrival = increased cardiac afterload.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[rgba(93,173,226,0.2)] bg-[rgba(93,173,226,0.03)]">
            <h4 className="font-semibold text-[#5dade2] text-sm mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#5dade2] inline-block" />
              Elastic Vessel — ↑ Compliance
            </h4>
            <p className="text-xs text-[rgba(232,232,240,0.55)] leading-relaxed">
              Flexible walls absorb energy → pulse wave travels slower.
              The Windkessel effect buffers each pulse. Lower PWV =
              healthier ventricular–arterial coupling.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
