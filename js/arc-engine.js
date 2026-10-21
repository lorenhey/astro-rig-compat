/**
 * AstroRigCompat Engine v2.0.0
 * Astronomical Equipment Compatibility, Backfocus Solver, Optical Ray Tracing & Constraint Validator
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ARCEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Standard Astronomical Spacers Library
  const DEFAULT_SPACERS = [
    { id: 'm48-0.5', model: 'M48 Fine Tuning Ring 0.5mm', length: 0.5, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-1.0', model: 'M48 Fine Tuning Ring 1.0mm', length: 1.0, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-2.0', model: 'M48 Spacer 2.0mm', length: 2.0, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-5.0', model: 'M48 Extension Tube 5mm', length: 5.0, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-10.0', model: 'M48 Extension Tube 10mm', length: 10.0, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-16.5', model: 'M48 Extension Tube 16.5mm', length: 16.5, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-21.0', model: 'M48 Extension Tube 21mm', length: 21.0, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm48-30.0', model: 'M48 Extension Tube 30mm', length: 30.0, thread: 'M48x0.75', in: 'female', out: 'male' },
    { id: 'm54-16.5', model: 'M54 Extension Tube 16.5mm', length: 16.5, thread: 'M54x0.75', in: 'female', out: 'male' },
    { id: 'm54-21.0', model: 'M54 Extension Tube 21mm', length: 21.0, thread: 'M54x0.75', in: 'female', out: 'male' },
    { id: 'm42-16.5', model: 'M42 Extension Tube 16.5mm', length: 16.5, thread: 'M42x0.75', in: 'female', out: 'male' },
    { id: 'm42-21.0', model: 'M42 Extension Tube 21mm', length: 21.0, thread: 'M42x0.75', in: 'female', out: 'male' }
  ];

  // Helper parser for physical string values (e.g. "48 mm", "12 V", "3 kg")
  function parseUnit(val, defaultUnit = '') {
    if (val === null || val === undefined) return { value: 0, unit: defaultUnit };
    if (typeof val === 'number') return { value: val, unit: defaultUnit };
    const str = String(val).trim();
    const match = str.match(/^([+-]?[\d.]+)\s*([a-zA-Z°/]*)$/);
    if (match) {
      return { value: parseFloat(match[1]), unit: match[2] || defaultUnit };
    }
    return { value: 0, unit: defaultUnit };
  }

  /**
   * Main Rig Compatibility Evaluator
   */
  function evaluateRig(rig) {
    if (!rig || !rig.components) {
      return {
        state: 'NOT EVALUABLE',
        score: 0,
        subsystems: { mechanical: 'NOT EVALUABLE', optical: 'NOT EVALUABLE', power: 'NOT EVALUABLE', mounting: 'NOT EVALUABLE' },
        issues: [{ severity: 'ERROR', message: 'No components defined in rig.' }],
        summary: {}
      };
    }

    const issues = [];
    let mechState = 'COMPATIBLE';
    let optState = 'COMPATIBLE';
    let powState = 'COMPATIBLE';
    let mntState = 'COMPATIBLE';

    // 1. EVALUATE MECHANICAL CONNECTIONS
    const connections = rig.connections || [];
    const mechConns = connections.filter(c => c.connection_type === 'mechanical');

    mechConns.forEach((conn, idx) => {
      const src = rig.components[conn.from_component];
      const dst = rig.components[conn.to_component];

      if (!src) {
        issues.push({ subsystem: 'Mechanical', severity: 'ERROR', message: `Component '${conn.from_component}' not found in rig.` });
        mechState = 'INCOMPATIBLE';
        return;
      }
      if (!dst) {
        issues.push({ subsystem: 'Mechanical', severity: 'ERROR', message: `Component '${conn.to_component}' not found in rig.` });
        mechState = 'INCOMPATIBLE';
        return;
      }

      const pSrc = (src.mechanical_ports && src.mechanical_ports[conn.from_port]) || {};
      const pDst = (dst.mechanical_ports && dst.mechanical_ports[conn.to_port]) || {};

      const famSrc = pSrc.interface_family || 'unknown';
      const famDst = pDst.interface_family || 'unknown';

      if (famSrc !== famDst) {
        issues.push({
          subsystem: 'Mechanical',
          severity: 'ERROR',
          message: `Interface family mismatch between ${src.id}:${conn.from_port} (${famSrc}) and ${dst.id}:${conn.to_port} (${famDst}).`
        });
        mechState = 'INCOMPATIBLE';
        return;
      }

      if (famSrc === 'metric_thread') {
        const sizeSrc = parseUnit(pSrc.nominal_size).value;
        const sizeDst = parseUnit(pDst.nominal_size).value;
        const pitchSrc = parseUnit(pSrc.pitch).value;
        const pitchDst = parseUnit(pDst.pitch).value;

        if (sizeSrc !== sizeDst || pitchSrc !== pitchDst) {
          issues.push({
            subsystem: 'Mechanical',
            severity: 'ERROR',
            message: `Metric thread mismatch: M${sizeSrc}x${pitchSrc} (${src.id}) cannot couple with M${sizeDst}x${pitchDst} (${dst.id}).`
          });
          mechState = 'INCOMPATIBLE';
        }

        // Gender mating check
        const gSrc = (pSrc.gender || '').toLowerCase();
        const gDst = (pDst.gender || '').toLowerCase();
        if ((gSrc === 'male' && gDst === 'male') || (gSrc === 'female' && gDst === 'female')) {
          issues.push({
            subsystem: 'Mechanical',
            severity: 'ERROR',
            message: `Thread gender collision: Both interfaces are ${gSrc} (${src.id} ↔ ${dst.id}). Requires male-to-female mating.`
          });
          mechState = 'INCOMPATIBLE';
        }
      } else if (famSrc === 'dovetail') {
        const sSrc = (pSrc.nominal_size || '').toLowerCase();
        const sDst = (pDst.nominal_size || '').toLowerCase();
        if (sSrc !== sDst) {
          issues.push({
            subsystem: 'Mechanical',
            severity: 'ERROR',
            message: `Dovetail standard mismatch: '${sSrc}' vs '${sDst}' saddle.`
          });
          mechState = 'INCOMPATIBLE';
        }
      }
    });

    // 2. EVALUATE OPTICAL TRAIN & BACKFOCUS
    const scopes = Object.values(rig.components).filter(c => c.type === 'telescope');
    const cameras = Object.values(rig.components).filter(c => c.type === 'camera');
    const correctors = Object.values(rig.components).filter(c => c.type === 'reducer' || c.type === 'flattener' || c.type === 'corrector');

    let totalBackfocusTarget = 55.0; // standard default
    let consumedBackfocus = 0;
    let filterShift = 0;
    let backfocusDelta = 0;
    let imageCircle = 44.0;
    let sensorDiagonal = 28.3;

    if (scopes.length > 0 && cameras.length > 0) {
      const camera = cameras[0];
      const scope = scopes[0];

      // Sensor geometry
      if (camera.sensor) {
        const w = parseUnit(camera.sensor.width).value;
        const h = parseUnit(camera.sensor.height).value;
        sensorDiagonal = parseUnit(camera.sensor.diagonal).value || Math.sqrt(w * w + h * h);
      }

      // Check if corrector exists
      if (correctors.length > 0) {
        const corr = correctors[0];
        totalBackfocusTarget = parseUnit(corr.required_backfocus).value || 55.0;
        if (corr.optical_ports && corr.optical_ports.out && corr.optical_ports.out.image_circle) {
          imageCircle = parseUnit(corr.optical_ports.out.image_circle).value;
        }

        // Trace downstream components from corrector to camera
        // In our standard sequence: spacers, filter wheels, camera
        const spacers = Object.values(rig.components).filter(c => c.type === 'spacer' || c.type === 'adapter');
        const filters = Object.values(rig.components).filter(c => c.type === 'filter' || c.type === 'filter_wheel');

        spacers.forEach(sp => {
          consumedBackfocus += parseUnit(sp.optical_length).value;
        });

        filters.forEach(fw => {
          consumedBackfocus += parseUnit(fw.optical_length).value;
          if (fw.thickness || fw.filter_thickness) {
            const t = parseUnit(fw.thickness || fw.filter_thickness).value;
            const n = fw.refractive_index || 1.5;
            const shift = t * (1 - (1 / n));
            filterShift += shift;
          }
        });

        // Add camera flange focal distance
        const flange = parseUnit(camera.flange_focal_distance).value || 17.5;
        consumedBackfocus += flange;

        // Effective optical distance accounts for filter refraction adding to physical spacing
        const effectiveBackfocus = consumedBackfocus - filterShift;
        backfocusDelta = Number((effectiveBackfocus - totalBackfocusTarget).toFixed(2));

        const tolerance = corr.tolerance_mm || 0.5;
        if (Math.abs(backfocusDelta) > tolerance) {
          issues.push({
            subsystem: 'Optical',
            severity: 'ERROR',
            message: `Backfocus error: Consumed ${effectiveBackfocus.toFixed(2)} mm vs required ${totalBackfocusTarget.toFixed(2)} mm (Deviation: ${backfocusDelta > 0 ? '+' : ''}${backfocusDelta.toFixed(2)} mm).`
          });
          optState = 'INCOMPATIBLE';
        } else if (Math.abs(backfocusDelta) > 0.15) {
          issues.push({
            subsystem: 'Optical',
            severity: 'WARNING',
            message: `Backfocus within rough tolerance but sub-optimal: ${effectiveBackfocus.toFixed(2)} mm vs ${totalBackfocusTarget.toFixed(2)} mm.`
          });
          if (optState === 'COMPATIBLE') optState = 'COMPATIBLE WITH CONDITIONS';
        }

        if (filterShift > 0) {
          issues.push({
            subsystem: 'Optical',
            severity: 'INFO',
            message: `Optical filter introduces +${filterShift.toFixed(2)} mm refractive focus displacement (Physical distance adjusted).`
          });
        }
      }

      // Check Image Circle vs Sensor Diagonal
      if (sensorDiagonal > imageCircle) {
        issues.push({
          subsystem: 'Optical',
          severity: 'WARNING',
          message: `Sensor diagonal (${sensorDiagonal.toFixed(1)} mm) exceeds corrected image circle (${imageCircle.toFixed(1)} mm). Severe corner vignetting and optical aberrations expected.`
        });
        if (optState === 'COMPATIBLE') optState = 'COMPATIBLE WITH CONDITIONS';
      }
    }

    // 3. EVALUATE POWER & ELECTRICAL BUDGET
    const psus = Object.values(rig.components).filter(c => c.type === 'power_supply');
    const consumers = Object.values(rig.components).filter(c => c.electrical_ports && Object.keys(c.electrical_ports).some(k => c.electrical_ports[k].port_type === 'power_in'));

    let totalContAmps = 0;
    let totalPeakAmps = 0;
    let psuCapacityAmps = 0;
    let psuVoltage = 12.0;

    if (psus.length > 0) {
      const psu = psus[0];
      const pPort = Object.values(psu.electrical_ports || {})[0] || {};
      psuCapacityAmps = parseUnit(pPort.current).value || 10.0;
      psuVoltage = parseUnit(pPort.voltage).value || 12.0;

      consumers.forEach(comp => {
        Object.values(comp.electrical_ports || {}).forEach(ep => {
          if (ep.port_type === 'power_in') {
            const v = parseUnit(ep.voltage).value;
            const c = parseUnit(ep.current).value;
            const pk = parseUnit(ep.peak_current).value || c;

            if (v > 0 && Math.abs(v - psuVoltage) > 0.5) {
              issues.push({
                subsystem: 'Power',
                severity: 'ERROR',
                message: `Voltage mismatch on ${comp.id}: requires ${v}V but PSU supplies ${psuVoltage}V.`
              });
              powState = 'INCOMPATIBLE';
            }

            if (ep.polarity && pPort.polarity && ep.polarity !== pPort.polarity) {
              issues.push({
                subsystem: 'Power',
                severity: 'ERROR',
                message: `Polarity mismatch on ${comp.id}: ${ep.polarity} vs PSU ${pPort.polarity}. Reversed polarity will cause hardware damage.`
              });
              powState = 'INCOMPATIBLE';
            }

            totalContAmps += c;
            totalPeakAmps += pk;
          }
        });
      });

      if (totalContAmps > psuCapacityAmps) {
        issues.push({
          subsystem: 'Power',
          severity: 'ERROR',
          message: `Power overload: Total continuous load (${totalContAmps.toFixed(1)} A) exceeds PSU rating (${psuCapacityAmps.toFixed(1)} A). Voltage brownout imminent.`
        });
        powState = 'INCOMPATIBLE';
      } else if (totalPeakAmps > psuCapacityAmps * 1.15) {
        issues.push({
          subsystem: 'Power',
          severity: 'WARNING',
          message: `Peak current draw (${totalPeakAmps.toFixed(1)} A) exceeds PSU nominal rating (${psuCapacityAmps.toFixed(1)} A). Dew heater spikes may cause resets.`
        });
        if (powState === 'COMPATIBLE') powState = 'COMPATIBLE WITH CONDITIONS';
      }
    }

    // 4. EVALUATE MOUNT PAYLOAD CAPACITY
    const mounts = Object.values(rig.components).filter(c => c.type === 'mount');
    let totalPayloadKg = 0;
    let mountCapacityKg = 15.0;
    let payloadRatio = 0;

    if (mounts.length > 0) {
      const mount = mounts[0];
      mountCapacityKg = parseUnit(mount.payload_capacity).value || 15.0;

      Object.values(rig.components).forEach(c => {
        if (c.type !== 'mount' && c.type !== 'power_supply') {
          const m = parseUnit(c.mass);
          let kg = m.value;
          if (m.unit.toLowerCase() === 'g') kg = m.value / 1000;
          totalPayloadKg += kg;
        }
      });

      payloadRatio = mountCapacityKg > 0 ? (totalPayloadKg / mountCapacityKg) : 0;

      if (payloadRatio > 1.0) {
        issues.push({
          subsystem: 'Mounting',
          severity: 'ERROR',
          message: `Mount capacity exceeded: Total payload (${totalPayloadKg.toFixed(2)} kg) is ${(payloadRatio * 100).toFixed(0)}% of mount capacity (${mountCapacityKg.toFixed(1)} kg). Risk of motor stall or gear damage.`
        });
        mntState = 'INCOMPATIBLE';
      } else if (payloadRatio > 0.65) {
        issues.push({
          subsystem: 'Mounting',
          severity: 'WARNING',
          message: `Payload (${totalPayloadKg.toFixed(2)} kg) is ${(payloadRatio * 100).toFixed(0)}% of rated visual capacity. Recommended astrophotography ceiling is ≤ 60–65% for stable tracking.`
        });
        if (mntState === 'COMPATIBLE') mntState = 'COMPATIBLE WITH CONDITIONS';
      }
    }

    // Determine overall state
    let overallState = 'COMPATIBLE';
    if (mechState === 'INCOMPATIBLE' || optState === 'INCOMPATIBLE' || powState === 'INCOMPATIBLE' || mntState === 'INCOMPATIBLE') {
      overallState = 'INCOMPATIBLE';
    } else if (mechState === 'COMPATIBLE WITH CONDITIONS' || optState === 'COMPATIBLE WITH CONDITIONS' || powState === 'COMPATIBLE WITH CONDITIONS' || mntState === 'COMPATIBLE WITH CONDITIONS') {
      overallState = 'COMPATIBLE WITH CONDITIONS';
    }

    // Score calculation (0 - 100)
    let score = 100;
    if (mechState === 'INCOMPATIBLE') score -= 35;
    if (optState === 'INCOMPATIBLE') score -= 35;
    if (powState === 'INCOMPATIBLE') score -= 25;
    if (mntState === 'INCOMPATIBLE') score -= 25;

    if (mechState === 'COMPATIBLE WITH CONDITIONS') score -= 10;
    if (optState === 'COMPATIBLE WITH CONDITIONS') score -= 12;
    if (powState === 'COMPATIBLE WITH CONDITIONS') score -= 8;
    if (mntState === 'COMPATIBLE WITH CONDITIONS') score -= 10;

    score = Math.max(0, Math.min(100, score));

    return {
      state: overallState,
      score,
      subsystems: {
        mechanical: mechState,
        optical: optState,
        power: powState,
        mounting: mntState
      },
      issues,
      summary: {
        totalBackfocusTarget,
        consumedBackfocus: Number(consumedBackfocus.toFixed(2)),
        filterShift: Number(filterShift.toFixed(2)),
        backfocusDelta,
        imageCircle,
        sensorDiagonal: Number(sensorDiagonal.toFixed(1)),
        totalPayloadKg: Number(totalPayloadKg.toFixed(2)),
        mountCapacityKg,
        payloadRatio: Number((payloadRatio * 100).toFixed(1)),
        totalContAmps: Number(totalContAmps.toFixed(2)),
        totalPeakAmps: Number(totalPeakAmps.toFixed(2)),
        psuCapacityAmps
      }
    };
  }

  /**
   * Backfocus Combinatorial Spacer Solver
   */
  function solveBackfocus(missingDistance, tolerance = 0.5, maxSpacers = 4, customSpacers = DEFAULT_SPACERS) {
    const missing = Math.abs(missingDistance);
    if (missing < 0.1) return [];

    const solutions = [];

    function search(currentCombo, currentLen, startIdx) {
      if (currentCombo.length > maxSpacers) return;

      const delta = Math.abs(currentLen - missing);
      if (delta <= tolerance && currentCombo.length > 0) {
        solutions.push({
          spacers: [...currentCombo],
          totalLength: Number(currentLen.toFixed(2)),
          error: Number((currentLen - missing).toFixed(2))
        });
      }

      if (currentCombo.length === maxSpacers) return;

      for (let i = startIdx; i < customSpacers.length; i++) {
        const sp = customSpacers[i];
        if (currentLen + sp.length <= missing + tolerance * 1.5) {
          currentCombo.push(sp);
          search(currentCombo, currentLen + sp.length, i);
          currentCombo.pop();
        }
      }
    }

    search([], 0, 0);

    // Sort by fewest spacers first, then by smallest absolute error
    solutions.sort((a, b) => a.spacers.length - b.spacers.length || Math.abs(a.error) - Math.abs(b.error));
    return solutions.slice(0, 8); // Top 8 best solutions
  }

  /**
   * Mechanical Thread Adapter Path Finder
   */
  function solveAdapters(fromThread, toThread) {
    // Example: "M48x0.75 male" to "M42x0.75 female"
    const standardAdapters = [
      { from: 'M48x0.75 male', to: 'M42x0.75 female', model: 'M48M-M42F Step-Down Adapter (0mm optical length)' },
      { from: 'M54x0.75 male', to: 'M48x0.75 female', model: 'M54M-M48F Low-Profile Ring (2mm length)' },
      { from: 'M68x1.0 male', to: 'M54x0.75 female', model: 'M68M-M54F Adapter (5mm length)' },
      { from: 'M42x0.75 male', to: 'M48x0.75 female', model: 'M42M-M48F Step-Up Ring (2.5mm length)' },
      { from: 'M48x0.75 female', to: 'M48x0.75 female', model: 'M48 Gender Changer / Coupler (3mm length)' },
      { from: 'M42x0.75 female', to: 'M42x0.75 female', model: 'M42 Gender Changer / Coupler (3mm length)' }
    ];

    const match = standardAdapters.find(a => 
      (a.from.toLowerCase() === fromThread.toLowerCase() && a.to.toLowerCase() === toThread.toLowerCase()) ||
      (a.to.toLowerCase() === fromThread.toLowerCase() && a.from.toLowerCase() === toThread.toLowerCase())
    );

    return match ? [match] : [];
  }

  return {
    DEFAULT_SPACERS,
    parseUnit,
    evaluateRig,
    solveBackfocus,
    solveAdapters
  };
});
