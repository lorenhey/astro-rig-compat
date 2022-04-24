from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import ValidationResult, ValidationState, ValidationMessage

class SoftwareEngine:
    def evaluate(self, rig: Rig) -> ValidationResult:
        control_connections = [c for c in rig.connections if c.connection_type == "control"]
        if not control_connections:
            return ValidationResult(state="NOT EVALUABLE", messages=[])
            
        messages = []
        overall: ValidationState = "COMPATIBLE"
        
        for conn in control_connections:
            c1 = rig.components[conn.from_component]
            c2 = rig.components[conn.to_component]
            p1 = c1.control_ports.get(conn.from_port)
            p2 = c2.control_ports.get(conn.to_port)
            
            if not p1 or not p2:
                messages.append(ValidationMessage(message=f"Missing control port on {conn.from_component} or {conn.to_component}", severity="error"))
                overall = "INCOMPATIBLE"
                continue
                
            if p1.protocol != p2.protocol:
                messages.append(ValidationMessage(message=f"Control protocol mismatch: {p1.protocol} vs {p2.protocol}", severity="error"))
                overall = "INCOMPATIBLE"
                
        return ValidationResult(state=overall, messages=messages)
