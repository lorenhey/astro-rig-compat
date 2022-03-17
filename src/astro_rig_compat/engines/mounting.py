from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import ValidationResult, ValidationState, ValidationMessage
from astro_rig_compat.utils.units import ureg

class MountEngine:
    def evaluate(self, rig: Rig) -> ValidationResult:
        messages = []
        overall_state: ValidationState = "COMPATIBLE"
        
        mounts = [c for c in rig.components.values() if c.type == "mount"]
        if not mounts:
            return ValidationResult(state="NOT EVALUABLE", messages=[ValidationMessage(message="No mount found in rig", severity="info")])
            
        mount = mounts[0]
        
        # Calculate total mass
        total_mass = 0 * ureg.kg
        missing_mass = False
        
        for comp in rig.components.values():
            if comp.type != "mount":
                if comp.mass:
                    total_mass += comp.mass
                else:
                    messages.append(ValidationMessage(message=f"Missing mass for {comp.id}", severity="warning"))
                    missing_mass = True
                    
        if missing_mass:
            overall_state = "UNKNOWN"
            
        if mount.payload_capacity:
            ratio = (total_mass / mount.payload_capacity).to_reduced_units().m
            messages.append(ValidationMessage(message=f"Total payload: {total_mass.to('kg'):.2f}. Capacity: {mount.payload_capacity.to('kg'):.2f}. Ratio: {ratio*100:.1f}%", severity="info"))
            
            if ratio > 1.0:
                messages.append(ValidationMessage(message=f"Payload exceeds mount capacity!", severity="error"))
                overall_state = "INCOMPATIBLE"
            elif ratio > 0.8:
                messages.append(ValidationMessage(message=f"Payload is >80% of mount capacity. May affect tracking performance.", severity="warning"))
                if overall_state == "COMPATIBLE": overall_state = "COMPATIBLE WITH CONDITIONS"
        else:
            messages.append(ValidationMessage(message="Mount payload capacity is unknown.", severity="warning"))
            if overall_state == "COMPATIBLE": overall_state = "UNKNOWN"
            
        return ValidationResult(state=overall_state, messages=messages)
