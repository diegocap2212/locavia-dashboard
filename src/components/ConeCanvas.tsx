import React, { useRef, useEffect, useCallback } from 'react';
import type { ReleaseConeData } from '../hooks/useDashboardData';

interface Props {
  coneData: ReleaseConeData;
  height?: number;
}

const MONO = `"Cascadia Code","Cascadia Mono",Consolas,ui-monospace,"SF Mono",monospace`;

function pill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string,
  color: string,
  anchor: 'start' | 'mid' | 'end',
  W: number, H: number,
) {
  ctx.font = `600 11px ${MONO}`;
  const padX = 7, h = 18;
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  let tx = x;
  if (anchor === 'end') tx = x - w;
  else if (anchor === 'mid') tx = x - w / 2;
  tx = Math.max(2, Math.min(tx, W - w - 2));
  const ty = Math.max(2, Math.min(y - h / 2, H - h - 2));

  ctx.fillStyle = 'rgba(10,15,26,0.85)';
  ctx.beginPath();
  ctx.roundRect(tx, ty, w, h, 5);
  ctx.fill();

  ctx.strokeStyle = color + '88';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, tx + padX, ty + h / 2 + 0.5);
}

function drawCone(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  coneData: ReleaseConeData,
  p: number, // 0..1 animation progress
) {
  const { chartData, bLabel, wLabel, summary } = coneData;
  if (!chartData.length) return;

  const padL = 44, padR = 20, padT = 28, padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = chartData.length;

  const yMax = Math.max(
    summary.total,
    ...chartData.map(d => Math.max(
      (d['A Fazer (Real)'] as number) || 0,
      (d[bLabel] as number) || 0,
      (d[wLabel] as number) || 0,
    )),
  ) * 1.05; // 5% headroom

  const xAt = (i: number) => padL + (i / Math.max(n - 1, 1)) * plotW;
  const yAt = (v: number) => padT + (1 - Math.max(0, v) / yMax) * plotH;

  // ── Grid lines + Y labels ────────────────────
  ctx.font = `11px ${MONO}`;
  ctx.textBaseline = 'middle';
  for (let g = 0; g <= 4; g++) {
    const val = (yMax / 1.05) * g / 4;
    const y = yAt(val);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.round(val)), padL - 7, y);
  }

  // ── X axis (month labels every ~4 data points) ──
  ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(n / 7));
  for (let i = 0; i < n; i += step) {
    const d = chartData[i];
    if (!d?.fullDate) continue;
    const lbl = (d.fullDate as Date).toLocaleDateString('pt-BR', { month: 'short' });
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(lbl, xAt(i), H - padB + 16);
  }

  // ── Past / future split ──────────────────────
  const pastIdxs: number[] = [];
  let todayIdx = 0;
  for (let i = 0; i < n; i++) {
    if ((chartData[i]['A Fazer (Real)'] as number | null) !== null) {
      pastIdxs.push(i);
      todayIdx = i;
    }
  }
  if (!pastIdxs.length) return;

  const todayVal = chartData[todayIdx]['A Fazer (Real)'] as number;
  const todayX = xAt(todayIdx);
  const todayY = yAt(todayVal);

  // P85 end = first future index where bLabel reaches 0 (or last defined)
  let p85EndIdx = n - 1;
  for (let i = todayIdx; i < n; i++) {
    const v = chartData[i][bLabel] as number | null;
    if (v !== null && v !== undefined && v <= 0) { p85EndIdx = i; break; }
    if (v !== null && v !== undefined) p85EndIdx = i;
  }
  const p85EndX = xAt(p85EndIdx);
  const p85EndY = yAt(0);

  // P15 end
  let p15EndIdx = n - 1;
  for (let i = todayIdx; i < n; i++) {
    const v = chartData[i][wLabel] as number | null;
    if (v !== null && v !== undefined && v <= 0) { p15EndIdx = i; break; }
    if (v !== null && v !== undefined) p15EndIdx = i;
  }
  const p15EndX = xAt(p15EndIdx);
  const p15EndY = yAt(0);

  // ── Cone band (triangle: today → P85 → P15) ──
  const bandAlpha = Math.max(0, Math.min((p - 0.4) / 0.6, 1));
  if (bandAlpha > 0 && summary.remaining > 0) {
    // Build polygon following P15 future points (top of band), then P85 (bottom, reversed)
    const p15Pts: [number, number][] = [];
    const p85Pts: [number, number][] = [];
    for (let i = todayIdx; i <= p15EndIdx; i++) {
      const v = chartData[i][wLabel] as number | null;
      if (v !== null && v !== undefined) p15Pts.push([xAt(i), yAt(Math.max(0, v))]);
    }
    for (let i = todayIdx; i <= p85EndIdx; i++) {
      const v = chartData[i][bLabel] as number | null;
      if (v !== null && v !== undefined) p85Pts.push([xAt(i), yAt(Math.max(0, v))]);
    }

    const grad = ctx.createLinearGradient(todayX, 0, p15EndX, 0);
    grad.addColorStop(0, `rgba(43,232,107,${0.45 * bandAlpha})`);
    grad.addColorStop(0.5, `rgba(43,232,107,${0.16 * bandAlpha})`);
    grad.addColorStop(1, `rgba(43,232,107,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (p15Pts.length) {
      ctx.moveTo(p15Pts[0][0], p15Pts[0][1]);
      p15Pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    } else {
      ctx.moveTo(todayX, todayY);
      ctx.lineTo(p15EndX, p15EndY);
    }
    // trace back via P85 bottom
    if (p85Pts.length) {
      [...p85Pts].reverse().forEach(([x, y]) => ctx.lineTo(x, y));
    } else {
      ctx.lineTo(p85EndX, p85EndY);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── P15 dashed line ────────────────────────
  const p15LineAlpha = Math.max(0, Math.min((p - 0.5) / 0.5, 1));
  if (p15LineAlpha > 0 && summary.remaining > 0) {
    ctx.save();
    ctx.globalAlpha = p15LineAlpha;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(240,198,107,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let i = todayIdx; i <= p15EndIdx; i++) {
      const v = chartData[i][wLabel] as number | null;
      if (v === null || v === undefined) continue;
      const x = xAt(i), y = yAt(Math.max(0, v));
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── P85 dashed line (principal — padrão LM) ──
  const p85LineAlpha = Math.max(0, Math.min((p - 0.45) / 0.55, 1));
  if (p85LineAlpha > 0 && summary.remaining > 0) {
    ctx.save();
    ctx.globalAlpha = p85LineAlpha;
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let i = todayIdx; i <= p85EndIdx; i++) {
      const v = chartData[i][bLabel] as number | null;
      if (v === null || v === undefined) continue;
      const x = xAt(i), y = yAt(Math.max(0, v));
      started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      started = true;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // dot at P85 end
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p85EndX, p85EndY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Realized burndown (animated reveal, magenta + glow) ──
  const reveal = Math.min(p / 0.6, 1);
  const shown = Math.max(1, Math.floor(pastIdxs.length * reveal));
  ctx.save();
  ctx.shadowColor = 'rgba(43,232,107,0.6)';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#2BE86B';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pastIdxs.slice(0, shown).forEach((pi, k) => {
    const v = chartData[pi]['A Fazer (Real)'] as number;
    const x = xAt(pi), y = yAt(v);
    k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  // ── "Hoje" vertical marker ─────────────────
  const markerAlpha = Math.max(0, Math.min((p - 0.55) / 0.45, 1));
  if (markerAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = markerAlpha;

    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(43,232,107,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(todayX, padT);
    ctx.lineTo(todayX, H - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2BE86B';
    ctx.beginPath();
    ctx.arc(todayX, todayY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `10px ${MONO}`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('hoje', todayX, padT - 10);

    const fmt = (d: Date | null) =>
      d ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '—';

    if (summary.remaining > 0) {
      pill(ctx, todayX - 10, todayY - 6, `faltam ${summary.remaining}`, '#2BE86B', 'end', W, H);

      if (summary.confident) {
        // Faixa de incerteza significativa: dois extremos com linguagem clara.
        pill(ctx, p85EndX, p85EndY - 16, `Otimista · ${fmt(summary.entregaMelhor)}`, '#FFFFFF', 'mid', W, H);
        pill(ctx, p15EndX, p15EndY + 16, `Pessimista · ${fmt(summary.entregaPior)}`, '#F0C66B', 'mid', W, H);
      } else {
        // Amostra curta / sem dispersão: uma projeção só + aviso (evita P15==P85 enganoso).
        pill(ctx, p85EndX, p85EndY - 16, `Previsão · ${fmt(summary.entregaMelhor)}`, '#FFFFFF', 'mid', W, H);
        pill(ctx, todayX + 12, padT + 6, `amostra curta — sem faixa de incerteza`, '#F7C365', 'start', W, H);
      }
    } else {
      pill(ctx, todayX - 10, todayY + 2, `${summary.total} concluídos`, '#2BE86B', 'end', W, H);
    }

    ctx.restore();
  }
}

const ConeCanvas: React.FC<Props> = ({ coneData, height = 340 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const paint = useCallback((progress: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.width / dpr;
    const H = cv.height / dpr;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    drawCone(ctx, W, H, coneData, progress);
    ctx.restore();
  }, [coneData]);

  const resize = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width * dpr;
    cv.height = rect.height * dpr;
    paint(1);
  }, [paint]);

  // Animate on data change
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (reduceMotion) { paint(1); return; }

    const dur = 1100;
    const t0 = performance.now();
    const frame = (t: number) => {
      const raw = (t - t0) / dur;
      const prog = Math.min(raw, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      paint(eased);
      if (raw < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [coneData, paint, reduceMotion]);

  // Resize observer
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Gráfico do cone da incerteza"
      style={{ display: 'block', width: '100%', height }}
    />
  );
};

export default ConeCanvas;
