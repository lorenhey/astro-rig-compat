from typing import List, Literal, Optional, Any
from pydantic import BaseModel

ValidationState = Literal["COMPATIBLE", "COMPATIBLE WITH CONDITIONS", "INCOMPATIBLE", "UNKNOWN", "NOT EVALUABLE"]

class ValidationMessage(BaseModel):
    message: str
    severity: Literal["error", "warning", "info"]

class ValidationResult(BaseModel):
    state: ValidationState
    messages: List[ValidationMessage] = []
    data: Any = None # extra calculated data, like backfocus delta

class OverallValidation(BaseModel):
    state: ValidationState
    mechanical: ValidationResult
    optical: ValidationResult
    mounting: ValidationResult
    power: ValidationResult
    data: ValidationResult
    software: ValidationResult
    geometry: ValidationResult
