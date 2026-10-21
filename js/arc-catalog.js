/**
 * AstroRigCompat Benchmark Catalog v2.0.0
 * 6 Realistic Astronomical Rigs: Golden Standards & Pathological Boundary Test Cases
 * (c) 2026 Loren - MIT License
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ARCCatalog = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const RIGS = [
    // 1. Golden Reference: Generic 80mm Refractor + Reducer + Spacers + ASI2600MM (COMPATIBLE)
    {
      id: 'refractor-80-aps-c',
      name: 'Refractor 80mm f/6 + 0.8x Reducer + ASI2600MM (APS-C)',
      description: 'Golden reference imaging train: Perfect 55.0 mm backfocus alignment (16.5mm + 21mm + 17.5mm camera flange), M48 thread coupling, EQ6 mount with 32% payload ratio.',
      components: {
        scope: {
          id: 'scope',
          type: 'telescope',
          model: 'Generic Triplet APO 80mm',
          aperture: '80 mm',
          focal_length: '480 mm',
          f_ratio: 6.0,
          mass: '3.2 kg',
          mechanical_ports: {
            focuser_out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            mount: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'male' }
          }
        },
        reducer: {
          id: 'reducer',
          type: 'reducer',
          model: '0.8x Focal Reducer / Field Flattener',
          reduction_factor: 0.8,
          required_backfocus: '55.0 mm',
          mass: '0.25 kg',
          optical_length: '0 mm', // focal reference plane
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          },
          optical_ports: {
            out: { image_circle: '42.0 mm' }
          }
        },
        spacer1: {
          id: 'spacer1',
          type: 'spacer',
          model: 'M48 Extension Tube 16.5mm',
          optical_length: '16.5 mm',
          mass: '0.04 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        spacer2: {
          id: 'spacer2',
          type: 'spacer',
          model: 'M48 to M42 Extension Tube 21mm',
          optical_length: '21.0 mm',
          mass: '0.05 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '42 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        camera: {
          id: 'camera',
          type: 'camera',
          model: 'ZWO ASI2600MM Pro',
          mass: '0.70 kg',
          flange_focal_distance: '17.5 mm',
          sensor: { width: '23.5 mm', height: '15.7 mm', diagonal: '28.3 mm', pixel_size: '3.76 um' },
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '42 mm', pitch: '0.75 mm', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '0.8 A', peak_current: '3.0 A', polarity: 'center_positive' }
          }
        },
        mount: {
          id: 'mount',
          type: 'mount',
          model: 'Sky-Watcher EQ6-R Pro',
          payload_capacity: '20.0 kg',
          mass: '17.3 kg',
          mechanical_ports: {
            saddle: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.2 A', peak_current: '4.0 A', polarity: 'center_positive' }
          }
        },
        psu: {
          id: 'psu',
          type: 'power_supply',
          model: 'MeanWell 12V 10A Industrial Supply',
          mass: '0.8 kg',
          electrical_ports: {
            out1: { port_type: 'power_out', voltage: '12 V', current: '10.0 A', peak_current: '12.0 A', polarity: 'center_positive' }
          }
        }
      },
      connections: [
        { from_component: 'scope', from_port: 'focuser_out', to_component: 'reducer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'reducer', from_port: 'out', to_component: 'spacer1', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'spacer1', from_port: 'out', to_component: 'spacer2', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'spacer2', from_port: 'out', to_component: 'camera', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'scope', from_port: 'mount', to_component: 'mount', to_port: 'saddle', connection_type: 'mechanical' },
        { from_component: 'psu', from_port: 'out1', to_component: 'mount', to_port: 'power_in', connection_type: 'power' },
        { from_component: 'psu', from_port: 'out1', to_component: 'camera', to_port: 'power_in', connection_type: 'power' }
      ]
    },

    // 2. Celestron EdgeHD 8" + 0.7x Reducer + OAG + Filter Wheel (COMPATIBLE WITH CONDITIONS: Filter Refraction)
    {
      id: 'edgehd8-oag-full',
      name: 'Celestron EdgeHD 8" + 0.7x Reducer + OAG + EFW (Strict 105mm BF)',
      description: 'SCT configuration requiring strict 105.0 mm backfocus. Incorporates a 2 mm thick astronomical filter which introduces a +0.67 mm optical displacement.',
      components: {
        scope: {
          id: 'scope',
          type: 'telescope',
          model: 'Celestron EdgeHD 8" OTA',
          aperture: '203 mm',
          focal_length: '2032 mm',
          f_ratio: 10.0,
          mass: '6.3 kg',
          mechanical_ports: {
            focuser_out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            mount: { interface_family: 'dovetail', nominal_size: 'cge', gender: 'male' }
          }
        },
        reducer: {
          id: 'reducer',
          type: 'reducer',
          model: 'EdgeHD 8" 0.7x Focal Reducer',
          reduction_factor: 0.7,
          required_backfocus: '105.0 mm',
          tolerance_mm: 1.0,
          mass: '0.65 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          },
          optical_ports: {
            out: { image_circle: '42.0 mm' }
          }
        },
        spacer: {
          id: 'spacer',
          type: 'spacer',
          model: 'EdgeHD T-Adapter 38.5mm',
          optical_length: '38.5 mm',
          mass: '0.12 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        oag: {
          id: 'oag',
          type: 'spacer',
          model: 'Celestron Off-Axis Guider (OAG)',
          optical_length: '29.0 mm',
          mass: '0.35 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        efw: {
          id: 'efw',
          type: 'filter_wheel',
          model: 'ZWO EFW 8x 1.25" / 31mm',
          optical_length: '20.0 mm',
          filter_thickness: '2.0 mm',
          refractive_index: 1.5,
          mass: '0.40 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '42 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        camera: {
          id: 'camera',
          type: 'camera',
          model: 'ZWO ASI2600MM Pro',
          mass: '0.70 kg',
          flange_focal_distance: '17.5 mm',
          sensor: { width: '23.5 mm', height: '15.7 mm', diagonal: '28.3 mm' },
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '42 mm', pitch: '0.75 mm', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.0 A', peak_current: '3.0 A', polarity: 'center_positive' }
          }
        },
        mount: {
          id: 'mount',
          type: 'mount',
          model: 'ZWO AM5 Harmonic Drive Mount',
          payload_capacity: '13.0 kg',
          mass: '5.0 kg',
          mechanical_ports: {
            saddle: { interface_family: 'dovetail', nominal_size: 'cge', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.5 A', peak_current: '3.5 A', polarity: 'center_positive' }
          }
        },
        psu: {
          id: 'psu',
          type: 'power_supply',
          model: '12V 8A Desktop Adapter',
          mass: '0.5 kg',
          electrical_ports: {
            out1: { port_type: 'power_out', voltage: '12 V', current: '8.0 A', peak_current: '10.0 A', polarity: 'center_positive' }
          }
        }
      },
      connections: [
        { from_component: 'scope', from_port: 'focuser_out', to_component: 'reducer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'reducer', from_port: 'out', to_component: 'spacer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'spacer', from_port: 'out', to_component: 'oag', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'oag', from_port: 'out', to_component: 'efw', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'efw', from_port: 'out', to_component: 'camera', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'scope', from_port: 'mount', to_component: 'mount', to_port: 'saddle', connection_type: 'mechanical' },
        { from_component: 'psu', from_port: 'out1', to_component: 'mount', to_port: 'power_in', connection_type: 'power' },
        { from_component: 'psu', from_port: 'out1', to_component: 'camera', to_port: 'power_in', connection_type: 'power' }
      ]
    },

    // 3. Sky-Watcher Esprit 100ED + Full Frame ASI6200MM (COMPATIBLE)
    {
      id: 'esprit100-full-frame',
      name: 'Esprit 100ED Super APO + M54 Flattener + ASI6200MM (Full Frame)',
      description: 'High-end wide-field full-frame rig: 44.0 mm image circle matches 43.3 mm sensor diagonal. M54 large clear aperture eliminates mechanical vignetting.',
      components: {
        scope: {
          id: 'scope',
          type: 'telescope',
          model: 'Sky-Watcher Esprit 100ED Super APO',
          aperture: '100 mm',
          focal_length: '550 mm',
          f_ratio: 5.5,
          mass: '7.4 kg',
          mechanical_ports: {
            focuser_out: { interface_family: 'metric_thread', nominal_size: '68 mm', pitch: '1.0 mm', gender: 'female' },
            mount: { interface_family: 'dovetail', nominal_size: 'losmandy', gender: 'male' }
          }
        },
        flattener: {
          id: 'flattener',
          type: 'flattener',
          model: 'Esprit 100 Dedicated Field Flattener',
          required_backfocus: '55.0 mm',
          mass: '0.45 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '68 mm', pitch: '1.0 mm', gender: 'male' },
            out: { interface_family: 'metric_thread', nominal_size: '54 mm', pitch: '0.75 mm', gender: 'male' }
          },
          optical_ports: {
            out: { image_circle: '44.0 mm' }
          }
        },
        spacer: {
          id: 'spacer',
          type: 'spacer',
          model: 'M54 Extension Spacer 17.5mm',
          optical_length: '17.5 mm',
          mass: '0.06 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '54 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '54 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        efw: {
          id: 'efw',
          type: 'filter_wheel',
          model: 'ZWO EFW 7x 2" Full Frame',
          optical_length: '20.0 mm',
          mass: '0.55 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '54 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '54 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        camera: {
          id: 'camera',
          type: 'camera',
          model: 'ZWO ASI6200MM Pro (Full Frame)',
          mass: '0.90 kg',
          flange_focal_distance: '17.5 mm',
          sensor: { width: '36.0 mm', height: '24.0 mm', diagonal: '43.3 mm', pixel_size: '3.76 um' },
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '54 mm', pitch: '0.75 mm', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.5 A', peak_current: '4.0 A', polarity: 'center_positive' }
          }
        },
        mount: {
          id: 'mount',
          type: 'mount',
          model: 'iOptron CEM70 Center-Balanced Mount',
          payload_capacity: '31.8 kg',
          mass: '13.6 kg',
          mechanical_ports: {
            saddle: { interface_family: 'dovetail', nominal_size: 'losmandy', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.5 A', peak_current: '4.5 A', polarity: 'center_positive' }
          }
        },
        psu: {
          id: 'psu',
          type: 'power_supply',
          model: '12V 10A Stabilized Supply',
          mass: '0.9 kg',
          electrical_ports: {
            out1: { port_type: 'power_out', voltage: '12 V', current: '10.0 A', peak_current: '12.0 A', polarity: 'center_positive' }
          }
        }
      },
      connections: [
        { from_component: 'scope', from_port: 'focuser_out', to_component: 'flattener', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'flattener', from_port: 'out', to_component: 'spacer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'spacer', from_port: 'out', to_component: 'efw', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'efw', from_port: 'out', to_component: 'camera', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'scope', from_port: 'mount', to_component: 'mount', to_port: 'saddle', connection_type: 'mechanical' },
        { from_component: 'psu', from_port: 'out1', to_component: 'mount', to_port: 'power_in', connection_type: 'power' },
        { from_component: 'psu', from_port: 'out1', to_component: 'camera', to_port: 'power_in', connection_type: 'power' }
      ]
    },

    // 4. Sharpstar 15028HNT Hyperbolic Newtonian (Fast f/2.8 light cone, critical tolerance)
    {
      id: 'hyperbolic-newtonian-150',
      name: 'Sharpstar 15028HNT Carbon Astrograph f/2.8 (Critical Tolerance)',
      description: 'Ultra-fast hyperbolic carbon fiber Newtonian: f/2.8 steep ray cone with strict 55.0 mm (±0.2 mm) backfocus window and precision M48 coupling.',
      components: {
        scope: {
          id: 'scope',
          type: 'telescope',
          model: 'Sharpstar 15028HNT Hyperbolic Newtonian',
          aperture: '150 mm',
          focal_length: '420 mm',
          f_ratio: 2.8,
          mass: '5.0 kg',
          mechanical_ports: {
            focuser_out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' },
            mount: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'male' }
          },
          optical_ports: {
            out: { image_circle: '44.0 mm' }
          }
        },
        corrector: {
          id: 'corrector',
          type: 'corrector',
          model: 'Integrated 3-Element Triplet Coma Corrector',
          required_backfocus: '55.0 mm',
          tolerance_mm: 0.2,
          mass: '0.4 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          },
          optical_ports: {
            out: { image_circle: '44.0 mm' }
          }
        },
        spacer: {
          id: 'spacer',
          type: 'spacer',
          model: 'Precision Backfocus Ring 37.5mm',
          optical_length: '37.5 mm',
          mass: '0.08 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        camera: {
          id: 'camera',
          type: 'camera',
          model: 'ZWO ASI2600MC Pro (Color APS-C)',
          mass: '0.70 kg',
          flange_focal_distance: '17.5 mm',
          sensor: { width: '23.5 mm', height: '15.7 mm', diagonal: '28.3 mm' },
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.0 A', peak_current: '3.0 A', polarity: 'center_positive' }
          }
        },
        mount: {
          id: 'mount',
          type: 'mount',
          model: 'Sky-Watcher HEQ5 Pro',
          payload_capacity: '14.0 kg',
          mass: '10.0 kg',
          mechanical_ports: {
            saddle: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.0 A', peak_current: '3.5 A', polarity: 'center_positive' }
          }
        },
        psu: {
          id: 'psu',
          type: 'power_supply',
          model: '12V 5A Supply',
          mass: '0.4 kg',
          electrical_ports: {
            out1: { port_type: 'power_out', voltage: '12 V', current: '5.0 A', peak_current: '6.0 A', polarity: 'center_positive' }
          }
        }
      },
      connections: [
        { from_component: 'scope', from_port: 'focuser_out', to_component: 'corrector', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'corrector', from_port: 'out', to_component: 'spacer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'spacer', from_port: 'out', to_component: 'camera', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'scope', from_port: 'mount', to_component: 'mount', to_port: 'saddle', connection_type: 'mechanical' },
        { from_component: 'psu', from_port: 'out1', to_component: 'mount', to_port: 'power_in', connection_type: 'power' },
        { from_component: 'psu', from_port: 'out1', to_component: 'camera', to_port: 'power_in', connection_type: 'power' }
      ]
    },

    // 5. Pathological Case A: Mechanical Thread & Gender Collision (INCOMPATIBLE)
    {
      id: 'pathological-thread-gender-collision',
      name: 'Pathological A: Thread Gender Collision & Backfocus Deficit (FAIL)',
      description: 'Severe mechanical faults: Reducer output (M48 male) connects to a spacer with M48 male (two males collision), and camera has M42 thread (M48 vs M42 mismatch), resulting in -16.5 mm backfocus deficit.',
      components: {
        scope: {
          id: 'scope',
          type: 'telescope',
          model: 'Refractor 72mm ED',
          aperture: '72 mm',
          focal_length: '432 mm',
          f_ratio: 6.0,
          mass: '2.5 kg',
          mechanical_ports: {
            focuser_out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            mount: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'male' }
          }
        },
        reducer: {
          id: 'reducer',
          type: 'reducer',
          model: '0.8x Reducer M48',
          reduction_factor: 0.8,
          required_backfocus: '55.0 mm',
          mass: '0.2 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' },
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          },
          optical_ports: {
            out: { image_circle: '30.0 mm' }
          }
        },
        spacer: {
          id: 'spacer',
          type: 'spacer',
          model: 'M48 Faulty Male Spacer 21mm',
          optical_length: '21.0 mm',
          mass: '0.04 kg',
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }, // COLLISION: Two males
            out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          }
        },
        camera: {
          id: 'camera',
          type: 'camera',
          model: 'ZWO ASI533MC Pro',
          mass: '0.50 kg',
          flange_focal_distance: '17.5 mm',
          sensor: { width: '11.3 mm', height: '11.3 mm', diagonal: '16.0 mm' },
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '42 mm', pitch: '0.75 mm', gender: 'female' } // MISMATCH: M48 to M42
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '0.8 A', peak_current: '2.5 A', polarity: 'center_positive' }
          }
        },
        mount: {
          id: 'mount',
          type: 'mount',
          model: 'Star Adventurer GTi',
          payload_capacity: '5.0 kg',
          mass: '2.6 kg',
          mechanical_ports: {
            saddle: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '0.5 A', peak_current: '1.5 A', polarity: 'center_positive' }
          }
        },
        psu: {
          id: 'psu',
          type: 'power_supply',
          model: '12V 5A Power Adapter',
          mass: '0.3 kg',
          electrical_ports: {
            out1: { port_type: 'power_out', voltage: '12 V', current: '5.0 A', peak_current: '6.0 A', polarity: 'center_positive' }
          }
        }
      },
      connections: [
        { from_component: 'scope', from_port: 'focuser_out', to_component: 'reducer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'reducer', from_port: 'out', to_component: 'spacer', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'spacer', from_port: 'out', to_component: 'camera', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'scope', from_port: 'mount', to_component: 'mount', to_port: 'saddle', connection_type: 'mechanical' },
        { from_component: 'psu', from_port: 'out1', to_component: 'mount', to_port: 'power_in', connection_type: 'power' },
        { from_component: 'psu', from_port: 'out1', to_component: 'camera', to_port: 'power_in', connection_type: 'power' }
      ]
    },

    // 6. Pathological Case B: Mount Overload & Power Brownout Deficit (INCOMPATIBLE)
    {
      id: 'pathological-mount-overload-power',
      name: 'Pathological B: Severe Mount Overload & Power Brownout (FAIL)',
      description: 'Dangerous electrical and mechanical mismatch: 11.2 kg imaging payload mounted on an entry-level 7.0 kg mount (160% overload), and 7.8 A current draw on a 3.0 A wall-wart power supply.',
      components: {
        scope: {
          id: 'scope',
          type: 'telescope',
          model: 'Heavy 10" Solid Tube Newtonian 250mm',
          aperture: '250 mm',
          focal_length: '1200 mm',
          f_ratio: 4.8,
          mass: '12.5 kg',
          mechanical_ports: {
            focuser_out: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'female' },
            mount: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'male' }
          }
        },
        camera: {
          id: 'camera',
          type: 'camera',
          model: 'Cooled CMOS Camera with 3x Dew Heaters',
          mass: '1.2 kg',
          flange_focal_distance: '17.5 mm',
          sensor: { width: '23.5 mm', height: '15.7 mm', diagonal: '28.3 mm' },
          mechanical_ports: {
            in: { interface_family: 'metric_thread', nominal_size: '48 mm', pitch: '0.75 mm', gender: 'male' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '5.5 A', peak_current: '8.0 A', polarity: 'center_positive' }
          }
        },
        mount: {
          id: 'mount',
          type: 'mount',
          model: 'Sky-Watcher EQ3-2 Lightweight Mount',
          payload_capacity: '7.0 kg', // CRITICAL OVERLOAD: 13.7 kg on 7.0 kg
          mass: '4.5 kg',
          mechanical_ports: {
            saddle: { interface_family: 'dovetail', nominal_size: 'vixen', gender: 'female' }
          },
          electrical_ports: {
            power_in: { port_type: 'power_in', voltage: '12 V', current: '1.2 A', peak_current: '2.5 A', polarity: 'center_positive' }
          }
        },
        psu: {
          id: 'psu',
          type: 'power_supply',
          model: 'Underpowered 12V 3A Wall Adapter',
          mass: '0.2 kg',
          electrical_ports: {
            out1: { port_type: 'power_out', voltage: '12 V', current: '3.0 A', peak_current: '3.5 A', polarity: 'center_positive' } // CRITICAL DEFICIT
          }
        }
      },
      connections: [
        { from_component: 'scope', from_port: 'focuser_out', to_component: 'camera', to_port: 'in', connection_type: 'mechanical' },
        { from_component: 'scope', from_port: 'mount', to_component: 'mount', to_port: 'saddle', connection_type: 'mechanical' },
        { from_component: 'psu', from_port: 'out1', to_component: 'mount', to_port: 'power_in', connection_type: 'power' },
        { from_component: 'psu', from_port: 'out1', to_component: 'camera', to_port: 'power_in', connection_type: 'power' }
      ]
    }
  ];

  function getRigById(id) {
    return RIGS.find(r => r.id === id) || RIGS[0];
  }

  function getAllRigs() {
    return RIGS;
  }

  return {
    RIGS,
    getRigById,
    getAllRigs
  };
});
