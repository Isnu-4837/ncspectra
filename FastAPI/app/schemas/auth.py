from pydantic import BaseModel


class LoginRequest(BaseModel):
    badge_number: str
    passcode: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer_id: int
    badge_number: str
    name: str
