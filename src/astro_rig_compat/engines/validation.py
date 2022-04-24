from astro_rig_compat.core.rig import Rig
from astro_rig_compat.engines.result import OverallValidation, ValidationResult, ValidationState, ValidationMessage
from astro_rig_compat.engines.mechanical import MechanicalEngine
from astro_rig_compat.engines.optical import OpticalEngine
from astro_rig_compat.engines.power import PowerEngine
from astro_rig_compat.engines.mounting import MountEngine
from astro_rig_compat.engines.data import DataEngine
from astro_rig_compat.engines.software import SoftwareEngine

class ValidationEngine:
    def __init__(self):
        self.mechanical = MechanicalEngine()
        self.optical = OpticalEngine()
        self.power = PowerEngine()
        self.mounting = MountEngine()
        self.data = DataEngine()
        self.software = SoftwareEngine()
        
    def evaluate(self, rig: Rig) -> OverallValidation:
        mech_res = self.mechanical.evaluate(rig)
        opt_res = self.optical.evaluate(rig)
        pow_res = self.power.evaluate(rig)
        mnt_res = self.mounting.evaluate(rig)
        
        data_res = self.data.evaluate(rig)
        soft_res = self.software.evaluate(rig)
        geom_res = ValidationResult(state="NOT EVALUABLE", messages=[])
        
        states = [mech_res.state, opt_res.state, pow_res.state, mnt_res.state, data_res.state, soft_res.state, geom_res.state]
        
        overall: ValidationState = "COMPATIBLE"
        
        if "INCOMPATIBLE" in states:
            overall = "INCOMPATIBLE"
        elif "UNKNOWN" in states:
            overall = "UNKNOWN"
        elif "COMPATIBLE WITH CONDITIONS" in states:
            overall = "COMPATIBLE WITH CONDITIONS"
            
        return OverallValidation(
            state=overall,
            mechanical=mech_res,
            optical=opt_res,
            mounting=mnt_res,
            power=pow_res,
            data=data_res,
            software=soft_res,
            geometry=geom_res
        )
