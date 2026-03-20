from functools import wraps

import psycopg2
from psycopg2.extensions import connection
from psycopg2.errors import DatabaseError

from log import logger
from settings import PostgreDatabaseConfig


def postgre_connection(config: PostgreDatabaseConfig):
    def wrapper(func):
        @wraps(func)
        def inner(*args, **kwargs):
            conn: connection = connect_to_postgresql(config)
            with conn.cursor() as cursor:
                kwargs['curs'] = cursor
                try:
                    result = func(*args, **kwargs)
                    conn.commit()
                except DatabaseError as e:
                    logger.error(e)
                    result = None
            conn.close()
            return result
        return inner
    return wrapper


def connect_to_postgresql(settings: PostgreDatabaseConfig) -> connection:
    conn = psycopg2.connect(
        host=settings.host,
        dbname=settings.name,
        user=settings.user,
        password=settings.password,
        port=settings.port
    )
    return conn
