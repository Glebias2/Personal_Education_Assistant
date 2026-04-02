from .tables import (
    create_users_tables,
    create_courses_tables,
    create_labs_table,
    create_reports_tables,
    create_chats_tables,
    create_results_tables,
    create_recommendations_tables,
)


class Database:
    def create_tables(self):
        create_users_tables()
        create_courses_tables()
        create_labs_table()
        create_reports_tables()
        create_chats_tables()
        create_results_tables()
        create_recommendations_tables()
