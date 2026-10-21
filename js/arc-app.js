/**
 * AstroRigCompat Main App Controller v2.0.0
 * (c) 2026 Loren - MIT License
 */

(function () {
  'use strict';

  let currentRig = null;
  let currentEval = null;
  let cliInstance = null;

  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    // Populate rig dropdown
    const select = document.getElementById('rigSelect');
    if (select && window.ARCCatalog) {
      select.innerHTML = '';
      const list = window.ARCCatalog.getAllRigs();
      list.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        loadRig(e.target.value);
      });
    }

    // Initialize CLI
    const termElem = document.getElementById('cliTerminal');
    if (termElem && window.ARCCLI) {
      cliInstance = new window.ARCCLI.CLI(termElem, (action, data) => {
        if (action === 'load') {
          currentRig = data;
          if (select) select.value = data.id;
          updateUI();
        } else if (action === 'export') {
          handleExport(data.format, data.rig);
        }
      });
    }

    // Tab navigation
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        switchTab(target);
      });
    });

    // File Drag and Drop
    initFileDrop();

    // Export & Action buttons
    const btnExportJson = document.getElementById('btnExportJson');
    if (btnExportJson) btnExportJson.addEventListener('click', () => handleExport('json', currentRig));

    const btnCopySummary = document.getElementById('btnCopySummary');
    if (btnCopySummary) btnCopySummary.addEventListener('click', copySummaryToClipboard);

    // Interactive Spacer Solver button
    const btnRunSolver = document.getElementById('btnRunSolver');
    if (btnRunSolver) btnRunSolver.addEventListener('click', runSpacerSolver);

    // Initial load: First benchmark rig
    if (window.ARCCatalog) {
      loadRig('refractor-80-aps-c');
    }

    // Window resize handler
    window.addEventListener('resize', debounce(() => {
      renderAllCharts();
    }, 150));
  }

  function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `pane-${tabId}`);
    });
    renderAllCharts();
  }

  function loadRig(id) {
    if (!window.ARCCatalog) return;
    currentRig = window.ARCCatalog.getRigById(id);
    if (cliInstance) cliInstance.setRig(currentRig);
    updateUI();
  }

  function updateUI() {
    if (!currentRig) return;

    // Run engineering evaluation
    if (window.ARCEngine) {
      currentEval = window.ARCEngine.evaluateRig(currentRig);
    }

    // Update Header & Equipment Meta
    const titleEl = document.getElementById('rigTitle');
    if (titleEl) titleEl.textContent = currentRig.name;

    const descEl = document.getElementById('rigDesc');
    if (descEl) descEl.textContent = currentRig.description;

    const infoEl = document.getElementById('rigInfo');
    if (infoEl) {
      const scope = Object.values(currentRig.components).find(c => c.type === 'telescope') || {};
      const cam = Object.values(currentRig.components).find(c => c.type === 'camera') || {};
      const mount = Object.values(currentRig.components).find(c => c.type === 'mount') || {};
      const corr = Object.values(currentRig.components).find(c => c.required_backfocus) || {};

      infoEl.innerHTML = `
        <span>🔭 <b>Scope:</b> ${scope.model || scope.id || 'N/A'} (${scope.aperture || '-'}, ${scope.focal_length || '-'})</span>
        <span>📷 <b>Camera:</b> ${cam.model || cam.id || 'N/A'} (${cam.sensor ? cam.sensor.diagonal || '' : ''})</span>
        <span>⚙️ <b>Mount:</b> ${mount.model || mount.id || 'N/A'} (Cap: ${mount.payload_capacity || '-'})</span>
        <span>📐 <b>Target BF:</b> ${corr.required_backfocus || 'N/A'}</span>
      `;
    }

    // Update Compatibility Verdict Card
    if (currentEval) {
      const badge = document.getElementById('compatBadge');
      if (badge) {
        badge.textContent = currentEval.state;
        let col = '#10b981';
        if (currentEval.state === 'INCOMPATIBLE') col = '#ef4444';
        else if (currentEval.state === 'COMPATIBLE WITH CONDITIONS') col = '#f59e0b';
        else if (currentEval.state === 'UNKNOWN') col = '#94a3b8';

        badge.style.backgroundColor = col + '25';
        badge.style.borderColor = col;
        badge.style.color = col;
      }

      const scoreEl = document.getElementById('compatScoreVal');
      if (scoreEl) {
        scoreEl.textContent = currentEval.score;
        let col = '#10b981';
        if (currentEval.score < 60) col = '#ef4444';
        else if (currentEval.score < 90) col = '#f59e0b';
        scoreEl.style.color = col;
      }

      // Subsystem pills
      updateSubsystemStatus('statusMech', currentEval.subsystems.mechanical);
      updateSubsystemStatus('statusOpt', currentEval.subsystems.optical);
      updateSubsystemStatus('statusPow', currentEval.subsystems.power);
      updateSubsystemStatus('statusMnt', currentEval.subsystems.mounting);

      // Render Issues
      renderIssues(currentEval.issues);

      // Render KPI cards
      const sum = currentEval.summary;
      setVal('kpiBf', `${sum.consumedBackfocus || 0} mm`);
      setVal('kpiBfDelta', `Δ ${(sum.backfocusDelta > 0 ? '+' : '') + (sum.backfocusDelta || 0)} mm`);
      setVal('kpiCircle', `Ø ${sum.imageCircle || 0} mm`);
      setVal('kpiDiag', `Ø ${sum.sensorDiagonal || 0} mm`);
      setVal('kpiPayload', `${sum.totalPayloadKg || 0} kg`);
      setVal('kpiPayloadRatio', `${sum.payloadRatio || 0}% cap`);
      setVal('kpiAmps', `${sum.totalContAmps || 0} A`);
      setVal('kpiAmpsPeak', `Peak ${sum.totalPeakAmps || 0} A`);
    }

    // Render Canvas Charts
    renderAllCharts();

    // Trigger KaTeX rendering
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  }

  function updateSubsystemStatus(elId, state) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = state;
    el.className = 'subscore-val';
    if (state === 'COMPATIBLE') el.classList.add('text-emerald');
    else if (state === 'COMPATIBLE WITH CONDITIONS') el.classList.add('text-amber');
    else if (state === 'INCOMPATIBLE') el.classList.add('text-rose');
    else el.classList.add('text-slate');
  }

  function renderIssues(issues) {
    const container = document.getElementById('issuesList');
    if (!container) return;

    if (!issues || issues.length === 0) {
      container.innerHTML = `
        <div class="finding-card optimal">
          <div class="finding-header">
            <span class="finding-title text-emerald">✓ PERFECT RIG COMPATIBILITY</span>
            <span class="finding-badge badge-pass">PASS</span>
          </div>
          <p class="finding-desc">All optical backfocus tolerances, mechanical threads, mount payloads, and 12V electrical current ratings are 100% compliant.</p>
        </div>
      `;
    } else {
      container.innerHTML = issues.map(iss => {
        const badgeClass = iss.severity === 'ERROR' ? 'badge-fail' : (iss.severity === 'WARNING' ? 'badge-warn' : 'badge-info');
        const cardClass = iss.severity === 'ERROR' ? 'critical' : (iss.severity === 'WARNING' ? 'major' : 'moderate');
        return `
          <div class="finding-card ${cardClass}">
            <div class="finding-header">
              <span class="finding-title">[${iss.subsystem}] ${iss.message.split(':')[0]}</span>
              <span class="finding-badge ${badgeClass}">${iss.severity}</span>
            </div>
            <p class="finding-desc">${iss.message}</p>
          </div>
        `;
      }).join('');
    }
  }

  function renderAllCharts() {
    if (!currentRig || !window.ARCPlotter) return;

    const trainCanvas = document.getElementById('canvasOpticalTrain');
    if (trainCanvas) window.ARCPlotter.drawOpticalTrain(trainCanvas, currentRig, currentEval);

    const rayCanvas = document.getElementById('canvasRayCone');
    if (rayCanvas) window.ARCPlotter.drawRayCone(rayCanvas, currentRig);

    const sensorCanvas = document.getElementById('canvasSensor');
    if (sensorCanvas) window.ARCPlotter.drawSensorIllumination(sensorCanvas, currentRig);

    const budgetCanvas = document.getElementById('canvasBudgets');
    if (budgetCanvas) window.ARCPlotter.drawBudgets(budgetCanvas, currentRig, currentEval);
  }

  function runSpacerSolver() {
    const inputDist = document.getElementById('solverDistInput');
    const inputTol = document.getElementById('solverTolInput');
    const resultsContainer = document.getElementById('solverResults');

    if (!inputDist || !resultsContainer || !window.ARCEngine) return;

    const dist = parseFloat(inputDist.value) || 0;
    const tol = parseFloat(inputTol.value) || 0.5;

    if (dist <= 0) {
      resultsContainer.innerHTML = `<div class="text-amber">Enter a missing backfocus distance greater than 0 mm.</div>`;
      return;
    }

    const solutions = window.ARCEngine.solveBackfocus(dist, tol);
    if (solutions.length === 0) {
      resultsContainer.innerHTML = `<div class="text-rose font-bold">No spacer combinations found within ±${tol} mm of ${dist} mm.</div>`;
    } else {
      let table = `<table class="cli-table"><thead><tr><th>Option</th><th>Spacer Stack</th><th>Total Thickness</th><th>Delta</th></tr></thead><tbody>`;
      solutions.forEach((s, idx) => {
        const stackDesc = s.spacers.map(sp => `${sp.model} (${sp.length}mm)`).join(' + ');
        table += `<tr><td><b>#${idx + 1}</b></td><td class="text-emerald font-bold">${stackDesc}</td><td>${s.totalLength} mm</td><td>${s.error > 0 ? '+' : ''}${s.error} mm</td></tr>`;
      });
      table += `</tbody></table>`;
      resultsContainer.innerHTML = table;
    }
  }

  function setVal(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function handleExport(format, rig) {
    if (!rig) return;
    let dataStr = '';
    let filename = `ARC_${rig.id}_${Date.now()}.json`;

    const exportObj = {
      rig,
      validation_result: currentEval,
      generator: 'AstroRigCompat v2.0.0 (https://lorenhey.github.io/astro-rig-compat/)'
    };
    dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function copySummaryToClipboard() {
    if (!currentRig || !currentEval) return;
    const text = `AstroRigCompat Assessment Summary:
Rig: ${currentRig.name}
Overall Compatibility: ${currentEval.state} (Score: ${currentEval.score}/100)
Mechanical Subsystem: ${currentEval.subsystems.mechanical}
Optical Subsystem: ${currentEval.subsystems.optical}
Power Subsystem: ${currentEval.subsystems.power}
Mount Subsystem: ${currentEval.subsystems.mounting}
Issues / Constraints:
${currentEval.issues.map(i => `- [${i.severity}] ${i.subsystem}: ${i.message}`).join('\n')}
`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Rig compatibility summary copied to clipboard!');
    }).catch(() => {
      prompt('Copy summary manually:', text);
    });
  }

  function initFileDrop() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let rig = null;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          rig = parsed.rig || parsed;
        } else {
          alert('Custom rig JSON upload supported. Please provide a valid rig .json file.');
          return;
        }

        if (rig && rig.components) {
          currentRig = rig;
          if (cliInstance) cliInstance.setRig(currentRig);
          updateUI();
          alert(`Loaded custom rig '${currentRig.name || file.name}' with ${Object.keys(currentRig.components).length} components.`);
        }
      } catch (err) {
        alert('Failed to parse rig file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }
})();
