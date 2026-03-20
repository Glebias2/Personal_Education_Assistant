from pydantic import BaseModel

class Report(BaseModel):
    text: str
    images: list