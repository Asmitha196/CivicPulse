from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = "citizen"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
