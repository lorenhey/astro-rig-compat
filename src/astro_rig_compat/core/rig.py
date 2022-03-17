from typing import Dict, List, Optional, Literal, Annotated
from pydantic import BaseModel, Field
from astro_rig_compat.core.components import ComponentType

class Connection(BaseModel):
    from_component: str
    from_port: str
    to_component: str
    to_port: str
    connection_type: Literal["mechanical", "power", "data", "optical", "control"]

class Rig(BaseModel):
    name: str
    version: str = "1.0"
    components: Dict[str, Annotated[ComponentType, Field(discriminator="type")]] = Field(default_factory=dict)
    connections: List[Connection] = Field(default_factory=list)

    @classmethod
    def from_yaml(cls, path: str) -> "Rig":
        import yaml
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return cls(**data)
        
    def to_yaml(self, path: str):
        import yaml
        with open(path, "w", encoding="utf-8") as f:
            yaml.dump(self.model_dump(mode="json"), f, sort_keys=False)
