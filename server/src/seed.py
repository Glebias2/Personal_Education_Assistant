"""
Seed-скрипт для заполнения БД тестовыми данными.

Запуск (контейнер должен быть запущен):
    docker exec agentic-system python src/seed.py

Дополняет существующие данные (ON CONFLICT DO NOTHING).
Пароли хранятся как есть (plaintext) — как и в остальных эндпоинтах проекта.
"""

import os
import json
import psycopg2

conn = psycopg2.connect(
    host=os.environ["EDUCATION_DATABASE_HOST"],
    port=int(os.environ["EDUCATION_DATABASE_PORT"]),
    dbname=os.environ["EDUCATION_DATABASE_NAME"],
    user=os.environ["EDUCATION_DATABASE_USER"],
    password=os.environ["EDUCATION_DATABASE_PASS"],
)
cur = conn.cursor()

# ── Преподаватель ──────────────────────────────────────────────────────────────
cur.execute("SELECT id FROM teachers WHERE login = %s", ("teacher1",))
existing = cur.fetchone()
if existing:
    teacher_id = existing[0]
    print(f"Преподаватель teacher1 уже существует ID={teacher_id}")
else:
    cur.execute(
        "INSERT INTO teachers (login, password, first_name, last_name) VALUES (%s,%s,%s,%s) RETURNING id",
        ("teacher1", "teacher1", "Алексей", "Соколов"),
    )
    teacher_id = cur.fetchone()[0]
    print(f"Создан преподаватель ID={teacher_id}: teacher1/teacher1")

# ── Студенты ───────────────────────────────────────────────────────────────────
students_data = [
    ("student1", "student1", "Иван",   "Петров"),
    ("student2", "student2", "Мария",  "Иванова"),
    ("student3", "student3", "Артём",  "Козлов"),
    ("student4", "student4", "Анна",   "Сидорова"),
]
student_ids = []
for login, password, first_name, last_name in students_data:
    cur.execute("SELECT id FROM students WHERE login = %s", (login,))
    existing = cur.fetchone()
    if existing:
        sid = existing[0]
        print(f"  Студент {login} уже существует ID={sid}")
    else:
        cur.execute(
            "INSERT INTO students (login, password, first_name, last_name, storage_id) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (login, password, first_name, last_name, None),
        )
        sid = cur.fetchone()[0]
        print(f"  Студент ID={sid}: {login}/{password} — {first_name} {last_name}")
    student_ids.append(sid)

s1, s2, s3, s4 = student_ids

# ── Курсы ─────────────────────────────────────────────────────────────────────
courses_data = [
    (
        "Объектно-ориентированное программирование",
        "Вопросы по принципам ООП: инкапсуляция, наследование, полиморфизм, абстракция, паттерны проектирования.",
    ),
    (
        "Базы данных",
        "Вопросы по реляционным БД: SQL, нормализация, транзакции, индексы, PostgreSQL.",
    ),
    (
        "Компьютерные сети",
        "Вопросы по модели OSI, TCP/IP, протоколам прикладного уровня, маршрутизации.",
    ),
    (
        "Операционные системы",
        "Вопросы по процессам, потокам, памяти, файловым системам, синхронизации.",
    ),
    (
        "Алгоритмы и структуры данных",
        "Вопросы по сложности алгоритмов, сортировкам, деревьям, графам, динамическому программированию.",
    ),
    (
        "Веб-разработка",
        "Вопросы по HTML/CSS, JavaScript, REST API, HTTP, фреймворкам.",
    ),
    (
        "Математическая статистика",
        "Вопросы по вероятности, случайным величинам, распределениям, проверке гипотез.",
    ),
    (
        "Информационная безопасность",
        "Вопросы по криптографии, атакам, защите данных, PKI, сетевой безопасности.",
    ),
]
course_ids = []
for title, exam_questions in courses_data:
    cur.execute("SELECT id FROM courses WHERE title = %s AND teacher_id = %s", (title, teacher_id))
    existing = cur.fetchone()
    if existing:
        cid = existing[0]
        print(f"  Курс уже существует ID={cid}: {title}")
    else:
        cur.execute(
            "INSERT INTO courses (title, teacher_id, exam_questions) VALUES (%s,%s,%s) RETURNING id",
            (title, teacher_id, exam_questions),
        )
        cid = cur.fetchone()[0]
        print(f"  Курс ID={cid}: {title}")
    course_ids.append(cid)

c1, c2, c3, c4, c5, c6, c7, c8 = course_ids

# ── Лабораторные работы ────────────────────────────────────────────────────────
labs_data = {
    c1: [
        (1, "Классы и объекты",         "Разработать иерархию классов для системы управления библиотекой. Реализовать классы Book, Author, Library с использованием инкапсуляции."),
        (2, "Паттерны проектирования",  "Реализовать паттерны Singleton, Factory Method и Observer на примере простого приложения."),
        (3, "Полиморфизм и интерфейсы", "Разработать систему обработки геометрических фигур с применением полиморфизма и интерфейсов."),
    ],
    c2: [
        (1, "Проектирование схемы БД",  "Спроектировать реляционную схему для интернет-магазина (товары, заказы, пользователи). Привести к 3НФ."),
        (2, "SQL-запросы",              "Написать сложные SQL-запросы с JOIN, GROUP BY, HAVING, подзапросами для анализа данных."),
        (3, "Транзакции и индексы",     "Исследовать влияние индексов на производительность запросов, написать транзакции с обработкой конфликтов."),
    ],
    c3: [
        (1, "Анализ сетевого трафика",  "Использовать Wireshark для захвата и анализа пакетов. Описать наблюдаемые протоколы на каждом уровне OSI."),
        (2, "Конфигурация сети",        "Настроить сеть в Cisco Packet Tracer: VLAN, маршрутизация между подсетями, DHCP."),
    ],
    c4: [
        (1, "Управление процессами",    "Написать программу на C, демонстрирующую создание и синхронизацию процессов через fork() и pipe()."),
        (2, "Многопоточность",          "Реализовать задачу производитель-потребитель с использованием мьютексов и семафоров."),
        (3, "Файловые системы",         "Исследовать структуру файловой системы ext4. Написать программу для работы с inodes."),
    ],
    c5: [
        (1, "Сортировки",               "Реализовать QuickSort, MergeSort и HeapSort. Провести экспериментальное сравнение производительности."),
        (2, "Деревья поиска",           "Реализовать AVL-дерево с операциями вставки, удаления и балансировки."),
        (3, "Графовые алгоритмы",       "Реализовать алгоритмы Дейкстры и Флойда–Уоршелла для нахождения кратчайших путей."),
    ],
    c6: [
        (1, "Вёрстка и CSS",            "Сверстать адаптивный лендинг по макету, используя Flexbox и Grid."),
        (2, "REST API",                 "Разработать REST API для управления задачами (CRUD) на Node.js/Express с документацией OpenAPI."),
        (3, "SPA на React",             "Разработать одностраничное приложение с аутентификацией и взаимодействием с REST API."),
    ],
    c7: [
        (1, "Описательная статистика",  "Провести разведочный анализ датасета: распределения, квантили, корреляции, визуализация на Python."),
        (2, "Проверка гипотез",         "Применить t-тест, критерий χ² и дисперсионный анализ для реального набора данных."),
    ],
    c8: [
        (1, "Симметричное шифрование",  "Реализовать и сравнить AES-128 и AES-256. Провести анализ режимов шифрования CBC, GCM."),
        (2, "PKI и сертификаты",        "Создать собственный удостоверяющий центр, выпустить сертификаты и настроить TLS."),
        (3, "Анализ уязвимостей",       "Провести анализ безопасности веб-приложения с использованием OWASP ZAP."),
    ],
}

lab_ids = {}  # course_id -> list of lab_ids
for cid, labs in labs_data.items():
    lab_ids[cid] = []
    for number, title, task in labs:
        cur.execute("SELECT id FROM labs WHERE course_id = %s AND number = %s", (cid, number))
        existing = cur.fetchone()
        if existing:
            lab_ids[cid].append(existing[0])
        else:
            cur.execute(
                "INSERT INTO labs (number, title, task, course_id) VALUES (%s,%s,%s,%s) RETURNING id",
                (number, title, task, cid),
            )
            lab_ids[cid].append(cur.fetchone()[0])

print(f"  Лабораторные работы созданы.")

# ── Зачисление студентов ───────────────────────────────────────────────────────
enrollments = [
    # Курсы 1–3: все студенты
    (s1, c1), (s2, c1), (s3, c1), (s4, c1),
    (s1, c2), (s2, c2), (s3, c2), (s4, c2),
    (s1, c3), (s2, c3), (s3, c3), (s4, c3),
    # Курс 4: студенты 1–3
    (s1, c4), (s2, c4), (s3, c4),
    # Курсы 5–6: студенты 2–4
    (s2, c5), (s3, c5), (s4, c5),
    (s2, c6), (s3, c6), (s4, c6),
    # Курсы 7–8: студенты 1–2
    (s1, c7), (s2, c7),
    (s1, c8), (s2, c8),
]
enrolled_count = 0
for sid, cid in enrollments:
    cur.execute("INSERT INTO students_courses (student_id, course_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (sid, cid))
    enrolled_count += cur.rowcount
print(f"  Зачисления: добавлено {enrolled_count} из {len(enrollments)}.")

# ── Результаты тестов ─────────────────────────────────────────────────────────
def insert_test(student_id, course_id, topic, difficulty, total, correct):
    wrong = total - correct
    pct = round(correct / total * 100, 1)
    cur.execute(
        """INSERT INTO test_results
           (student_id, course_id, topic, source, difficulty, total_questions,
            correct_answers, wrong_answers, percentage)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (student_id, course_id, topic, "topic", difficulty, total, correct, wrong, pct),
    )
    result_id = cur.fetchone()[0]
    # 5 вопросов на тест
    questions = [
        (f"Вопрос {i+1} по теме «{topic}»?",
         {"A": "Вариант A", "B": "Вариант B", "C": "Вариант C", "D": "Вариант D"},
         "A" if i < correct else "B",
         "A")
        for i in range(total)
    ]
    for num, (q_text, opts, u_ans, c_ans) in enumerate(questions, 1):
        cur.execute(
            """INSERT INTO test_result_answers
               (test_result_id, question_num, question_text, options, user_answer, correct_answer, is_correct)
               VALUES (%s,%s,%s,%s,%s,%s,%s)""",
            (result_id, num, q_text, json.dumps(opts, ensure_ascii=False), u_ans, c_ans, u_ans == c_ans),
        )
    return result_id


# Тесты: каждый (студент, курс) из зачислений получает 3–4 попытки
test_plan = [
    # (student_id, course_id, [(topic, difficulty, total, correct), ...])
    (s1, c1, [("Классы и объекты", "easy", 5, 5), ("Наследование", "medium", 5, 4), ("Паттерны", "hard", 5, 3)]),
    (s2, c1, [("Классы и объекты", "easy", 5, 4), ("Полиморфизм", "medium", 5, 3), ("Паттерны", "hard", 5, 2), ("Интерфейсы", "medium", 5, 4)]),
    (s3, c1, [("Классы и объекты", "easy", 5, 3), ("Наследование", "medium", 5, 2)]),
    (s4, c1, [("Классы и объекты", "easy", 5, 5), ("Полиморфизм", "medium", 5, 5), ("Паттерны", "hard", 5, 4)]),

    (s1, c2, [("SQL JOIN", "medium", 5, 4), ("Нормализация", "hard", 5, 3), ("Индексы", "medium", 5, 4)]),
    (s2, c2, [("SQL JOIN", "easy", 5, 5), ("Транзакции", "medium", 5, 4), ("Индексы", "hard", 5, 3)]),
    (s3, c2, [("SQL JOIN", "easy", 5, 2), ("Нормализация", "medium", 5, 3)]),
    (s4, c2, [("Транзакции", "medium", 5, 4), ("SQL JOIN", "easy", 5, 4), ("Нормализация", "hard", 5, 2)]),

    (s1, c3, [("OSI модель", "easy", 5, 5), ("TCP/IP", "medium", 5, 4), ("DNS и HTTP", "medium", 5, 3)]),
    (s2, c3, [("OSI модель", "easy", 5, 3), ("Маршрутизация", "hard", 5, 2)]),
    (s3, c3, [("TCP/IP", "medium", 5, 4), ("OSI модель", "easy", 5, 4), ("DNS и HTTP", "medium", 5, 5)]),
    (s4, c3, [("OSI модель", "easy", 5, 2), ("TCP/IP", "medium", 5, 1)]),

    (s1, c4, [("Процессы", "medium", 5, 3), ("Потоки", "hard", 5, 2)]),
    (s2, c4, [("Процессы", "easy", 5, 4), ("Память", "medium", 5, 3), ("Синхронизация", "hard", 5, 2)]),
    (s3, c4, [("Файловые системы", "medium", 5, 4), ("Потоки", "medium", 5, 3)]),

    (s2, c5, [("Сортировки", "easy", 5, 4), ("Деревья", "medium", 5, 3), ("Графы", "hard", 5, 2)]),
    (s3, c5, [("Сортировки", "easy", 5, 5), ("Динамическое программирование", "hard", 5, 3)]),
    (s4, c5, [("Сортировки", "easy", 5, 3), ("Деревья", "medium", 5, 4), ("Графы", "hard", 5, 3)]),

    (s2, c6, [("HTML/CSS", "easy", 5, 5), ("JavaScript", "medium", 5, 4), ("REST API", "hard", 5, 3)]),
    (s3, c6, [("HTML/CSS", "easy", 5, 4), ("React", "hard", 5, 2)]),
    (s4, c6, [("HTML/CSS", "easy", 5, 5), ("JavaScript", "medium", 5, 5), ("React", "hard", 5, 4)]),

    (s1, c7, [("Распределения", "medium", 5, 3), ("Проверка гипотез", "hard", 5, 2)]),
    (s2, c7, [("Вероятность", "easy", 5, 5), ("Распределения", "medium", 5, 4)]),

    (s1, c8, [("Криптография", "medium", 5, 4), ("Уязвимости", "hard", 5, 3)]),
    (s2, c8, [("Криптография", "easy", 5, 4), ("PKI", "hard", 5, 2), ("Атаки", "medium", 5, 3)]),
]

for student_id, course_id, tests in test_plan:
    for topic, difficulty, total, correct in tests:
        insert_test(student_id, course_id, topic, difficulty, total, correct)

print("  Результаты тестов созданы.")

# ── Результаты экзаменов ───────────────────────────────────────────────────────
def insert_exam(student_id, course_id, completed, scores):
    avg = round(sum(scores) / len(scores), 1) if completed and scores else None
    cur.execute(
        """INSERT INTO exam_results
           (student_id, course_id, total_questions, avg_score, completed)
           VALUES (%s,%s,%s,%s,%s) RETURNING id""",
        (student_id, course_id, len(scores), avg, completed),
    )
    exam_id = cur.fetchone()[0]
    if completed:
        verdicts = ["correct", "partial", "incorrect"]
        recs = [
            "Отличный ответ, продолжайте в том же духе.",
            "Ответ неполный, изучите тему подробнее.",
            "Ответ неверный, рекомендуется повторить материал.",
        ]
        for i, score in enumerate(scores, 1):
            v_idx = 0 if score >= 80 else (1 if score >= 50 else 2)
            cur.execute(
                """INSERT INTO exam_result_answers
                   (exam_result_id, question_id, question_text, user_answer,
                    verdict, recommendation, issues, score)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    exam_id, i,
                    f"Экзаменационный вопрос {i} по курсу",
                    f"Ответ студента на вопрос {i}.",
                    verdicts[v_idx],
                    recs[v_idx],
                    json.dumps([], ensure_ascii=False),
                    str(score),
                ),
            )
    return exam_id


exam_plan = [
    (s1, c1, True,  [90, 85, 70]),
    (s1, c1, False, [60]),
    (s2, c1, True,  [75, 80, 65, 70]),
    (s3, c1, True,  [50, 45, 60]),
    (s4, c1, True,  [95, 90, 88]),

    (s1, c2, True,  [80, 75, 85]),
    (s2, c2, True,  [70, 65, 60, 75]),
    (s3, c2, False, [40]),
    (s4, c2, True,  [85, 90]),

    (s1, c3, True,  [88, 82, 90]),
    (s2, c3, True,  [55, 60]),
    (s3, c3, True,  [92, 88, 95]),
    (s4, c3, False, [30]),

    (s1, c4, True,  [70, 65]),
    (s2, c4, True,  [80, 75, 70]),
    (s3, c4, True,  [85, 80]),

    (s2, c5, True,  [75, 70, 65]),
    (s3, c5, True,  [90, 85, 92]),
    (s4, c5, False, [50]),

    (s2, c6, True,  [88, 92, 85]),
    (s3, c6, True,  [70, 65]),
    (s4, c6, True,  [95, 90, 88, 92]),

    (s1, c7, True,  [60, 55]),
    (s2, c7, True,  [85, 80]),

    (s1, c8, True,  [75, 70, 80]),
    (s2, c8, True,  [65, 60, 55]),
]

for student_id, course_id, completed, scores in exam_plan:
    insert_exam(student_id, course_id, completed, scores)

print("  Результаты экзаменов созданы.")

# ── Отчёты по лабам ────────────────────────────────────────────────────────────
# Формат: (student_id, lab_id, url, status)
reports_data = [
    # ООП (c1) — лабы lab_ids[c1] = [lab1, lab2, lab3]
    (s1, lab_ids[c1][0], "https://docs.google.com/document/d/s1_oop_lab1", "approved"),
    (s1, lab_ids[c1][1], "https://docs.google.com/document/d/s1_oop_lab2", "approved"),
    (s1, lab_ids[c1][2], "https://docs.google.com/document/d/s1_oop_lab3", "pending"),
    (s2, lab_ids[c1][0], "https://docs.google.com/document/d/s2_oop_lab1", "approved"),
    (s2, lab_ids[c1][1], "https://docs.google.com/document/d/s2_oop_lab2", "not-approved"),
    (s3, lab_ids[c1][0], "https://docs.google.com/document/d/s3_oop_lab1", "pending"),
    (s4, lab_ids[c1][0], "https://docs.google.com/document/d/s4_oop_lab1", "approved"),
    (s4, lab_ids[c1][1], "https://docs.google.com/document/d/s4_oop_lab2", "approved"),
    (s4, lab_ids[c1][2], "https://docs.google.com/document/d/s4_oop_lab3", "approved"),

    # БД (c2)
    (s1, lab_ids[c2][0], "https://docs.google.com/document/d/s1_db_lab1", "approved"),
    (s1, lab_ids[c2][1], "https://docs.google.com/document/d/s1_db_lab2", "pending"),
    (s2, lab_ids[c2][0], "https://docs.google.com/document/d/s2_db_lab1", "approved"),
    (s2, lab_ids[c2][1], "https://docs.google.com/document/d/s2_db_lab2", "approved"),
    (s2, lab_ids[c2][2], "https://docs.google.com/document/d/s2_db_lab3", "not-approved"),
    (s3, lab_ids[c2][0], "https://docs.google.com/document/d/s3_db_lab1", "not-approved"),
    (s4, lab_ids[c2][0], "https://docs.google.com/document/d/s4_db_lab1", "approved"),

    # Сети (c3)
    (s1, lab_ids[c3][0], "https://docs.google.com/document/d/s1_net_lab1", "approved"),
    (s2, lab_ids[c3][0], "https://docs.google.com/document/d/s2_net_lab1", "pending"),
    (s3, lab_ids[c3][0], "https://docs.google.com/document/d/s3_net_lab1", "approved"),
    (s3, lab_ids[c3][1], "https://docs.google.com/document/d/s3_net_lab2", "approved"),

    # ОС (c4)
    (s1, lab_ids[c4][0], "https://docs.google.com/document/d/s1_os_lab1", "approved"),
    (s2, lab_ids[c4][0], "https://docs.google.com/document/d/s2_os_lab1", "approved"),
    (s2, lab_ids[c4][1], "https://docs.google.com/document/d/s2_os_lab2", "pending"),
    (s3, lab_ids[c4][0], "https://docs.google.com/document/d/s3_os_lab1", "approved"),

    # Алгоритмы (c5)
    (s2, lab_ids[c5][0], "https://docs.google.com/document/d/s2_algo_lab1", "approved"),
    (s3, lab_ids[c5][0], "https://docs.google.com/document/d/s3_algo_lab1", "approved"),
    (s3, lab_ids[c5][1], "https://docs.google.com/document/d/s3_algo_lab2", "approved"),
    (s4, lab_ids[c5][0], "https://docs.google.com/document/d/s4_algo_lab1", "pending"),

    # Веб (c6)
    (s2, lab_ids[c6][0], "https://docs.google.com/document/d/s2_web_lab1", "approved"),
    (s2, lab_ids[c6][1], "https://docs.google.com/document/d/s2_web_lab2", "approved"),
    (s3, lab_ids[c6][0], "https://docs.google.com/document/d/s3_web_lab1", "not-approved"),
    (s4, lab_ids[c6][0], "https://docs.google.com/document/d/s4_web_lab1", "approved"),
    (s4, lab_ids[c6][1], "https://docs.google.com/document/d/s4_web_lab2", "approved"),
    (s4, lab_ids[c6][2], "https://docs.google.com/document/d/s4_web_lab3", "pending"),

    # Статистика (c7)
    (s1, lab_ids[c7][0], "https://docs.google.com/document/d/s1_stat_lab1", "approved"),
    (s2, lab_ids[c7][0], "https://docs.google.com/document/d/s2_stat_lab1", "approved"),
    (s2, lab_ids[c7][1], "https://docs.google.com/document/d/s2_stat_lab2", "pending"),

    # ИБ (c8)
    (s1, lab_ids[c8][0], "https://docs.google.com/document/d/s1_sec_lab1", "approved"),
    (s2, lab_ids[c8][0], "https://docs.google.com/document/d/s2_sec_lab1", "pending"),
]

for student_id, lab_id, url, status in reports_data:
    cur.execute(
        "SELECT 1 FROM reports WHERE student_id = %s AND lab_id = %s",
        (student_id, lab_id),
    )
    if not cur.fetchone():
        cur.execute(
            "INSERT INTO reports (lab_id, student_id, url, status) VALUES (%s,%s,%s,%s::report_status)",
            (lab_id, student_id, url, status),
        )

print(f"  Отчёты: {len(reports_data)} записей.")

conn.commit()
cur.close()
conn.close()

print("\nСeed завершён успешно!")
print("Логин/пароль преподавателя: teacher1 / teacher1")
print("Логины/пароли студентов:    student1..student4 / student1..student4")
