# astro-rig-compat

An engineering constraints engine for validating the compatibility of astronomical rigs (telescopes, cameras, filters, mounts, power supplies, etc.).

## Philosophy
Compatibility is a system of constraints. "M48" is not enough; it's `M48x0.75 male` vs `M48x0.75 female`. This tool does not guess. If data is missing, it returns `UNKNOWN`.

## Features
- **Mechanical Validation**: Checks thread sizes, pitches, genders, and interface families.
- **Optical Validation**: Validates backfocus distances (accounting for filter thickness shifts), checks image circle vs sensor diagonal, and evaluates basic geometric vignetting.
- **Power Validation**: Validates voltage, polarity, and peak/continuous current draws against power supplies.
- **Mounting Validation**: Checks total rig payload against mount capacity.
- **Solvers**: 
  - `adapters`: Finds a path through a catalog of adapters to connect two mismatched threads.
  - `backfocus`: Finds combinations of spacers to fill a required backfocus distance.

## Installation

You need [uv](https://github.com/astral-sh/uv) installed.

```bash
uv pip install -e .
```

## Usage

### Validate a Rig
```bash
astro-rig-compat check catalog/golden_rig_valid.yaml
```

### Find Missing Data
```bash
astro-rig-compat unknowns catalog/golden_rig_valid.yaml
```

### Solve Backfocus
```bash
astro-rig-compat backfocus 7.0 --tolerance-mm 0.5
```

### Find Adapters
```bash
astro-rig-compat adapters metric_thread "54 mm" "0.75 mm" male metric_thread "42 mm" "0.75 mm" female
```
