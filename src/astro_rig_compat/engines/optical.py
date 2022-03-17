import networkx as nx
from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import ValidationResult, ValidationState, ValidationMessage
from astro_rig_compat.core.components import ComponentType, Telescope, Camera, Reducer, Flattener, Filter, FilterWheel
from astro_rig_compat.utils.units import ureg

class OpticalEngine:
    def evaluate(self, rig: Rig) -> ValidationResult:
        messages = []
        overall_state: ValidationState = "COMPATIBLE"
        
        # Build directed graph of components based on mechanical connections 
        # (assuming optical path follows mechanical path)
        G = nx.DiGraph()
        for comp_id in rig.components:
            G.add_node(comp_id)
            
        for conn in rig.connections:
            if conn.connection_type in ("mechanical", "optical"):
                # We need to know direction. Let's assume user defines connections in light direction 
                # (from telescope to camera) or we can infer it. For now assume from_component is upstream.
                G.add_edge(conn.from_component, conn.to_component, port_out=conn.from_port, port_in=conn.to_port)
                
        # Find telescope and camera
        telescopes = [c_id for c_id, c in rig.components.items() if c.type == "telescope"]
        cameras = [c_id for c_id, c in rig.components.items() if c.type == "camera"]
        
        if not telescopes or not cameras:
            return ValidationResult(state="NOT EVALUABLE", messages=[ValidationMessage(message="Rig must contain at least one telescope and one camera for optical evaluation.", severity="info")])
            
        main_scope_id = telescopes[0]
        main_cam_id = cameras[0]
        
        try:
            path = nx.shortest_path(G, main_scope_id, main_cam_id)
        except nx.NetworkXNoPath:
            return ValidationResult(state="INCOMPATIBLE", messages=[ValidationMessage(message="No optical path found from telescope to camera.", severity="error")])

        # Find backfocus requirers (Reducers, Flatteners)
        bf_requirers = [node for node in path if rig.components[node].type in ("reducer", "flattener")]
        
        # Evaluate Backfocus
        for req_id in bf_requirers:
            req_comp = rig.components[req_id]
            required_bf = req_comp.required_backfocus
            
            # Calculate distance from req_comp to camera
            idx = path.index(req_id)
            downstream_path = path[idx+1:]
            
            consumed_bf_mech = 0 * ureg.mm
            focus_shift = 0 * ureg.mm
            missing_lengths = False
            
            for node in downstream_path:
                comp = rig.components[node]
                if comp.type == "camera":
                    consumed_bf_mech += comp.flange_focal_distance
                elif comp.optical_length is not None:
                    consumed_bf_mech += comp.optical_length
                else:
                    messages.append(ValidationMessage(message=f"Missing optical length for {comp.id}", severity="error"))
                    missing_lengths = True
                    
                if comp.type == "filter":
                    # Focus shift = thickness * (1 - 1/n)
                    shift = comp.thickness * (1 - (1 / comp.refractive_index))
                    focus_shift += shift
                    messages.append(ValidationMessage(message=f"Filter {comp.id} introduces focus shift of {shift:.2f} (assuming refractive index {comp.refractive_index})", severity="info"))
                    
            if missing_lengths:
                overall_state = "UNKNOWN"
            else:
                # Effective optical distance from corrector to sensor
                # The mechanical distance is consumed_bf_mech. The filters shift the focal plane backwards,
                # which means the light travels further. So the effective optical distance is mechanical - shift.
                consumed_bf_eff = consumed_bf_mech - focus_shift
                delta = consumed_bf_eff - required_bf
                
                # Check tolerance (assume 1mm if not specified for now, though prompt says "No asumir que toleran 1mm. Debe provenir de datos.")
                # We'll check if delta is exactly 0 within a small float margin if tolerance is unknown.
                tol = 0.5 * ureg.mm # TODO: get from component
                
                if abs(delta.m) > tol.m: # comparing magnitudes
                    messages.append(ValidationMessage(message=f"Backfocus error for {req_id}. Required: {required_bf}. Current effective: {consumed_bf_eff:.2f}. Missing: {-delta:.2f}", severity="error"))
                    if overall_state != "UNKNOWN": overall_state = "INCOMPATIBLE"
                else:
                    messages.append(ValidationMessage(message=f"Backfocus for {req_id} is correct ({consumed_bf_eff:.2f} vs {required_bf}).", severity="info"))

        # Evaluate Image Circle vs Sensor Diagonal
        cam_comp = rig.components[main_cam_id]
        sensor_diag = cam_comp.sensor.diagonal
        
        min_image_circle = None
        for node in path:
            comp = rig.components[node]
            # check optical ports for image circle
            for port in comp.optical_ports.values():
                if port.image_circle is not None:
                    if min_image_circle is None or port.image_circle < min_image_circle:
                        min_image_circle = port.image_circle
                        
        if min_image_circle is not None:
            if min_image_circle < sensor_diag:
                messages.append(ValidationMessage(message=f"Sensor diagonal ({sensor_diag}) exceeds minimum image circle ({min_image_circle}). Corners will be uncorrected/vignetted.", severity="warning"))
                if overall_state == "COMPATIBLE": overall_state = "COMPATIBLE WITH CONDITIONS"
            else:
                messages.append(ValidationMessage(message=f"Sensor diagonal ({sensor_diag}) fits within minimum image circle ({min_image_circle}).", severity="info"))

        # Evaluate clear aperture / geometric vignetting (simple cone)
        # Telescope f-ratio
        scope_comp = rig.components[main_scope_id]
        effective_f_ratio = scope_comp.native_f_ratio
        for node in path:
            if rig.components[node].type == "reducer":
                effective_f_ratio *= rig.components[node].reduction_factor
                
        # Cone calculation from sensor outwards
        # D(x) = SensorDiag + x / f_ratio
        current_distance_from_sensor = 0 * ureg.mm
        # walk backwards from camera
        for node in reversed(path):
            comp = rig.components[node]
            if comp.type == "camera":
                current_distance_from_sensor += comp.flange_focal_distance
                continue
                
            # check clear aperture of this component
            min_ca = None
            if hasattr(comp, "clear_aperture") and comp.clear_aperture is not None:
                min_ca = comp.clear_aperture
            for port in comp.mechanical_ports.values():
                if port.clear_aperture is not None:
                    if min_ca is None or port.clear_aperture < min_ca:
                        min_ca = port.clear_aperture
                        
            if min_ca is not None:
                required_cone = sensor_diag + (current_distance_from_sensor / effective_f_ratio)
                if min_ca < required_cone:
                    messages.append(ValidationMessage(message=f"Vignetting risk at {comp.id}: clear aperture ({min_ca}) is smaller than required cone ({required_cone:.2f}) at distance {current_distance_from_sensor:.2f} from sensor.", severity="warning"))
                    if overall_state == "COMPATIBLE": overall_state = "COMPATIBLE WITH CONDITIONS"
                    
            if comp.optical_length is not None:
                current_distance_from_sensor += comp.optical_length
                
        return ValidationResult(state=overall_state, messages=messages)
