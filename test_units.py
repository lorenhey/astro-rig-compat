import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))
from astro_rig_compat.utils.units import Distance
from pydantic import BaseModel

class TestModel(BaseModel):
    d: Distance

t = TestModel(d='10 mm')
print(repr(t.d))
print(t.model_dump_json())
