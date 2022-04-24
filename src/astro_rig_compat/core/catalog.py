from typing import Dict
import os
import yaml
from astro_rig_compat.core.components import ComponentType, Adapter, Spacer

class Catalog:
    def __init__(self):
        self.components: Dict[str, ComponentType] = {}
        
    def load_from_dir(self, directory: str):
        if not os.path.isdir(directory):
            return
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith((".yaml", ".yml")) and file != "golden_rig_valid.yaml":
                    self.load_file(os.path.join(root, file))
                    
    def load_file(self, path: str):
        # We assume catalog files contain a list of components or a dict
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            
        if isinstance(data, dict) and "components" in data:
            data = data["components"]
            
        if isinstance(data, list):
            from pydantic import TypeAdapter
            ta = TypeAdapter(list[ComponentType])
            comps = ta.validate_python(data)
            for c in comps:
                self.components[c.id] = c
        elif isinstance(data, dict):
            from pydantic import TypeAdapter
            ta = TypeAdapter(Dict[str, ComponentType])
            comps = ta.validate_python(data)
            for k, c in comps.items():
                self.components[k] = c
