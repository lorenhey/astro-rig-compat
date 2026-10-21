/**
 * AstroRigCompat Plotter v2.0.0
 * High-DPI Canvas 2D Multi-Panel Optical Train, Ray Tracing & Engineering Visualizers
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ARCPlotter = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (canvas.width || 600);
    const height = rect.height > 0 ? rect.height : (canvas.height || 300);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.resetTransform && ctx.resetTransform();
    ctx.scale(dpr, dpr);
    return { ctx, width, height };
  }

  /**
   * 1. OPTICAL TRAIN SCHEMATIC
   * Renders the longitudinal stack of optical components and thread interfaces
   */
  function drawOpticalTrain(canvas, rig, evalResult) {
    if (!canvas || !rig || !rig.components) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const comps = Object.values(rig.components).filter(c => c.type !== 'mount' && c.type !== 'power_supply');
    const n = comps.length;
    if (n === 0) return;

    const padX = 40;
    const centerY = height / 2 - 10;
    const availW = width - padX * 2;
    const blockW = Math.max(55, Math.min(130, availW / n - 14));
    const totalBlocksW = n * blockW + (n - 1) * 12;
    const startX = Math.max(padX, (width - totalBlocksW) / 2);

    // Draw central optical optical axis (cyan dashed line)
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);
    ctx.stroke();
    ctx.restore();

    let currentX = startX;

    comps.forEach((comp, idx) => {
      // Determine height based on component clear aperture
      let blockH = 80;
      let col = '#38bdf8';
      let typeLabel = comp.type.toUpperCase();

      if (comp.type === 'telescope') {
        blockH = 120;
        col = '#818cf8';
      } else if (comp.type === 'reducer' || comp.type === 'flattener' || comp.type === 'corrector') {
        blockH = 95;
        col = '#38bdf8';
      } else if (comp.type === 'spacer') {
        blockH = 75;
        col = '#0284c7';
      } else if (comp.type === 'filter_wheel') {
        blockH = 110;
        col = '#a855f7';
      } else if (comp.type === 'camera') {
        blockH = 100;
        col = '#10b981';
      }

      // Draw component outer box
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(currentX, centerY - blockH / 2, blockW, blockH, 6);
      ctx.fill();
      ctx.stroke();

      // Optical length / Dimension label on top
      const len = comp.optical_length || comp.flange_focal_distance || (comp.type === 'telescope' ? 'OTA' : '');
      if (len) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${len}`, currentX + blockW / 2, centerY - blockH / 2 - 8);
      }

      // Inside label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(typeLabel, currentX + blockW / 2, centerY - 6);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px system-ui, sans-serif';
      const shortModel = (comp.model || comp.id).substring(0, 14);
      ctx.fillText(shortModel, currentX + blockW / 2, centerY + 10);

      // Thread interface label at the output joint
      if (idx < n - 1) {
        const connX = currentX + blockW + 6;
        const isFaulty = evalResult && evalResult.subsystems.mechanical === 'INCOMPATIBLE';

        ctx.fillStyle = isFaulty ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(connX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
      currentX += blockW + 12;
    });

    // Backfocus dimension arrow at the bottom
    if (evalResult && evalResult.summary) {
      const sum = evalResult.summary;
      const arrowY = height - 35;
      const arrowStartX = startX + blockW; // from corrector output
      const arrowEndX = width - padX - 10;

      ctx.save();
      ctx.strokeStyle = sum.backfocusDelta === 0 ? '#10b981' : (Math.abs(sum.backfocusDelta) > 0.5 ? '#ef4444' : '#f59e0b');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY);
      ctx.lineTo(arrowEndX, arrowY);
      ctx.stroke();

      // Arrow ticks
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowY - 6);
      ctx.lineTo(arrowStartX, arrowY + 6);
      ctx.moveTo(arrowEndX, arrowY - 6);
      ctx.lineTo(arrowEndX, arrowY + 6);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const bfText = `Backfocus: ${sum.consumedBackfocus} mm / ${sum.totalBackfocusTarget} mm (Δ = ${sum.backfocusDelta > 0 ? '+' : ''}${sum.backfocusDelta} mm)`;
      ctx.fillText(bfText, (arrowStartX + arrowEndX) / 2, arrowY - 8);
      ctx.restore();
    }
  }

  /**
   * 2. OPTICAL RAY TRACING & VIGNETTING CONE
   * Longitudinal ray cone from telescope aperture to focal plane
   */
  function drawRayCone(canvas, rig) {
    if (!canvas || !rig) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const pad = 35;
    const cY = height / 2;

    const scope = Object.values(rig.components).find(c => c.type === 'telescope') || { aperture: '80 mm', f_ratio: 6.0 };
    const ap = parseFloat(scope.aperture) || 80;
    const fRatio = parseFloat(scope.f_ratio) || 6.0;

    const objX = pad + 20;
    const focalX = width - pad - 30;
    const objH = Math.min(height - pad * 2, ap * 1.3);

    // Draw optical axis
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(objX, cY);
    ctx.lineTo(focalX + 20, cY);
    ctx.stroke();
    ctx.restore();

    // Telescope objective aperture (left bar)
    ctx.save();
    ctx.fillStyle = 'rgba(129, 140, 248, 0.3)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX, cY - objH / 2);
    ctx.lineTo(objX, cY + objH / 2);
    ctx.stroke();

    // Draw convergent ray cone (marginal rays)
    const grad = ctx.createLinearGradient(objX, 0, focalX, 0);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(objX, cY - objH / 2);
    ctx.lineTo(focalX, cY); // converging to focal point
    ctx.lineTo(objX, cY + objH / 2);
    ctx.closePath();
    ctx.fill();

    // Marginal ray borders
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(objX, cY - objH / 2);
    ctx.lineTo(focalX, cY);
    ctx.moveTo(objX, cY + objH / 2);
    ctx.lineTo(focalX, cY);
    ctx.stroke();

    // Chief ray (center beam)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(objX, cY - objH / 3);
    ctx.lineTo(focalX, cY);
    ctx.moveTo(objX, cY + objH / 3);
    ctx.lineTo(focalX, cY);
    ctx.stroke();

    // Camera Sensor Focal Plane (vertical green bar)
    const cam = Object.values(rig.components).find(c => c.type === 'camera');
    const sensorH = cam && cam.sensor ? (parseFloat(cam.sensor.height) || 15) * 3 : 45;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(focalX, cY - sensorH / 2);
    ctx.lineTo(focalX, cY + sensorH / 2);
    ctx.stroke();

    // Overlay text
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Aperture: ${ap} mm`, objX - 10, cY - objH / 2 - 10);

    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText(`Sensor Plane (f/${fRatio.toFixed(1)})`, focalX + 20, cY - sensorH / 2 - 10);
    ctx.restore();
  }

  /**
   * 3. SENSOR VS IMAGE CIRCLE ILLUMINATION
   * Front-facing 2D view showing sensor rectangle against corrected optical circle
   */
  function drawSensorIllumination(canvas, rig) {
    if (!canvas || !rig) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const cam = Object.values(rig.components).find(c => c.type === 'camera') || {};
    const corr = Object.values(rig.components).find(c => c.optical_ports && c.optical_ports.out && c.optical_ports.out.image_circle) || {};

    const sensorW_mm = (cam.sensor && parseFloat(cam.sensor.width)) || 23.5;
    const sensorH_mm = (cam.sensor && parseFloat(cam.sensor.height)) || 15.7;
    const sensorDiag_mm = Math.sqrt(sensorW_mm ** 2 + sensorH_mm ** 2);
    const circle_mm = (corr.optical_ports && corr.optical_ports.out && parseFloat(corr.optical_ports.out.image_circle)) || 42.0;

    const scale = Math.min(width, height) / 58; // pixels per mm

    // Draw unvignetted image circle (cyan glow)
    const circleRadius = (circle_mm / 2) * scale;
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Concentric illumination gradient rings (100%, 90%, 70%)
    [0.85, 0.70].forEach((ratio, idx) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, circleRadius * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw Camera Sensor Rectangle (amber/green)
    const sW = sensorW_mm * scale;
    const sH = sensorH_mm * scale;
    const isVignetted = sensorDiag_mm > circle_mm;

    ctx.fillStyle = isVignetted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';
    ctx.strokeStyle = isVignetted ? '#ef4444' : '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - sW / 2, cy - sH / 2, sW, sH);
    ctx.fillRect(cx - sW / 2, cy - sH / 2, sW, sH);

    // Sensor diagonal line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - sW / 2, cy - sH / 2);
    ctx.lineTo(cx + sW / 2, cy + sH / 2);
    ctx.stroke();

    // Text Overlay
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Image Circle: Ø ${circle_mm.toFixed(1)} mm`, 15, 22);

    ctx.fillStyle = isVignetted ? '#ef4444' : '#10b981';
    ctx.fillText(`Sensor Diagonal: Ø ${sensorDiag_mm.toFixed(1)} mm`, 15, 38);
    ctx.font = '10px monospace';
    ctx.fillText(`Sensor Format: ${sensorW_mm} x ${sensorH_mm} mm`, 15, 52);

    const cornerIllumPct = Math.min(100, Math.max(40, (1 - Math.max(0, sensorDiag_mm - circle_mm) * 0.08) * 100));
    ctx.fillStyle = cornerIllumPct < 80 ? '#ef4444' : '#cbd5e1';
    ctx.fillText(`Corner Illuminance: ~${cornerIllumPct.toFixed(0)}%`, 15, 66);
    ctx.restore();
  }

  /**
   * 4. POWER & MOUNT LOAD GAUGES
   * Renders dual visual dials for Payload Ratio and 12V Current Load
   */
  function drawBudgets(canvas, rig, evalResult) {
    if (!canvas || !evalResult || !evalResult.summary) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    const sum = evalResult.summary;
    const midX = width / 2;
    const cY = height / 2 + 10;
    const radius = Math.min(width / 4, height / 2 - 25);

    // Draw Gauge Function
    function drawGauge(cx, label, val, max, unit, warnThresh = 0.65) {
      const ratio = max > 0 ? (val / max) : 0;
      const startAngle = Math.PI * 0.8;
      const endAngle = Math.PI * 2.2;
      const sweep = endAngle - startAngle;

      ctx.save();
      // Background arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cY, radius, startAngle, endAngle);
      ctx.stroke();

      // Filled value arc
      let color = '#10b981'; // Green
      if (ratio > 1.0) color = '#ef4444'; // Red
      else if (ratio > warnThresh) color = '#f59e0b'; // Amber

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cY, radius, startAngle, startAngle + sweep * Math.min(1.0, ratio));
      ctx.stroke();

      // Center value text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 1.3rem monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${val} ${unit}`, cx, cY - 2);

      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Max: ${max} ${unit} (${(ratio * 100).toFixed(0)}%)`, cx, cY + 16);

      // Label at top
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(label, cx, cY - radius - 12);
      ctx.restore();
    }

    // 1. Mount Payload Gauge (Left)
    drawGauge(midX / 2, 'Mount Payload Capacity', sum.totalPayloadKg, sum.mountCapacityKg, 'kg', 0.65);

    // 2. Power Load Gauge (Right)
    drawGauge(midX + midX / 2, 'PSU 12V Current Draw', sum.totalContAmps, sum.psuCapacityAmps, 'A', 0.80);
  }

  return {
    drawOpticalTrain,
    drawRayCone,
    drawSensorIllumination,
    drawBudgets
  };
});
