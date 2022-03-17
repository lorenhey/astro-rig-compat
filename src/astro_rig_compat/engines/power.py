from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import ValidationResult, ValidationState, ValidationMessage
from astro_rig_compat.utils.units import ureg

class PowerEngine:
    def evaluate(self, rig: Rig) -> ValidationResult:
        messages = []
        overall_state: ValidationState = "COMPATIBLE"
        
        power_connections = [c for c in rig.connections if c.connection_type == "power"]
        
        if not power_connections:
             # Check if any component requires power
             needs_power = any(len(c.electrical_ports) > 0 for c in rig.components.values())
             if needs_power:
                 return ValidationResult(state="NOT EVALUABLE", messages=[ValidationMessage(message="Components require power but no power connections defined.", severity="warning")])
             return ValidationResult(state="NOT EVALUABLE", messages=[ValidationMessage(message="No power connections defined", severity="info")])

        # We will build a tree of power distribution.
        # Track load on each power_out port
        port_loads = {} # (comp_id, port_id) -> {'current': 0, 'peak_current': 0}
        
        for conn in power_connections:
            comp_src = rig.components[conn.from_component]
            comp_dst = rig.components[conn.to_component]
            
            p_src = comp_src.electrical_ports.get(conn.from_port)
            p_dst = comp_dst.electrical_ports.get(conn.to_port)
            
            if not p_src or p_src.port_type != "power_out":
                messages.append(ValidationMessage(message=f"Invalid power source {conn.from_component}:{conn.from_port}", severity="error"))
                overall_state = "INCOMPATIBLE"
                continue
                
            if not p_dst or p_dst.port_type != "power_in":
                messages.append(ValidationMessage(message=f"Invalid power destination {conn.to_component}:{conn.to_port}", severity="error"))
                overall_state = "INCOMPATIBLE"
                continue
                
            # Check voltage
            if p_src.voltage != p_dst.voltage:
                # Todo: consider tolerance
                messages.append(ValidationMessage(message=f"Voltage mismatch: {p_src.voltage} (source) != {p_dst.voltage} (device)", severity="error"))
                overall_state = "INCOMPATIBLE"
                
            # Check polarity
            if p_src.polarity and p_dst.polarity and p_src.polarity != p_dst.polarity:
                if p_src.polarity != "n_a" and p_dst.polarity != "n_a":
                    messages.append(ValidationMessage(message=f"Polarity mismatch: {p_src.polarity} != {p_dst.polarity}", severity="error"))
                    overall_state = "INCOMPATIBLE"
                
            # Accumulate load
            src_key = (conn.from_component, conn.from_port)
            if src_key not in port_loads:
                port_loads[src_key] = {'current': 0 * ureg.ampere, 'peak_current': 0 * ureg.ampere}
                
            if p_dst.current:
                port_loads[src_key]['current'] += p_dst.current
            if p_dst.peak_current:
                port_loads[src_key]['peak_current'] += p_dst.peak_current
            elif p_dst.current:
                port_loads[src_key]['peak_current'] += p_dst.current
            else:
                messages.append(ValidationMessage(message=f"Unknown current draw for {comp_dst.id}", severity="warning"))
                if overall_state == "COMPATIBLE": overall_state = "UNKNOWN"
                
        # Validate accumulated loads against source limits
        for (comp_id, port_id), load in port_loads.items():
            comp = rig.components[comp_id]
            port = comp.electrical_ports[port_id]
            
            if port.current and load['current'] > port.current:
                messages.append(ValidationMessage(message=f"Current draw ({load['current']}) exceeds limit ({port.current}) on {comp_id}:{port_id}", severity="error"))
                overall_state = "INCOMPATIBLE"
                
            if port.peak_current and load['peak_current'] > port.peak_current:
                messages.append(ValidationMessage(message=f"Peak current draw ({load['peak_current']}) exceeds peak limit ({port.peak_current}) on {comp_id}:{port_id}", severity="error"))
                overall_state = "INCOMPATIBLE"
                
        return ValidationResult(state=overall_state, messages=messages)
