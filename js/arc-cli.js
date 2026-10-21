/**
 * AstroRigCompat In-Browser CLI v2.0.0
 * Interactive Astronomical Rig Terminal (arc:~$)
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ARCCLI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class CLI {
    constructor(terminalElement, onCommandExecuted) {
      this.term = terminalElement;
      this.history = [];
      this.historyIndex = -1;
      this.onCommandExecuted = onCommandExecuted || (() => {});
      this.currentRig = null;
      this.init();
    }

    init() {
      if (!this.term) return;
      this.term.innerHTML = `
        <div class="cli-output" id="cliOutput"></div>
        <div class="cli-input-line">
          <span class="cli-prompt">arc:~$</span>
          <input type="text" class="cli-input" id="cliInput" autocomplete="off" spellcheck="false" placeholder="Type 'help' or 'validate'...">
        </div>
      `;

      this.outputElem = this.term.querySelector('#cliOutput');
      this.inputElem = this.term.querySelector('#cliInput');

      this.printBanner();

      this.inputElem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = this.inputElem.value.trim();
          if (cmd) {
            this.history.push(cmd);
            this.historyIndex = this.history.length;
            this.execute(cmd);
            this.inputElem.value = '';
          }
        } else if (e.key === 'ArrowUp') {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.inputElem.value = this.history[this.historyIndex];
          }
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.inputElem.value = this.history[this.historyIndex];
          } else {
            this.historyIndex = this.history.length;
            this.inputElem.value = '';
          }
          e.preventDefault();
        }
      });
    }

    setRig(rig) {
      this.currentRig = rig;
    }

    printBanner() {
      this.log(`
<span class="text-sky">===============================================================</span>
<span class="text-emerald font-bold">  AstroRigCompat (ARC) v2.0.0 — Rig Engineering Constraints CLI</span>
<span class="text-slate">  Mechanical Threads &bull; Backfocus Solver &bull; Ray Tracing &bull; Electrical</span>
<span class="text-sky">===============================================================</span>
Type <span class="text-amber">'help'</span> for command list, or <span class="text-amber">'validate'</span> to evaluate active rig.
`);
    }

    log(html) {
      if (!this.outputElem) return;
      const line = document.createElement('div');
      line.className = 'cli-line';
      line.innerHTML = html;
      this.outputElem.appendChild(line);
      this.outputElem.scrollTop = this.outputElem.scrollHeight;
    }

    execute(cmdStr) {
      this.log(`<span class="cli-prompt">arc:~$</span> <span class="text-white">${escapeHtml(cmdStr)}</span>`);
      const parts = cmdStr.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (cmd) {
        case 'help':
          this.log(`
<span class="text-amber font-bold">Available Commands:</span>
  <span class="text-sky">rigs</span>                          List benchmark astronomical rigs
  <span class="text-sky">load &lt;id&gt;</span>                    Load rig by ID (e.g. 'load refractor-80-aps-c')
  <span class="text-sky">validate</span>                     Run multi-subsystem engineering constraint evaluation
  <span class="text-sky">backfocus &lt;mm&gt; [tol]</span>        Solve spacer combination to achieve missing backfocus
  <span class="text-sky">adapters &lt;from&gt; &lt;to&gt;</span>         Search catalog for thread step ring or adapter
  <span class="text-sky">power</span>                        Inspect 12V DC power & continuous/peak current load
  <span class="text-sky">vignetting</span>                   Analyze sensor diagonal vs corrected image circle
  <span class="text-sky">export [json|yaml]</span>           Export active rig definition and validation results
  <span class="text-sky">math</span>                         Display optical backfocus & filter refraction equations
  <span class="text-sky">clear</span>                        Clear terminal output buffer
  <span class="text-sky">about</span>                        Display engineering engine architecture
`);
          break;

        case 'rigs':
          if (window.ARCCatalog) {
            const list = window.ARCCatalog.getAllRigs();
            let table = `<table class="cli-table"><thead><tr><th>ID</th><th>Rig Name</th><th>Target Backfocus</th><th>Payload</th></tr></thead><tbody>`;
            list.forEach(r => {
              const scope = Object.values(r.components).find(c => c.type === 'telescope') || {};
              const corr = Object.values(r.components).find(c => c.required_backfocus) || {};
              table += `<tr><td class="text-sky font-bold">${r.id}</td><td>${r.name}</td><td>${corr.required_backfocus || 'N/A'}</td><td class="text-amber">${scope.mass || '-'}</td></tr>`;
            });
            table += `</tbody></table>`;
            this.log(table);
            this.log(`<span class="text-slate">Use 'load &lt;id&gt;' to load a rig into the workbench.</span>`);
          }
          break;

        case 'load':
          if (!args[0]) {
            this.log(`<span class="text-rose">Error: Specify rig ID. Example: 'load refractor-80-aps-c'</span>`);
            return;
          }
          if (window.ARCCatalog) {
            const rig = window.ARCCatalog.getRigById(args[0]);
            if (rig) {
              this.currentRig = rig;
              this.onCommandExecuted('load', rig);
              this.log(`<span class="text-emerald">Successfully loaded rig: <b>${rig.name}</b> (${Object.keys(rig.components).length} components)</span>`);
            } else {
              this.log(`<span class="text-rose">Unknown rig ID '${args[0]}'. Type 'rigs' to see catalog.</span>`);
            }
          }
          break;

        case 'validate':
          if (!this.currentRig) {
            this.log(`<span class="text-rose">No active rig loaded.</span>`);
            return;
          }
          if (window.ARCEngine) {
            const res = window.ARCEngine.evaluateRig(this.currentRig);
            const badgeColor = res.state === 'COMPATIBLE' ? '#10b981' : (res.state === 'COMPATIBLE WITH CONDITIONS' ? '#f59e0b' : '#ef4444');
            let out = `
<div class="cli-autopsy-box">
  <div class="cli-header-row">
    <span class="font-bold text-lg">${this.currentRig.name}</span>
    <span style="color: ${badgeColor}; font-weight: bold; border: 1px solid ${badgeColor}; padding: 2px 8px; border-radius: 4px;">${res.state} (Score: ${res.score}/100)</span>
  </div>
  <div class="cli-score-bars" style="margin-top: 8px;">
    Mechanical: <span class="${res.subsystems.mechanical === 'COMPATIBLE' ? 'text-emerald' : 'text-rose'}">${res.subsystems.mechanical}</span> |
    Optical: <span class="${res.subsystems.optical === 'COMPATIBLE' ? 'text-emerald' : 'text-rose'}">${res.subsystems.optical}</span> |
    Power: <span class="${res.subsystems.power === 'COMPATIBLE' ? 'text-emerald' : 'text-rose'}">${res.subsystems.power}</span> |
    Mounting: <span class="${res.subsystems.mounting === 'COMPATIBLE' ? 'text-emerald' : 'text-rose'}">${res.subsystems.mounting}</span>
  </div>
`;
            if (res.issues.length === 0) {
              out += `<div class="text-emerald font-bold" style="margin-top: 8px;">✓ All mechanical threads, optical tolerances, electrical power, and mount capacities are 100% compliant.</div>`;
            } else {
              out += `<div class="text-amber font-bold" style="margin-top: 8px;">Validation Diagnostic Log (${res.issues.length} items):</div>`;
              res.issues.forEach(iss => {
                const col = iss.severity === 'ERROR' ? 'text-rose' : (iss.severity === 'WARNING' ? 'text-amber' : 'text-sky');
                out += `<div style="margin-left: 12px; margin-top: 4px;"><span class="${col} font-bold">[${iss.severity}]</span> <span class="text-slate">${iss.subsystem}:</span> ${iss.message}</div>`;
              });
            }
            out += `</div>`;
            this.log(out);
          }
          break;

        case 'backfocus':
          const targetDist = parseFloat(args[0]);
          if (isNaN(targetDist)) {
            this.log(`<span class="text-rose">Usage: backfocus &lt;missing_mm&gt; [tolerance_mm]. Example: 'backfocus 37.5 0.5'</span>`);
            return;
          }
          const tol = parseFloat(args[1]) || 0.5;
          if (window.ARCEngine) {
            const solutions = window.ARCEngine.solveBackfocus(targetDist, tol);
            if (solutions.length === 0) {
              this.log(`<span class="text-rose">No spacer combination found within ±${tol} mm of ${targetDist} mm.</span>`);
            } else {
              this.log(`<div class="text-sky font-bold">Found ${solutions.length} spacer combination solutions for ${targetDist} mm (±${tol} mm):</div>`);
              let table = `<table class="cli-table"><thead><tr><th>#</th><th>Spacer Stack</th><th>Total Length</th><th>Delta</th></tr></thead><tbody>`;
              solutions.forEach((s, idx) => {
                const stackDesc = s.spacers.map(sp => `${sp.length}mm`).join(' + ');
                table += `<tr><td>${idx + 1}</td><td class="text-emerald font-bold">${stackDesc}</td><td>${s.totalLength} mm</td><td>${s.error > 0 ? '+' : ''}${s.error} mm</td></tr>`;
              });
              table += `</tbody></table>`;
              this.log(table);
            }
          }
          break;

        case 'adapters':
          const fromT = args[0] || 'M48x0.75 male';
          const toT = args[1] || 'M42x0.75 female';
          if (window.ARCEngine) {
            const matches = window.ARCEngine.solveAdapters(fromT, toT);
            if (matches.length === 0) {
              this.log(`<span class="text-rose">No direct adapter found between '${fromT}' and '${toT}'.</span>`);
            } else {
              this.log(`<div class="text-emerald font-bold">Matched Adapter Solution:</div>`);
              matches.forEach(m => {
                this.log(`&bull; <b>${m.model}</b>: Couples ${m.from} to ${m.to}`);
              });
            }
          }
          break;

        case 'power':
          if (!this.currentRig) {
            this.log(`<span class="text-rose">No active rig loaded.</span>`);
            return;
          }
          if (window.ARCEngine) {
            const sum = window.ARCEngine.evaluateRig(this.currentRig).summary;
            this.log(`
<div class="cli-autopsy-box">
  <div class="text-sky font-bold">Electrical Power Subsystem:</div>
  <div>Continuous Load: <b>${sum.totalContAmps} A</b> | Peak Surge: <b>${sum.totalPeakAmps} A</b></div>
  <div>PSU Rating: <b>${sum.psuCapacityAmps} A</b> (${((sum.totalContAmps / (sum.psuCapacityAmps || 1)) * 100).toFixed(0)}% utilization)</div>
  <div class="text-slate" style="margin-top: 4px;">Voltage Standard: 12.0 V DC (Center-Positive 5.5x2.1mm)</div>
</div>
`);
          }
          break;

        case 'vignetting':
          if (!this.currentRig) {
            this.log(`<span class="text-rose">No active rig loaded.</span>`);
            return;
          }
          if (window.ARCEngine) {
            const sum = window.ARCEngine.evaluateRig(this.currentRig).summary;
            this.log(`
<div class="cli-autopsy-box">
  <div class="text-sky font-bold">Geometric Vignetting Assessment:</div>
  <div>Corrected Image Circle: <b>Ø ${sum.imageCircle} mm</b></div>
  <div>Sensor Active Diagonal: <b>Ø ${sum.sensorDiagonal} mm</b></div>
  <div>Coverage Ratio: <b class="${sum.sensorDiagonal <= sum.imageCircle ? 'text-emerald' : 'text-rose'}">${((sum.imageCircle / sum.sensorDiagonal) * 100).toFixed(0)}%</b></div>
  <div class="text-slate" style="font-size: 0.9em; margin-top: 4px;">Status: ${sum.sensorDiagonal <= sum.imageCircle ? 'Full 100% illumination across entire sensor frame' : 'Corner light drop off / vignetting expected; requires flats'}</div>
</div>
`);
          }
          break;

        case 'export':
          if (!this.currentRig) {
            this.log(`<span class="text-rose">No active rig to export.</span>`);
            return;
          }
          const format = (args[0] || 'json').toLowerCase();
          this.onCommandExecuted('export', { format, rig: this.currentRig });
          this.log(`<span class="text-emerald">Generated and triggered download of ${format.toUpperCase()} export.</span>`);
          break;

        case 'math':
          this.log(`
<div class="cli-autopsy-box">
  <div class="text-sky font-bold">Optical & Mechanical Compatibility Equations:</div>
  <div style="font-family: monospace; font-size: 0.9em; margin-top: 6px; line-height: 1.6;">
    • <b>Filter Refractive Focus Shift:</b> Δz = t * (1 - 1 / n) ≈ t / 3 (for n ≈ 1.5)<br>
    • <b>Sensor Diagonal:</b> D_sensor = sqrt(Width² + Height²)<br>
    • <b>Effective Backfocus:</b> BF_eff = Σ d_spacers + d_flange - Δz_filter<br>
    • <b>Mount Payload Ratio:</b> R_mount = (Σ m_payload) / Capacity_rated (nom ≤ 65%)<br>
    • <b>Geometric Illuminance Falloff:</b> E(θ) = E_0 * cos⁴(θ)
  </div>
</div>
`);
          break;

        case 'clear':
          if (this.outputElem) this.outputElem.innerHTML = '';
          break;

        case 'about':
          this.log(`
<div class="cli-autopsy-box">
  <div class="text-emerald font-bold">AstroRigCompat (ARC) v2.0.0</div>
  <div class="text-slate">Astronomical Rig Engineering Constraints & Backfocus Solver Workbench</div>
  <div class="text-slate">Engineered by Loren &bull; Strict validation, zero guessing.</div>
  <div class="text-sky" style="margin-top: 6px;">Zero backend dependencies &bull; Pure HTML5 / Canvas 2D / KaTeX / Vanilla JS</div>
</div>
`);
          break;

        default:
          this.log(`<span class="text-rose">Unknown command: '${cmd}'. Type 'help' for available commands.</span>`);
          break;
      }
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { CLI };
});
