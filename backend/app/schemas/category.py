from typing import Optional
from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "alert-circle"
    default_sla_hours: Optional[int] = 48

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
