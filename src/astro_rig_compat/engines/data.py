from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import ValidationResult, ValidationState, ValidationMessage

class DataEngine:
    def evaluate(self, rig: Rig) -> ValidationResult:
        data_connections = [c for c in rig.connections if c.connection_type == "data"]
        if not data_connections:
            return ValidationResult(state="NOT EVALUABLE", messages=[])
            
        messages = []
        overall: ValidationState = "COMPATIBLE"
        
        for conn in data_connections:
            # Check basic connector match for now
            c1 = rig.components[conn.from_component]
            c2 = rig.components[conn.to_component]
            p1 = c1.data_ports.get(conn.from_port)
            p2 = c2.data_ports.get(conn.to_port)
            
            if not p1 or not p2:
                messages.append(ValidationMessage(message=f"Missing data port on {conn.from_component} or {conn.to_component}", severity="error"))
                overall = "INCOMPATIBLE"
                continue
                
            # If connectors match physically or protocols match logically
            if p1.protocol != p2.protocol:
                messages.append(ValidationMessage(message=f"Protocol mismatch: {p1.protocol} vs {p2.protocol}", severity="error"))
                overall = "INCOMPATIBLE"
                
            # bandwidth checks would go here
            
        return ValidationResult(state=overall, messages=messages)
