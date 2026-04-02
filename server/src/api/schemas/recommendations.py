from pydantic import BaseModel


class RateCourseModel(BaseModel):
    student_id: int
    rating: int  # 1-5
