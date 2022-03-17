import pint
from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import CoreSchema, core_schema
from typing import Any

ureg = pint.UnitRegistry()
ureg.define("pixel = count")
ureg.define("fps = count / second")

class Quantity(pint.Quantity):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        def validate_quantity(value: Any) -> pint.Quantity:
            if isinstance(value, pint.Quantity):
                return value
            if isinstance(value, str):
                return ureg(value)
            raise ValueError("Must be a string with units or a pint Quantity")

        return core_schema.no_info_plain_validator_function(
            validate_quantity,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: CoreSchema, handler: GetJsonSchemaHandler
    ) -> dict[str, Any]:
        return {"type": "string", "example": "10 mm"}

# Typedefs for specific dimensions
Distance = Quantity
Mass = Quantity
Voltage = Quantity
Current = Quantity
Power = Quantity
DataRate = Quantity
Frequency = Quantity
