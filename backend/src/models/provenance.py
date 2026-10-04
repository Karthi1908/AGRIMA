from enum import Enum
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T')

class ProvenanceStatus(str, Enum):
    FOUND = "Found"
    INFERRED = "Inferred"
    MISSING = "Missing"
    USER_SUPPLIED = "User-Supplied"

class ProvenanceField(BaseModel, Generic[T]):
    value: Optional[T]
    status: ProvenanceStatus
    source_text: Optional[str] = None
    confirmed: bool = False # Must be true if status is INFERRED or MISSING for simulation to run
