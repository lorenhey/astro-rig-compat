from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import ValidationResult, ValidationState, ValidationMessage

class MechanicalEngine:
    def evaluate(self, rig: Rig) -> ValidationResult:
        messages = []
        overall_state: ValidationState = "COMPATIBLE"
        
        mechanical_connections = [c for c in rig.connections if c.connection_type == "mechanical"]
        
        for conn in mechanical_connections:
            if conn.from_component not in rig.components or conn.to_component not in rig.components:
                messages.append(ValidationMessage(message=f"Component missing for connection {conn}", severity="error"))
                overall_state = "INCOMPATIBLE"
                continue
                
            comp1 = rig.components[conn.from_component]
            comp2 = rig.components[conn.to_component]
            
            if conn.from_port not in comp1.mechanical_ports:
                messages.append(ValidationMessage(message=f"Port {conn.from_port} missing on {comp1.id}", severity="error"))
                overall_state = "INCOMPATIBLE"
                continue
                
            if conn.to_port not in comp2.mechanical_ports:
                messages.append(ValidationMessage(message=f"Port {conn.to_port} missing on {comp2.id}", severity="error"))
                overall_state = "INCOMPATIBLE"
                continue
                
            p1 = comp1.mechanical_ports[conn.from_port]
            p2 = comp2.mechanical_ports[conn.to_port]
            
            # Check family
            if p1.interface_family != p2.interface_family:
                messages.append(ValidationMessage(message=f"Interface family mismatch between {comp1.id}:{conn.from_port} ({p1.interface_family}) and {comp2.id}:{conn.to_port} ({p2.interface_family})", severity="error"))
                overall_state = "INCOMPATIBLE"
                continue
                
            # Thread checks
            if p1.interface_family == "metric_thread":
                if p1.nominal_size is None or p2.nominal_size is None:
                    messages.append(ValidationMessage(message=f"Missing nominal size for thread connection {comp1.id} -> {comp2.id}", severity="error"))
                    if overall_state == "COMPATIBLE": overall_state = "UNKNOWN"
                elif p1.nominal_size != p2.nominal_size:
                    messages.append(ValidationMessage(message=f"Thread size mismatch: {p1.nominal_size} vs {p2.nominal_size}", severity="error"))
                    overall_state = "INCOMPATIBLE"
                    
                if p1.pitch is None or p2.pitch is None:
                    messages.append(ValidationMessage(message=f"Missing thread pitch for connection {comp1.id} -> {comp2.id}", severity="error"))
                    if overall_state == "COMPATIBLE": overall_state = "UNKNOWN"
                elif p1.pitch != p2.pitch:
                    messages.append(ValidationMessage(message=f"Thread pitch mismatch: {p1.pitch} vs {p2.pitch}", severity="error"))
                    overall_state = "INCOMPATIBLE"
                    
            # Gender checks
            if p1.gender is None or p2.gender is None:
                messages.append(ValidationMessage(message=f"Missing gender specification on connection {comp1.id} -> {comp2.id}", severity="error"))
                if overall_state == "COMPATIBLE": overall_state = "UNKNOWN"
            elif p1.gender == p2.gender:
                messages.append(ValidationMessage(message=f"Gender mismatch: cannot connect {p1.gender} to {p2.gender}", severity="error"))
                overall_state = "INCOMPATIBLE"
                
        if len(mechanical_connections) == 0:
            return ValidationResult(state="NOT EVALUABLE", messages=[ValidationMessage(message="No mechanical connections defined", severity="info")])
            
        return ValidationResult(state=overall_state, messages=messages)
