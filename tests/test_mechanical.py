import pytest
from astro_rig_compat.core.rig import Rig, Connection
from astro_rig_compat.core.ports import MechanicalPort
from astro_rig_compat.core.components import Telescope, Camera, ComponentMetadata, CameraSensor
from astro_rig_compat.engines.mechanical import MechanicalEngine
from astro_rig_compat.utils.units import ureg

def test_mechanical_engine_gender_mismatch():
    scope = Telescope(
        id="scope1",
        metadata=ComponentMetadata(model="Test Scope"),
        aperture="80 mm",
        focal_length="400 mm",
        native_f_ratio=5.0,
        mechanical_ports={
            "out": MechanicalPort(interface_family="metric_thread", nominal_size="48 mm", pitch="0.75 mm", gender="male")
        }
    )
    
    cam = Camera(
        id="cam1",
        metadata=ComponentMetadata(model="Test Cam"),
        sensor=CameraSensor(width="23 mm", height="15 mm", diagonal="28 mm", pixel_size="3.76 um", color=True),
        flange_focal_distance="17.5 mm",
        mechanical_ports={
            "in": MechanicalPort(interface_family="metric_thread", nominal_size="48 mm", pitch="0.75 mm", gender="male")
        }
    )
    
    rig = Rig(name="Test Rig", components={"scope1": scope, "cam1": cam}, connections=[
        Connection(from_component="scope1", from_port="out", to_component="cam1", to_port="in", connection_type="mechanical")
    ])
    
    engine = MechanicalEngine()
    result = engine.evaluate(rig)
    
    assert result.state == "INCOMPATIBLE"
    assert "Gender mismatch" in result.messages[0].message
