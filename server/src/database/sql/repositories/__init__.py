from .courses import CourseRepository
from .labs import LabRepository
from .reports import ReportRepository
from .students import StudentRepository
from .teachers import TeacherRepository
from .chats import ChatRepository
from .test_results import TestResultRepository
from .exam_results import ExamResultRepository
from .recommendations import RecommendationRepository
from .student_preferences import StudentPreferencesRepository
from .chat_preferences import ChatPreferencesRepository
from models import (
    ReportStatus,
    Student,
    Course,
    NewReport,
    NewCourse,
    NewLab,
)
