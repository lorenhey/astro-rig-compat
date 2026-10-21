# AstroRigCompat (ARC) v2.0.0

[![Live Demo](https://img.shields.io/badge/GitHub%20Pages-Live%20Workbench-10b981?style=for-the-badge&logo=github)](https://lorenhey.github.io/astro-rig-compat/)
[![Tests](https://img.shields.io/badge/Tests-Passing%20100%25-brightgreen?style=for-the-badge)](https://github.com/lorenhey/astro-rig-compat/actions)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

An interactive, high-precision engineering constraints engine and optical ray-tracing workbench for validating the mechanical, optical, electrical, and structural compatibility of complete astrophotography rigs.

Access the interactive zero-backend web workbench directly in your browser:
👉 **[https://lorenhey.github.io/astro-rig-compat/](https://lorenhey.github.io/astro-rig-compat/)**

---

## 🚀 Key Capabilities in v2.0.0

### 1. Multi-Subsystem Engineering Constraints Engine
- **Mechanical Coupling**: Validates metric thread sizes ($M42$, $M48$, $M54$, etc.), pitches ($0.75\text{mm}$, $1.0\text{mm}$), interface families, and strict **male-to-female mating** (identifies gender collisions such as two males or two females facing each other).
- **Optical Backfocus & Refractive Index Tracing**: Computes cumulative optical train distance, accounting for glass filter refractive index displacement ($\Delta z = t \cdot \frac{n-1}{n} \approx \frac{t}{3}$) within user-defined tolerances (typically $\pm 0.5\text{mm}$).
- **Sensor Geometry & Geometric Vignetting**: Evaluates full-frame ($43.3\text{mm}$ diagonal), APS-C ($28.3\text{mm}$ diagonal), and 4/3" sensors against the unvignetted optical image circle diameter.
- **Electrical 12V DC Power Budget**: Verifies continuous and peak amperage draw against DC supply limits, voltage matching, and center-positive barrel polarity.
- **Equatorial Mount Payload Analysis**: Compares total imaging payload against mount rated capacities, enforcing the astrophotography guiding safety ceiling ($\le 60\% - 65\%$).

### 2. Multi-Panel Canvas 2D Visualizers
- **Optical Train Schematic**: True-to-scale proportional longitudinal blocks with color-coded component categories, active thread labels, and male-female coupling flags.
- **Ray Cone Convergence**: Marginal beam ray tracing from telescope objective / reducer lens through the critical depth-of-focus tolerance window onto the image sensor plane.
- **Sensor vs. Image Circle Illumination**: Top-down projection of rectangular sensor active area relative to fully illuminated and fall-off circles.
- **Dual Circular Metric Gauges**: Real-time needle indicators for Mount Payload % and 12V Current Draw with green/amber/red thresholds.

### 3. Integrated Solvers
- **Combinatorial Backfocus Spacer Solver**: Solves knapsack combinations of standard extension rings ($2\text{mm}, 5\text{mm}, 10\text{mm}, 15\text{mm}, 20\text{mm}, 30\text{mm}$) to eliminate backfocus deficits.
- **Adapter Path Matcher**: Computes transition adapters between mismatched thread sizes or genders.

### 4. In-Browser CLI (`arc:~$`)
An interactive terminal shell embedded directly in the web app:
- `help` — List all available commands
- `rigs` — List benchmark astronomical rigs
- `load <id>` — Load rig into live visualizer
- `validate` — Run full subsystem engineering audit
- `backfocus` — Inspect optical distance vs target
- `adapters` — Query mechanical coupling status
- `power` — Inspect DC current and peak amperage
- `vignetting` — Compute sensor diagonal vs circle
- `export` — Download rig JSON report

---

## 📐 Mathematical & Optical Foundations

### 1. Filter Refractive Light Path Displacement
When a flat optical glass filter of physical thickness $t$ and refractive index $n$ is inserted into a converging beam, the apparent focal plane shifts downstream by:
$$\Delta z = t \cdot \left(\frac{n - 1}{n}\right)$$
For standard astronomical filters ($t = 2.0\text{mm}$, $n \approx 1.5$):
$$\Delta z = 2.0 \cdot \left(\frac{0.5}{1.5}\right) = +0.667\text{mm}$$
The physical spacing must therefore be increased by $+0.67\text{mm}$ to maintain optimal field flattener performance.

### 2. Sensor Active Diagonal & Vignetting Ratio
For a sensor of width $W$ and height $H$:
$$D_{\text{sensor}} = \sqrt{W^2 + H^2}$$
The illumination coverage ratio relative to the corrected image circle $\Phi_{\text{circle}}$ is:
$$R_{\text{illum}} = \frac{\Phi_{\text{circle}}}{D_{\text{sensor}}}$$
- $R_{\text{illum}} \ge 1.0$: Fully illuminated field across all pixels.
- $R_{\text{illum}} < 1.0$: Geometric vignetting occurs at corners; flat-frame calibration required.

### 3. Equatorial Mount Payload Safety Ratio
$$\eta_{\text{mount}} = \frac{\sum m_{\text{payload}}}{C_{\text{rated}}} \times 100\%$$
- $\eta \le 60\% - 65\%$: Optimal for sub-arcsecond autoguiding and wind rejection.
- $65\% < \eta \le 100\%$: Marginal; acceptable for visual observation or short exposures.
- $\eta > 100\%$: Mechanical overload; motor stalling, gear wear, or tracking failure.

---

## 🔭 Included Benchmark Rig Configurations

1. **`refractor-80-aps-c`**: 80mm ED Triplet ($f/6$) + $0.8\times$ Reducer/Flattener + M48 Spacers + ZWO ASI2600MM ($55.0\text{mm}$ target BF). Verdict: `COMPATIBLE` (Score 100/100).
2. **`edgehd8-oag-full`**: Celestron EdgeHD 8" + $0.7\times$ Reducer + Celestron OAG + 7-position EFW with $2\text{mm}$ filters ($\Delta z = +0.67\text{mm}$, target $105.0\text{mm}$). Verdict: `COMPATIBLE WITH CONDITIONS` (Score 88/100).
3. **`esprit100-full-frame`**: Sky-Watcher Esprit 100ED ($f/5.5$) + M54 Dedicated Flattener + ASI6200MM Full Frame ($43.3\text{mm}$ diagonal vs $44.0\text{mm}$ image circle). Verdict: `COMPATIBLE` (Score 98/100).
4. **`hyperbolic-newtonian-150`**: Sharpstar 15028HNT ($f/2.8$) + Carbon Fiber Tube + ASI2600MC ($55.0\pm 0.2\text{mm}$ critical BF). Verdict: `COMPATIBLE` (Score 100/100).
5. **`pathological-thread-gender-collision`**: M48 male-to-male collision, M42 thread pitch mismatch, $-16.5\text{mm}$ backfocus deficit. Verdict: `INCOMPATIBLE` (Score 20/100).
6. **`pathological-mount-overload-power`**: $12.5\text{kg}$ imaging payload on $7.0\text{kg}$ EQ3 mount ($178\%$ overload) with $7.8\text{A}$ current draw on $3.0\text{A}$ power supply. Verdict: `INCOMPATIBLE` (Score 15/100).

---

## 🛠️ Local Python Development & CLI

Install via [uv](https://github.com/astral-sh/uv):

```bash
git clone https://github.com/lorenhey/astro-rig-compat.git
cd astro-rig-compat
uv venv
uv pip install -e .
```

Run test suite:
```bash
pytest tests/ -v
```

CLI commands:
```bash
# Validate complete rig
astro-rig-compat check catalog/golden_rig_valid.yaml

# Combinatorial backfocus solver
astro-rig-compat backfocus 16.5 --tolerance-mm 0.5

# Thread adapter matcher
astro-rig-compat adapters metric_thread "54 mm" "0.75 mm" male metric_thread "42 mm" "0.75 mm" female
```

---

## 📄 License

MIT License &bull; Copyright &copy; 2026 Loren (`lorenhey`).
