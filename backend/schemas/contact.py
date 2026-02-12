from typing import Optional
from pydantic import BaseModel, EmailStr

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    organization: Optional[str] = None
