from typing import Dict, List, Optional, Literal, Any
from pydantic import BaseModel, Field
from astro_rig_compat.core.ports import MechanicalPort, OpticalPort, ElectricalPort, DataPort, ControlPort
from astro_rig_compat.utils.units import Distance, Mass

class ComponentMetadata(BaseModel):
    manufacturer: Optional[str] = None
    model: str
    description: Optional[str] = None
    sources: Dict[str, str] = Field(default_factory=dict) # Field -> source string
    
class BaseComponent(BaseModel):
    id: str
    type: str
    metadata: ComponentMetadata
    mass: Optional[Mass] = None
    optical_length: Optional[Distance] = None
    mechanical_ports: Dict[str, MechanicalPort] = Field(default_factory=dict)
    optical_ports: Dict[str, OpticalPort] = Field(default_factory=dict)
    electrical_ports: Dict[str, ElectricalPort] = Field(default_factory=dict)
    data_ports: Dict[str, DataPort] = Field(default_factory=dict)
    control_ports: Dict[str, ControlPort] = Field(default_factory=dict)

# Specific Component Types
class Telescope(BaseComponent):
    type: Literal["telescope"] = "telescope"
    aperture: Distance
    focal_length: Distance
    native_f_ratio: float
    optical_design: Optional[str] = None
    backfocus_from_drawtube: Optional[Distance] = None # Where focus is reached

class CameraSensor(BaseModel):
    width: Distance
    height: Distance
    diagonal: Distance
    pixel_size: Distance
    color: bool

class Camera(BaseComponent):
    type: Literal["camera"] = "camera"
    sensor: CameraSensor
    flange_focal_distance: Distance
    cooling: bool = False

class GuideCamera(Camera):
    type: Literal["guide_camera"] = "guide_camera"

class Adapter(BaseComponent):
    type: Literal["adapter"] = "adapter"

class Spacer(BaseComponent):
    type: Literal["spacer"] = "spacer"

class Reducer(BaseComponent):
    type: Literal["reducer"] = "reducer"
    reduction_factor: float
    required_backfocus: Distance
    backfocus_reference_port: str

class Flattener(BaseComponent):
    type: Literal["flattener"] = "flattener"
    required_backfocus: Distance
    backfocus_reference_port: str

class Filter(BaseComponent):
    type: Literal["filter"] = "filter"
    thickness: Distance
    refractive_index: float = 1.5
    size_format: str # e.g. "2 inch", "1.25 inch", "36mm unmounted"
    clear_aperture: Distance
    
class FilterWheel(BaseComponent):
    type: Literal["filter_wheel"] = "filter_wheel"
    capacity: int
    supported_filter_formats: List[str]

class OAG(BaseComponent):
    type: Literal["oag"] = "oag"
    prism_size: Distance
    prism_clear_aperture: Optional[Distance] = None
    guide_port_travel: Optional[Distance] = None # for helical focuser

class Mount(BaseComponent):
    type: Literal["mount"] = "mount"
    mount_type: Literal["eq", "altaz", "hybrid"]
    payload_capacity: Mass
    saddle_type: List[str] # e.g. ["vixen", "losmandy"]

class Focuser(BaseComponent):
    type: Literal["focuser"] = "focuser"
    travel: Distance
    max_payload: Optional[Mass] = None

class PowerSupply(BaseComponent):
    type: Literal["power_supply"] = "power_supply"

class USBHub(BaseComponent):
    type: Literal["usb_hub"] = "usb_hub"

class Controller(BaseComponent):
    type: Literal["controller"] = "controller"

class Rotator(BaseComponent):
    type: Literal["rotator"] = "rotator"

ComponentType = Telescope | Camera | GuideCamera | Adapter | Spacer | Reducer | Flattener | Filter | FilterWheel | OAG | Mount | Focuser | PowerSupply | USBHub | Controller | Rotator
