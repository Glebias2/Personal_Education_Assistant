from enum import Enum, auto


class ReportStatus(Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    NOT_APPROVED = 'not-approved'


class VerificationStatus(Enum):
    APPROVE = auto()
    DISAPPROVE = auto()
