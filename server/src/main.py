from api.server import start_server
from database.sql import Database as SQLDatabase
from database.vector import VecDatabase

if __name__ == "__main__":
    database = SQLDatabase()
    database.create_tables()
    database = VecDatabase()
    database.init_db()
    start_server()
