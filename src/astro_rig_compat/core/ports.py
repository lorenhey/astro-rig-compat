from typing import Optional, Literal
from pydantic import BaseModel
from astro_rig_compat.utils.units import Distance, Voltage, Current, DataRate

class MechanicalPort(BaseModel):
    interface_family: str  # e.g., "metric_thread", "insertion", "sct", "custom", "dovetail"
    nominal_size: Optional[str] = None
    pitch: Optional[Distance] = None
    gender: Optional[Literal["male", "female"]] = None
    insertion_depth: Optional[Distance] = None
    shoulder: bool = False
    clear_aperture: Optional[Distance] = None
    rotatable: bool = False
    locking_mechanism: Optional[str] = None
    direction: Literal["input", "output", "bidirectional"] = "bidirectional"

class OpticalPort(BaseModel):
    clear_aperture: Optional[Distance] = None
    required_backfocus: Optional[Distance] = None
    backfocus_tolerance: Optional[Distance] = None
    image_circle: Optional[Distance] = None
    direction: Literal["input", "output", "bidirectional"] = "bidirectional"

class ElectricalPort(BaseModel):
    port_type: Literal["power_in", "power_out"]
    voltage: Voltage
    voltage_tolerance: Optional[Voltage] = None
    current: Optional[Current] = None # For power_in, this is typical current. For power_out, this is max continuous current.
    peak_current: Optional[Current] = None
    connector: str  # e.g. "DC 5.5x2.1", "USB-C", "Anderson"
    polarity: Optional[Literal["center_positive", "center_negative", "custom", "n_a"]] = None
    regulated: bool = False

class DataPort(BaseModel):
    connector: str # e.g. "USB-B 3.0", "USB-C", "RJ45"
    protocol: str # e.g. "USB 3.0", "USB 2.0", "Ethernet", "Serial"
    bandwidth_requirement: Optional[DataRate] = None
    direction: Literal["upstream", "downstream", "bidirectional"]
    provides_power: bool = False
    requires_power: bool = False

class ControlPort(BaseModel):
    protocol: str # e.g. "ASCOM", "INDI", "Native SDK", "ST-4"
    role: Literal["controller", "device"]
