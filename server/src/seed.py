"""
Seed-скрипт для заполнения БД тестовыми данными.

Запуск (контейнер должен быть запущен):
    docker exec agentic-system python src/seed.py

Удаляет существующие seed-данные (teacher1, teacher2, student1..student10)
и создаёт новые. Данные, созданные вне seed-скрипта, не затрагиваются.
Пароли хранятся plaintext — как и в остальных эндпоинтах.
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

# ── Очистка старых seed-данных ─────────────────────────────────────────────────
print("Очищаю старые seed-данные...")

cur.execute("SELECT id FROM teachers WHERE login IN ('teacher1', 'teacher2')")
old_teacher_ids = [r[0] for r in cur.fetchall()]
if old_teacher_ids:
    # courses FK → labs/students_courses/test_results/exam_results/chats/
    #              course_requests/course_tags/course_ratings/course_files — все CASCADE
    cur.execute("DELETE FROM courses WHERE teacher_id = ANY(%s)", (old_teacher_ids,))
    print(f"  Курсы преподавателей удалены (cascade)")

cur.execute(
    "DELETE FROM students WHERE login = ANY(%s)",
    (["student1","student2","student3","student4","student5",
      "student6","student7","student8","student9","student10"],)
)
print("  Студенты student1..student10 удалены")

if old_teacher_ids:
    cur.execute("DELETE FROM teachers WHERE id = ANY(%s)", (old_teacher_ids,))
    print("  Преподаватели teacher1, teacher2 удалены")

conn.commit()
print("Очистка завершена.\n")

# ── Преподаватели ──────────────────────────────────────────────────────────────
cur.execute(
    "INSERT INTO teachers (login, password, first_name, last_name) VALUES (%s,%s,%s,%s) RETURNING id",
    ("teacher1", "teacher1", "Алексей", "Соколов"),
)
t1 = cur.fetchone()[0]

cur.execute(
    "INSERT INTO teachers (login, password, first_name, last_name) VALUES (%s,%s,%s,%s) RETURNING id",
    ("teacher2", "teacher2", "Марина", "Белова"),
)
t2 = cur.fetchone()[0]
print(f"Преподаватели: teacher1 ID={t1} (Соколов), teacher2 ID={t2} (Белова)")

# ── Студенты ───────────────────────────────────────────────────────────────────
students_data = [
    ("student1",  "student1",  "Иван",      "Петров",
     "Сильный студент, специализируется на системном программировании и безопасности. "
     "Предпочитает глубокое изучение теории с примерами кода."),
    ("student2",  "student2",  "Мария",     "Иванова",
     "Активная студентка, интересуется Data Science и базами данных. "
     "Хорошо работает в команде, задаёт много вопросов."),
    ("student3",  "student3",  "Артём",     "Козлов",
     "Испытывает трудности с теоретическим материалом, но старателен. "
     "Нуждается в дополнительной поддержке по базовым концепциям."),
    ("student4",  "student4",  "Анна",      "Сидорова",
     "Отличница по веб-разработке и алгоритмам. "
     "Быстро усваивает новый материал, активно участвует в проектах."),
    ("student5",  "student5",  "Дмитрий",   "Волков",
     "Стабильный студент среднего уровня. "
     "Хорошо справляется с практическими задачами, теория даётся сложнее."),
    ("student6",  "student6",  "Екатерина", "Новикова",
     "Сильная по веб-технологиям и безопасности. "
     "Активно участвует в обсуждениях, помогает однокурсникам."),
    ("student7",  "student7",  "Никита",    "Смирнов",
     "Слабый студент, часто пропускает задания и сдаёт работы с опозданием. "
     "Требует мотивации и регулярного контроля."),
    ("student8",  "student8",  "Полина",    "Фёдорова",
     "Хорошие результаты по статистике и ML. "
     "Аналитический склад ума, любит работать с данными."),
    ("student9",  "student9",  "Кирилл",    "Жуков",
     "Один из лучших студентов потока. Отличные результаты по ML, статистике "
     "и веб-разработке. Участвует в олимпиадах."),
    ("student10", "student10", "Алина",     "Морозова",
     "Хорошая по мобильной разработке и Data Science. "
     "Интересуется новыми технологиями, активно пробует новые инструменты."),
]
student_ids = []
for login, password, first_name, last_name, characteristic in students_data:
    cur.execute(
        "INSERT INTO students (login, password, first_name, last_name, characteristic) "
        "VALUES (%s,%s,%s,%s,%s) RETURNING id",
        (login, password, first_name, last_name, characteristic),
    )
    student_ids.append(cur.fetchone()[0])

s1, s2, s3, s4, s5, s6, s7, s8, s9, s10 = student_ids
print(f"Студенты: {len(student_ids)} созданы (student1..student10)")

# ── Курсы ─────────────────────────────────────────────────────────────────────
# (title, teacher_id, exam_questions, description, difficulty)
courses_raw = [
    # ── Преподаватель 1 — Соколов (системные дисциплины) ──────────────────────
    (
        "Объектно-ориентированное программирование", t1,
        "Вопросы охватывают: инкапсуляцию, наследование, полиморфизм, абстракцию, "
        "SOLID-принципы, паттерны проектирования GoF (Singleton, Factory, Observer, "
        "Strategy, Decorator), UML-диаграммы классов, различия интерфейсов "
        "и абстрактных классов, антипаттерны.",
        "Фундаментальный курс по принципам ООП: от базовых концепций классов и объектов "
        "до продвинутых паттернов проектирования и чистой архитектуры.",
        "intermediate",
    ),
    (
        "Базы данных", t1,
        "Вопросы охватывают: реляционную модель данных, SQL (SELECT/JOIN/GROUP BY/"
        "подзапросы/CTE), нормализацию (1НФ–3НФ/BCNF), транзакции (ACID), уровни "
        "изоляции, индексы B-tree/Hash/GIN, оконные функции, планы выполнения "
        "EXPLAIN ANALYZE, PostgreSQL-специфику.",
        "Реляционные базы данных от теории до практики: проектирование схем, написание "
        "сложных SQL-запросов, оптимизация производительности и работа с PostgreSQL.",
        "intermediate",
    ),
    (
        "Операционные системы", t1,
        "Вопросы охватывают: управление процессами (PCB, планировщики FCFS/SJF/Round Robin), "
        "потоки и конкурентность, механизмы IPC (pipe/socket/shared memory), управление "
        "памятью (виртуальная память, страничный fault, TLB), файловые системы ext4/NTFS, "
        "синхронизацию (mutex/semaphore/monitor), deadlock и методы предотвращения.",
        "Глубокое изучение операционных систем: процессы, потоки, управление памятью, "
        "файловые системы и механизмы синхронизации на примере Linux.",
        "advanced",
    ),
    (
        "Алгоритмы и структуры данных", t1,
        "Вопросы охватывают: O-нотацию и мастер-теорему, рекурсию, сортировки "
        "(quick/merge/heap/tim), бинарные деревья поиска, AVL и красно-чёрные деревья, "
        "хэш-таблицы (collision resolution), графовые алгоритмы "
        "(BFS/DFS/Dijkstra/Floyd/Kruskal), динамическое программирование, жадные алгоритмы.",
        "Системный курс по алгоритмам и структурам данных: анализ сложности, классические "
        "алгоритмы сортировки, деревья, хэш-таблицы, графы и динамическое программирование.",
        "advanced",
    ),
    (
        "Информационная безопасность", t1,
        "Вопросы охватывают: симметричное шифрование (AES-GCM/CBC), асимметричное "
        "(RSA/ECC), PKI и сертификаты X.509, OWASP Top 10 (SQLi/XSS/CSRF/IDOR), "
        "сетевые атаки (MITM/DoS/DDoS), криптографические хэш-функции (SHA-256/bcrypt), "
        "TLS 1.3, анализ вредоносного ПО.",
        "Комплексный курс по информационной безопасности: криптография, PKI, "
        "анализ уязвимостей веб-приложений и сетевая безопасность.",
        "advanced",
    ),
    # ── Преподаватель 2 — Белова (прикладные дисциплины) ─────────────────────
    (
        "Веб-разработка", t2,
        "Вопросы охватывают: семантический HTML5, CSS Flexbox/Grid/анимации, "
        "JavaScript (ES6+, async/await, Promises, замыкания, прототипы), DOM-манипуляции, "
        "REST API принципы, HTTP-методы/статусы/кэширование, React (хуки, компоненты, "
        "состояние, React Query), TypeScript основы, Vite/webpack.",
        "Практический курс по современной веб-разработке: от адаптивной вёрстки и JavaScript "
        "до создания полноценных SPA с REST API на React и TypeScript.",
        "beginner",
    ),
    (
        "Компьютерные сети", t2,
        "Вопросы охватывают: модель OSI и TCP/IP, Ethernet и канальный уровень, "
        "IP-адресация и CIDR, TCP vs UDP (flow/congestion control), "
        "DNS/HTTP/HTTPS/FTP/SMTP протоколы, маршрутизацию (RIP/OSPF/BGP), "
        "NAT, VLAN, STP, основы сетевой безопасности (firewall/IDS).",
        "Курс по компьютерным сетям: модель OSI, стек TCP/IP, протоколы прикладного уровня, "
        "маршрутизация и практическая конфигурация сетевого оборудования.",
        "intermediate",
    ),
    (
        "Математическая статистика", t2,
        "Вопросы охватывают: теорию вероятностей, дискретные и непрерывные распределения "
        "(Bernoulli/Poisson/Normal/Student/Chi-squared), математическое ожидание "
        "и дисперсию, ЦПТ, доверительные интервалы, t-тест/z-тест/критерий χ²/ANOVA/"
        "Mann-Whitney, p-value, ошибки I и II рода, мощность критерия.",
        "Курс по математической статистике: теория вероятностей, анализ распределений, "
        "проверка статистических гипотез с применением на реальных данных в Python.",
        "intermediate",
    ),
    (
        "Машинное обучение", t2,
        "Вопросы охватывают: переобучение и регуляризацию (L1/L2/dropout), "
        "линейную/логистическую регрессию, метрики (accuracy/precision/recall/F1/AUC/RMSE), "
        "деревья решений и случайный лес, градиентный бустинг (XGBoost/LightGBM), "
        "нейронные сети (backpropagation, активации, BatchNorm), "
        "кластеризацию (K-means/DBSCAN), PCA, кросс-валидацию.",
        "Курс по машинному обучению от базовых моделей до продвинутых методов: линейные "
        "модели, деревья решений, ансамблевые методы, нейронные сети и обучение без учителя.",
        "advanced",
    ),
    (
        "Мобильная разработка", t2,
        "Вопросы охватывают: Dart-синтаксис (null safety, async/await, streams, isolates), "
        "архитектуру Flutter-приложений, виджеты (StatelessWidget/StatefulWidget), "
        "управление состоянием (setState/Provider/Bloc/Riverpod), навигацию (GoRouter), "
        "работу с REST API (Dio/http), локальное хранилище (SharedPreferences/Hive/SQLite), "
        "тестирование (unit/widget/integration).",
        "Практический курс по кроссплатформенной разработке на Flutter/Dart: "
        "от базовой архитектуры до полноценных мобильных приложений с API-интеграцией.",
        "intermediate",
    ),
]

course_ids = []
for title, teacher_id, exam_questions, description, difficulty in courses_raw:
    cur.execute(
        "INSERT INTO courses (title, teacher_id, exam_questions, description, difficulty) "
        "VALUES (%s,%s,%s,%s,%s) RETURNING id",
        (title, teacher_id, exam_questions, description, difficulty),
    )
    course_ids.append(cur.fetchone()[0])

c1, c2, c3, c4, c5, c6, c7, c8, c9, c10 = course_ids
print(f"Курсы: {len(course_ids)} созданы")

# Вспомогательные индексы для URL отчётов
_sid_num = {sid: i + 1 for i, sid in enumerate(student_ids)}
_cid_num = {cid: i + 1 for i, cid in enumerate(course_ids)}

# ── Лабораторные работы ────────────────────────────────────────────────────────
labs_data = {
    c1: [  # ООП
        (1, "Классы и объекты",
         "Спроектировать иерархию классов для системы управления библиотекой: "
         "Book, Author, Library, Member, Loan. Реализовать инкапсуляцию (приватные поля, "
         "геттеры/сеттеры), конструкторы, toString. "
         "Написать unit-тесты (JUnit/pytest) с покрытием > 80%."),
        (2, "Паттерны проектирования",
         "Реализовать четыре GoF-паттерна на примере системы уведомлений: "
         "Singleton (менеджер настроек), Factory Method (типы уведомлений), "
         "Observer (подписка на события), Decorator (форматирование сообщений). "
         "Для каждого — UML-диаграмма и обоснование применимости."),
        (3, "Полиморфизм и интерфейсы",
         "Разработать систему обработки платежей с интерфейсами IPaymentProcessor "
         "и IRefundable. Реализовать провайдеры: CardPayment, CryptoPayment, BankTransfer. "
         "Использовать полиморфизм для единообразной обработки. "
         "Добавить паттерн Strategy для выбора алгоритма комиссии."),
    ],
    c2: [  # БД
        (1, "Проектирование схемы БД",
         "Спроектировать реляционную схему интернет-магазина: товары, категории "
         "(дерево через closure table), заказы, пользователи, доставка, отзывы. "
         "Привести к 3НФ, написать SQL DDL с ограничениями CHECK/UNIQUE/FK. "
         "Создать ER-диаграмму в draw.io."),
        (2, "Сложные SQL-запросы",
         "Написать 10 SQL-запросов: оконные функции (ROW_NUMBER, RANK, LAG/LEAD, SUM OVER), "
         "рекурсивный CTE для дерева категорий, PIVOT через crosstab(), "
         "EXPLAIN ANALYZE для двух запросов с и без индекса. "
         "Каждый запрос — с описанием и интерпретацией плана выполнения."),
        (3, "Транзакции и индексы",
         "Исследовать влияние индексов (B-tree, Hash, GIN для JSONB) на производительность. "
         "Написать транзакции с обработкой конкурентного доступа на уровнях "
         "READ COMMITTED и REPEATABLE READ. Воспроизвести dirty read и phantom read. "
         "Замерить TPS через pgbench."),
    ],
    c3: [  # ОС
        (1, "Управление процессами",
         "Написать программу на C: создать дерево из 4 процессов (fork), передать данные "
         "через pipe (родитель→дети), дождаться завершения через waitpid. "
         "Измерить время создания 1000 процессов. Сравнить с созданием потоков (pthread)."),
        (2, "Многопоточность",
         "Реализовать задачу производитель–потребитель: кольцевой буфер на N элементов, "
         "3 производителя и 2 потребителя, синхронизация через pthread_mutex + pthread_cond. "
         "Параллельно — на C++ std::thread. Сравнить производительность, найти data race."),
        (3, "Файловые системы",
         "Исследовать структуру ext4: прочитать суперблок через debugfs, изучить inode-таблицы. "
         "Написать программу рекурсивного обхода директорий с выводом метаданных. "
         "Замерить время sequential vs random read для файлов 1MB/100MB/1GB через fio."),
    ],
    c4: [  # Алгоритмы
        (1, "Сортировки",
         "Реализовать QuickSort (3-way pivot), MergeSort (bottom-up), HeapSort, TimSort. "
         "Сравнение на массивах 10³–10⁶: случайные, отсортированные, обратно-отсортированные, "
         "с повторяющимися элементами. Построить графики зависимости времени от n."),
        (2, "Деревья поиска",
         "Реализовать AVL-дерево: вставка, удаление, поиск, все 4 вида вращений. "
         "Реализовать B-дерево порядка 3. Сравнить с std::map (C++) и dict (Python). "
         "Визуализировать балансировку при вставке 20 элементов."),
        (3, "Графовые алгоритмы",
         "Реализовать: BFS/DFS с нахождением компонент связности и топологической сортировкой, "
         "алгоритм Дейкстры (binary heap) и Флойда–Уоршелла, алгоритм Краскала (Union-Find). "
         "Протестировать на задаче маршрутизации в транспортной сети (граф ≥ 50 вершин)."),
    ],
    c5: [  # ИБ
        (1, "Симметричное шифрование",
         "Реализовать шифрование/дешифрование файлов: AES-256-GCM и AES-256-CBC. "
         "Сравнить режимы по скорости и стойкости. Реализовать PBKDF2+salt для хранения ключей. "
         "Показать атаку на ECB-режим (penguin attack)."),
        (2, "PKI и сертификаты",
         "Создать 2-уровневую PKI: корневой CA и промежуточный CA (OpenSSL). "
         "Выпустить серверный сертификат X.509 (SANs, key usage). "
         "Настроить двустороннее mTLS-соединение (nginx + curl). "
         "Проверить цепочку доверия, отозвать сертификат через CRL."),
        (3, "Анализ уязвимостей",
         "Провести пентест тестового приложения DVWA: обнаружить и эксплуатировать "
         "SQL-инъекцию (blind + union-based), Reflected XSS, Stored XSS, IDOR, File Upload. "
         "Для каждой — CVSS-оценка, PoC-код, мера защиты согласно OWASP."),
    ],
    c6: [  # Веб
        (1, "Адаптивная вёрстка",
         "Сверстать адаптивный лендинг интернет-магазина по макету Figma. "
         "CSS Grid для раскладки, Flexbox для компонентов, CSS Custom Properties для тем. "
         "Breakpoints: 320/768/1200px+. CSS-анимации (hover, scroll-triggered). "
         "Lighthouse score ≥ 90 по Performance и Accessibility."),
        (2, "REST API на Node.js",
         "Разработать REST API системы задач (CRUD): Express + TypeScript, JWT-аутентификация, "
         "валидация через Zod, документация Swagger/OpenAPI 3.0, "
         "unit-тесты Jest (coverage ≥ 75%). База — SQLite через Prisma ORM. Docker-контейнер."),
        (3, "SPA на React",
         "Разработать SPA для управления задачами (API из ЛР №2): React + TypeScript + Vite, "
         "React Router (вложенные маршруты, lazy loading), React Query (кэш, optimistic updates), "
         "Zustand для глобального состояния, JWT с refresh-токенами, тёмная/светлая тема. "
         "Unit-тесты (Vitest) для ключевых компонентов."),
    ],
    c7: [  # Сети
        (1, "Анализ сетевого трафика",
         "Wireshark: захватить и проанализировать DNS, TCP three-way handshake, "
         "HTTP (plaintext) и HTTPS (TLS 1.3 handshake), ARP. Написать Wireshark-фильтры. "
         "Сравнить объём метаданных HTTP vs HTTPS. "
         "Воспроизвести ARP-spoofing в изолированной VM-сети."),
        (2, "Конфигурация сети",
         "Cisco Packet Tracer: спроектировать сеть офиса (3 отдела = 3 VLAN). "
         "Настроить: inter-VLAN routing (L3 switch), DHCP per VLAN, статические маршруты, "
         "ACL (отдел A не видит отдел B). Проверить связность ping/traceroute."),
    ],
    c8: [  # Статистика
        (1, "Описательная статистика",
         "Провести EDA реального датасета (≥ 1000 строк, 10+ признаков): "
         "дистрибуции (гистограммы, KDE), квантили, выбросы (IQR и Z-score), "
         "матрица корреляций Pearson/Spearman, тепловая карта. "
         "Python: pandas + matplotlib + seaborn. Сформулировать 5 выводов."),
        (2, "Проверка гипотез",
         "Применить к датасету: одновыборочный и двухвыборочный t-тест, "
         "критерий Манна–Уитни, χ² для категориальных данных, однофакторный ANOVA + Tukey. "
         "Для каждого теста: обосновать выбор (Shapiro-Wilk), интерпретировать p-value. "
         "Вычислить мощность критерия."),
    ],
    c9: [  # ML
        (1, "Линейные модели",
         "Реализовать линейную регрессию (градиентный спуск + нормальное уравнение) "
         "и логистическую регрессию на NumPy. Применить L1/L2-регуляризацию, "
         "сравнить с sklearn. Метрики: MSE/RMSE/R² и accuracy/ROC-AUC/F1. "
         "Построить learning curves."),
        (2, "Деревья и ансамбли",
         "Обучить Decision Tree, Random Forest, XGBoost на датасете. "
         "Feature importance (MDI + permutation). 5-fold кросс-валидация + GridSearchCV. "
         "Интерпретация через SHAP (summary plot + waterfall для 3 примеров)."),
        (3, "Нейронные сети",
         "Реализовать MLP для MNIST: forward/backward pass вручную (NumPy), затем PyTorch. "
         "Исследовать: ReLU/tanh/sigmoid, dropout (0.2/0.5), batch normalization. "
         "Достичь accuracy ≥ 98%. Визуализировать фильтры и confusion matrix."),
    ],
    c10: [  # Мобильная
        (1, "Основы Flutter",
         "Разработать Flutter-приложение «Список задач»: StatefulWidget для CRUD, "
         "ListView с Dismissible, FloatingActionButton, диалоги (showDialog), "
         "сохранение в SharedPreferences (JSON-сериализация). "
         "Поддержка светлой и тёмной темы через ThemeData."),
        (2, "Навигация и состояние",
         "Расширить приложение из ЛР №1: GoRouter с вложенными маршрутами и deep links, "
         "управление состоянием через Bloc (TodoBloc: events/states), "
         "экран деталей с редактированием, поиск с debounce (500ms), "
         "фильтрация (все/активные/завершённые). Widget-тесты для TodoBloc."),
    ],
}

lab_ids = {}
for cid, labs in labs_data.items():
    lab_ids[cid] = []
    for number, title, task in labs:
        cur.execute(
            "INSERT INTO labs (number, title, task, course_id) VALUES (%s,%s,%s,%s) RETURNING id",
            (number, title, task, cid),
        )
        lab_ids[cid].append(cur.fetchone()[0])
print("Лабораторные работы созданы")

# ── Зачисление студентов ───────────────────────────────────────────────────────
enrollments = [
    (s1, c1), (s2, c1), (s3, c1), (s4, c1), (s5, c1), (s6, c1),       # ООП: s1-s6
    (s1, c2), (s2, c2), (s3, c2), (s4, c2), (s5, c2),                   # БД: s1-s5
    (s1, c3), (s2, c3), (s3, c3), (s6, c3),                              # ОС: s1-s3, s6
    (s2, c4), (s3, c4), (s4, c4), (s5, c4), (s6, c4),                   # Алгоритмы: s2-s6
    (s1, c5), (s2, c5), (s5, c5), (s6, c5),                              # ИБ: s1, s2, s5, s6
    (s4, c6), (s5, c6), (s6, c6), (s7, c6), (s8, c6), (s9, c6), (s10, c6),  # Веб: s4-s10
    (s4, c7), (s5, c7), (s7, c7), (s8, c7), (s9, c7),                   # Сети: s4, s5, s7-s9
    (s1, c8), (s7, c8), (s8, c8), (s9, c8), (s10, c8),                  # Статистика: s1, s7-s10
    (s3, c9), (s7, c9), (s8, c9), (s9, c9), (s10, c9),                  # ML: s3, s7-s10
    (s5, c10), (s6, c10), (s7, c10), (s8, c10), (s9, c10), (s10, c10), # Мобильная: s5-s10
]
for sid, cid in enrollments:
    cur.execute(
        "INSERT INTO students_courses (student_id, course_id) VALUES (%s,%s) ON CONFLICT DO NOTHING",
        (sid, cid),
    )
print(f"Зачисления: {len(enrollments)}")

# ── Заявки на курсы ────────────────────────────────────────────────────────────
requests_data = [
    (s7,  c1, "pending"),   # Никита хочет ООП
    (s10, c3, "pending"),   # Алина хочет ОС
    (s3,  c6, "rejected"),  # Артём хотел Веб — отклонено
    (s8,  c5, "pending"),   # Полина хочет ИБ
    (s9,  c2, "pending"),   # Кирилл хочет БД
]
for sid, cid, status in requests_data:
    cur.execute(
        "INSERT INTO course_requests (student_id, course_id, status) "
        "VALUES (%s,%s,%s) ON CONFLICT DO NOTHING",
        (sid, cid, status),
    )
print(f"Заявки: {len(requests_data)}")

# ── Теги курсов ───────────────────────────────────────────────────────────────
course_tags_data = {
    c1:  ["Программирование", "ООП", "Java"],
    c2:  ["Базы данных", "Программирование", "SQL", "PostgreSQL"],
    c3:  ["Операционные системы", "Системное программирование", "Linux"],
    c4:  ["Алгоритмы", "Программирование", "Computer Science"],
    c5:  ["Безопасность", "Криптография", "Сети"],
    c6:  ["Web", "Программирование", "JavaScript", "React"],
    c7:  ["Сети", "Безопасность", "Linux"],
    c8:  ["Математика", "Data Science", "Статистика", "Python"],
    c9:  ["Machine Learning", "Data Science", "Python", "AI"],
    c10: ["Мобильная разработка", "Flutter", "Dart"],
}
for cid, tags in course_tags_data.items():
    for tag in tags:
        cur.execute(
            "INSERT INTO course_tags (course_id, tag) VALUES (%s,%s) ON CONFLICT DO NOTHING",
            (cid, tag),
        )
print("Теги курсов созданы")

# ── Интересы студентов ────────────────────────────────────────────────────────
student_interests_data = {
    s1:  ["Программирование", "Безопасность", "Операционные системы", "Computer Science"],
    s2:  ["Базы данных", "Программирование", "Data Science", "SQL"],
    s3:  ["Алгоритмы", "Программирование", "Machine Learning"],
    s4:  ["Web", "Алгоритмы", "JavaScript", "React"],
    s5:  ["Web", "Базы данных", "Сети"],
    s6:  ["Web", "Безопасность", "Мобильная разработка", "JavaScript"],
    s7:  ["Web", "Мобильная разработка", "Flutter"],
    s8:  ["Data Science", "Статистика", "Machine Learning", "Python"],
    s9:  ["Machine Learning", "Data Science", "AI", "Python", "React"],
    s10: ["Мобильная разработка", "Data Science", "Flutter", "Python"],
}
for sid, interests in student_interests_data.items():
    for tag in interests:
        cur.execute(
            "INSERT INTO student_interests (student_id, tag) VALUES (%s,%s) ON CONFLICT DO NOTHING",
            (sid, tag),
        )
print("Интересы студентов созданы")

# ── Предпочтения студентов ────────────────────────────────────────────────────
preferences_data = [
    (s1, "analytical",
     "Предпочитает глубокое объяснение с примерами кода на C/C++. "
     "Ценит ссылки на первоисточники и RFC."),
    (s4, "visual",
     "Лучше усваивает через визуальные примеры и схемы. "
     "Предпочитает пошаговые инструкции с иллюстрациями."),
    (s8, "statistical",
     "Аналитик: важна строгая математическая нотация, формулы и численные примеры. "
     "Любит сравнительные таблицы методов."),
    (s9, "formal",
     "Предпочитает академический стиль с математическими доказательствами "
     "и ссылками на статьи (arXiv/ACM)."),
]
for sid, style, notes in preferences_data:
    cur.execute(
        "INSERT INTO student_preferences (student_id, preferred_explanation_style, notes) "
        "VALUES (%s,%s,%s) "
        "ON CONFLICT (student_id) DO UPDATE "
        "SET preferred_explanation_style = EXCLUDED.preferred_explanation_style, "
        "    notes = EXCLUDED.notes",
        (sid, style, notes),
    )
print("Предпочтения студентов созданы")

# ── Результаты тестов ─────────────────────────────────────────────────────────
def insert_test(student_id, course_id, topic, difficulty, total, correct):
    wrong = total - correct
    pct = round(correct / total * 100, 1)
    cur.execute(
        "INSERT INTO test_results "
        "(student_id, course_id, topic, source, difficulty, total_questions, "
        " correct_answers, wrong_answers, percentage) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
        (student_id, course_id, topic, "topic", difficulty, total, correct, wrong, pct),
    )
    result_id = cur.fetchone()[0]
    for num in range(1, total + 1):
        is_correct = num <= correct
        cur.execute(
            "INSERT INTO test_result_answers "
            "(test_result_id, question_num, question_text, options, "
            " user_answer, correct_answer, is_correct) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (
                result_id, num,
                f"{topic}: вопрос {num}",
                json.dumps({
                    "A": "Первый вариант ответа",
                    "B": "Второй вариант ответа",
                    "C": "Третий вариант ответа",
                    "D": "Четвёртый вариант ответа",
                }, ensure_ascii=False),
                "A" if is_correct else "B",
                "A",
                is_correct,
            ),
        )
    return result_id


# (student_id, course_id, [(topic, difficulty, total, correct), ...])
test_plan = [
    # ── ООП (c1) ─────────────────────────────────────────────────────────────
    (s1, c1, [("Классы и объекты",  "easy",   5, 5), ("Наследование",   "medium", 5, 4),
              ("Паттерны",           "hard",   5, 4), ("SOLID-принципы", "medium", 5, 4)]),
    (s2, c1, [("Классы и объекты",  "easy",   5, 4), ("Паттерны",       "medium", 5, 3),
              ("Полиморфизм",        "hard",   5, 2)]),
    (s3, c1, [("Классы и объекты",  "easy",   5, 2), ("Наследование",   "medium", 5, 2)]),
    (s4, c1, [("Классы и объекты",  "easy",   5, 5), ("Наследование",   "medium", 5, 5),
              ("Паттерны",           "hard",   5, 4), ("Абстракция",     "medium", 5, 5)]),
    (s5, c1, [("Классы и объекты",  "easy",   5, 4), ("Паттерны",       "medium", 5, 3),
              ("Полиморфизм",        "hard",   5, 3)]),
    (s6, c1, [("Классы и объекты",  "easy",   5, 4), ("Наследование",   "medium", 5, 4),
              ("Паттерны",           "hard",   5, 3)]),
    # ── БД (c2) ──────────────────────────────────────────────────────────────
    (s1, c2, [("SQL JOIN",          "medium", 5, 5), ("Нормализация",   "hard",   5, 4),
              ("Индексы",            "medium", 5, 5), ("Транзакции",    "hard",   5, 4)]),
    (s2, c2, [("SQL JOIN",          "easy",   5, 5), ("Транзакции",    "medium", 5, 4),
              ("Нормализация",       "hard",   5, 3)]),
    (s3, c2, [("SQL JOIN",          "easy",   5, 2), ("Нормализация",  "medium", 5, 2)]),
    (s4, c2, [("SQL JOIN",          "medium", 5, 4), ("Индексы",       "hard",   5, 3),
              ("Транзакции",         "medium", 5, 4)]),
    (s5, c2, [("SQL JOIN",          "easy",   5, 3), ("Транзакции",    "medium", 5, 3),
              ("Нормализация",       "hard",   5, 2)]),
    # ── ОС (c3) ──────────────────────────────────────────────────────────────
    (s1, c3, [("Процессы",          "medium", 5, 4), ("Потоки",        "hard",   5, 4),
              ("Виртуальная память", "hard",   5, 4)]),
    (s2, c3, [("Процессы",          "easy",   5, 3), ("Потоки",        "medium", 5, 3)]),
    (s3, c3, [("Процессы",          "easy",   5, 2), ("Синхронизация", "medium", 5, 1)]),
    (s6, c3, [("Процессы",          "easy",   5, 4), ("Память",        "medium", 5, 3),
              ("Синхронизация",      "hard",   5, 3)]),
    # ── Алгоритмы (c4) ───────────────────────────────────────────────────────
    (s2, c4, [("Сортировки",        "easy",   5, 4), ("Деревья",       "medium", 5, 4),
              ("Графы",              "hard",   5, 3)]),
    (s3, c4, [("Сортировки",        "easy",   5, 3), ("Деревья",       "medium", 5, 2)]),
    (s4, c4, [("Сортировки",        "easy",   5, 5), ("Деревья",       "medium", 5, 5),
              ("Графы",              "hard",   5, 4), ("Динамическое программирование", "hard", 5, 4)]),
    (s5, c4, [("Сортировки",        "easy",   5, 4), ("Деревья",       "medium", 5, 3),
              ("Графы",              "hard",   5, 2)]),
    (s6, c4, [("Сортировки",        "easy",   5, 4), ("Деревья",       "medium", 5, 3),
              ("Динамическое программирование", "hard", 5, 3)]),
    # ── ИБ (c5) ──────────────────────────────────────────────────────────────
    (s1, c5, [("Криптография",      "medium", 5, 4), ("PKI",           "hard",   5, 4),
              ("Уязвимости",         "hard",   5, 4)]),
    (s2, c5, [("Криптография",      "easy",   5, 4), ("Атаки",         "medium", 5, 3),
              ("PKI",                "hard",   5, 2)]),
    (s5, c5, [("Криптография",      "easy",   5, 3), ("Атаки",         "medium", 5, 2)]),
    (s6, c5, [("Криптография",      "medium", 5, 4), ("Уязвимости",    "hard",   5, 3),
              ("PKI",                "hard",   5, 3)]),
    # ── Веб (c6) ─────────────────────────────────────────────────────────────
    (s4,  c6, [("HTML/CSS",         "easy",   5, 5), ("JavaScript",    "medium", 5, 5),
               ("React",             "hard",   5, 4), ("REST API",      "medium", 5, 5)]),
    (s5,  c6, [("HTML/CSS",         "easy",   5, 4), ("JavaScript",    "medium", 5, 4),
               ("React",             "hard",   5, 3)]),
    (s6,  c6, [("HTML/CSS",         "easy",   5, 5), ("JavaScript",    "medium", 5, 4),
               ("React",             "hard",   5, 4)]),
    (s7,  c6, [("HTML/CSS",         "easy",   5, 2), ("JavaScript",    "medium", 5, 1)]),
    (s8,  c6, [("HTML/CSS",         "easy",   5, 4), ("JavaScript",    "medium", 5, 3),
               ("REST API",          "medium", 5, 4)]),
    (s9,  c6, [("HTML/CSS",         "easy",   5, 5), ("JavaScript",    "medium", 5, 5),
               ("React",             "hard",   5, 5)]),
    (s10, c6, [("HTML/CSS",         "easy",   5, 4), ("JavaScript",    "medium", 5, 4),
               ("React",             "hard",   5, 3)]),
    # ── Сети (c7) ────────────────────────────────────────────────────────────
    (s4,  c7, [("OSI модель",       "easy",   5, 4), ("TCP/IP",        "medium", 5, 4),
               ("DNS и HTTP",        "medium", 5, 4)]),
    (s5,  c7, [("OSI модель",       "easy",   5, 3), ("TCP/IP",        "medium", 5, 3)]),
    (s7,  c7, [("OSI модель",       "easy",   5, 2), ("TCP/IP",        "medium", 5, 1)]),
    (s8,  c7, [("OSI модель",       "easy",   5, 4), ("Маршрутизация", "hard",   5, 3),
               ("TCP/IP",            "medium", 5, 4)]),
    (s9,  c7, [("OSI модель",       "easy",   5, 5), ("TCP/IP",        "medium", 5, 5),
               ("Маршрутизация",     "hard",   5, 4)]),
    # ── Статистика (c8) ──────────────────────────────────────────────────────
    (s1,  c8, [("Вероятность",      "medium", 5, 4), ("Распределения", "hard",   5, 3),
               ("Проверка гипотез",  "hard",   5, 3)]),
    (s7,  c8, [("Вероятность",      "easy",   5, 2), ("Распределения", "medium", 5, 2)]),
    (s8,  c8, [("Вероятность",      "easy",   5, 4), ("Распределения", "medium", 5, 4),
               ("Проверка гипотез",  "hard",   5, 3)]),
    (s9,  c8, [("Вероятность",      "medium", 5, 5), ("Распределения", "hard",   5, 4),
               ("Проверка гипотез",  "hard",   5, 5)]),
    (s10, c8, [("Вероятность",      "easy",   5, 3), ("Распределения", "medium", 5, 3)]),
    # ── ML (c9) ──────────────────────────────────────────────────────────────
    (s3,  c9, [("Линейная регрессия", "easy",  5, 2), ("Классификация", "medium", 5, 2)]),
    (s7,  c9, [("Линейная регрессия", "easy",  5, 1), ("Классификация", "medium", 5, 1)]),
    (s8,  c9, [("Линейная регрессия", "easy",  5, 4), ("Классификация", "medium", 5, 3),
               ("Нейросети",          "hard",   5, 3)]),
    (s9,  c9, [("Линейная регрессия", "easy",  5, 5), ("Классификация", "medium", 5, 5),
               ("Нейросети",          "hard",   5, 4), ("Кластеризация", "medium", 5, 5)]),
    (s10, c9, [("Линейная регрессия", "easy",  5, 3), ("Классификация", "medium", 5, 3),
               ("Нейросети",          "hard",   5, 2)]),
    # ── Мобильная (c10) ──────────────────────────────────────────────────────
    (s5,  c10, [("Dart/Flutter",    "easy",   5, 3), ("Навигация",     "medium", 5, 3)]),
    (s6,  c10, [("Dart/Flutter",    "easy",   5, 4), ("Навигация",     "medium", 5, 4),
                ("Управление состоянием", "hard", 5, 3)]),
    (s7,  c10, [("Dart/Flutter",    "easy",   5, 2), ("Навигация",     "medium", 5, 1)]),
    (s8,  c10, [("Dart/Flutter",    "easy",   5, 4), ("Навигация",     "medium", 5, 3),
                ("Управление состоянием", "hard", 5, 3)]),
    (s9,  c10, [("Dart/Flutter",    "easy",   5, 5), ("Навигация",     "medium", 5, 5),
                ("Управление состоянием", "hard", 5, 4)]),
    (s10, c10, [("Dart/Flutter",    "easy",   5, 4), ("Навигация",     "medium", 5, 4),
                ("Управление состоянием", "hard", 5, 3)]),
]

for student_id, course_id, tests in test_plan:
    for topic, difficulty, total, correct in tests:
        insert_test(student_id, course_id, topic, difficulty, total, correct)
print("Результаты тестов созданы")

# ── Результаты экзаменов ───────────────────────────────────────────────────────
def insert_exam(student_id, course_id, completed, scores):
    avg = round(sum(scores) / len(scores), 1) if completed and scores else None
    cur.execute(
        "INSERT INTO exam_results "
        "(student_id, course_id, total_questions, avg_score, completed) "
        "VALUES (%s,%s,%s,%s,%s) RETURNING id",
        (student_id, course_id, len(scores), avg, completed),
    )
    exam_id = cur.fetchone()[0]
    if completed:
        for i, score in enumerate(scores, 1):
            if score >= 80:
                verdict = "correct"
                rec = "Отличный ответ! Материал хорошо усвоен, продолжайте в том же духе."
            elif score >= 55:
                verdict = "partial"
                rec = "Ответ неполный. Изучите тему подробнее и обратите внимание на детали."
            else:
                verdict = "incorrect"
                rec = "Ответ неверный. Рекомендуется повторить раздел и разобрать дополнительные примеры."
            cur.execute(
                "INSERT INTO exam_result_answers "
                "(exam_result_id, question_id, question_text, user_answer, "
                " verdict, recommendation, issues, score) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    exam_id, i,
                    f"Экзаменационный вопрос {i}",
                    f"Развёрнутый ответ студента на вопрос {i}.",
                    verdict, rec,
                    json.dumps([], ensure_ascii=False),
                    str(score),
                ),
            )
    return exam_id


# (student_id, course_id, completed, scores_list)
exam_plan = [
    # ── ООП (c1) ──────────────────────────────────────────────────────────────
    (s1, c1, True,  [90, 85, 88]),
    (s1, c1, False, [50]),           # брошенная попытка
    (s2, c1, True,  [75, 68, 72]),
    (s3, c1, True,  [48, 52, 44]),
    (s4, c1, True,  [95, 92, 90, 88]),
    (s5, c1, True,  [70, 65, 72]),
    (s6, c1, True,  [80, 75, 78]),
    # ── БД (c2) ───────────────────────────────────────────────────────────────
    (s1, c2, True,  [92, 88, 90]),
    (s1, c2, True,  [85, 80, 88]),   # повторная попытка
    (s2, c2, True,  [78, 72, 80]),
    (s3, c2, True,  [45, 50, 42]),
    (s4, c2, True,  [85, 82, 88]),
    (s5, c2, True,  [62, 58, 65]),
    # ── ОС (c3) ───────────────────────────────────────────────────────────────
    (s1, c3, True,  [88, 85, 90]),
    (s2, c3, True,  [68, 65, 70]),
    (s3, c3, False, [30]),
    (s6, c3, True,  [82, 78, 85]),
    # ── Алгоритмы (c4) ────────────────────────────────────────────────────────
    (s2, c4, True,  [78, 75, 80]),
    (s3, c4, False, [35]),
    (s4, c4, True,  [95, 90, 92]),
    (s5, c4, True,  [65, 60, 68]),
    (s6, c4, True,  [75, 72, 78]),
    # ── ИБ (c5) ───────────────────────────────────────────────────────────────
    (s1, c5, True,  [85, 80, 88]),
    (s2, c5, True,  [70, 65, 72]),
    (s5, c5, True,  [60, 55, 58]),
    (s6, c5, True,  [78, 82, 75]),
    # ── Веб (c6) ──────────────────────────────────────────────────────────────
    (s4,  c6, True,  [96, 92, 94, 90]),
    (s5,  c6, True,  [72, 68, 75]),
    (s6,  c6, True,  [88, 85, 90]),
    (s7,  c6, True,  [42, 38, 45]),
    (s8,  c6, True,  [78, 75, 80]),
    (s9,  c6, True,  [95, 92, 98]),
    (s10, c6, True,  [72, 70, 76]),
    # ── Сети (c7) ─────────────────────────────────────────────────────────────
    (s4,  c7, True,  [85, 82, 88]),
    (s5,  c7, True,  [65, 60, 68]),
    (s7,  c7, False, [28]),
    (s8,  c7, True,  [80, 78, 82]),
    (s9,  c7, True,  [92, 90, 94]),
    # ── Статистика (c8) ───────────────────────────────────────────────────────
    (s1,  c8, True,  [75, 70, 78]),
    (s7,  c8, True,  [45, 40, 48]),
    (s8,  c8, True,  [82, 78, 85]),
    (s9,  c8, True,  [90, 88, 92]),
    (s10, c8, True,  [62, 58, 65]),
    # ── ML (c9) ───────────────────────────────────────────────────────────────
    (s3,  c9, True,  [42, 38, 45]),
    (s7,  c9, False, [25]),
    (s8,  c9, True,  [78, 72, 80]),
    (s9,  c9, True,  [92, 90, 95]),
    (s10, c9, True,  [65, 60, 68]),
    # ── Мобильная (c10) ───────────────────────────────────────────────────────
    (s5,  c10, True,  [68, 65, 70]),
    (s6,  c10, True,  [80, 78, 82]),
    (s7,  c10, True,  [38, 35, 42]),
    (s8,  c10, True,  [75, 72, 78]),
    (s9,  c10, True,  [90, 88, 92]),
    (s10, c10, True,  [78, 75, 80]),
]

for student_id, course_id, completed, scores in exam_plan:
    insert_exam(student_id, course_id, completed, scores)
print("Результаты экзаменов созданы")

# ── Отчёты по лабам ────────────────────────────────────────────────────────────
_COMMENTS = [
    "Отчёт не содержит описания архитектуры решения. Добавьте раздел с диаграммами "
    "и обоснованием выбора подхода.",
    "Код не компилируется. Исправьте ошибки и приложите скриншоты успешного запуска.",
    "Анализ результатов недостаточно подробный. Требуется сравнение минимум трёх подходов "
    "с замерами производительности.",
    "SQL-запросы не оптимизированы, отсутствуют индексы. Добавьте EXPLAIN ANALYZE "
    "с интерпретацией плана выполнения.",
    "Обнаружен плагиат из открытых источников. Переработайте отчёт полностью самостоятельно.",
    "Отсутствуют результаты тестирования. Добавьте бенчмарки и графики сравнения.",
]

# (student_id, course_id, lab_idx_0based, status, comment_or_None)
reports_raw = [
    # ── ООП (c1) ─────────────────────────────────────────────────────────────
    (s1, c1, 0, "approved",      None),
    (s1, c1, 1, "approved",      None),
    (s1, c1, 2, "approved",      None),
    (s2, c1, 0, "approved",      None),
    (s2, c1, 1, "not-approved",  _COMMENTS[0]),
    (s2, c1, 2, "pending",       None),
    (s3, c1, 0, "pending",       None),
    (s4, c1, 0, "approved",      None),
    (s4, c1, 1, "approved",      None),
    (s4, c1, 2, "approved",      None),
    (s5, c1, 0, "approved",      None),
    (s5, c1, 1, "pending",       None),
    (s6, c1, 0, "approved",      None),
    (s6, c1, 1, "approved",      None),
    (s6, c1, 2, "not-approved",  _COMMENTS[2]),
    # ── БД (c2) ──────────────────────────────────────────────────────────────
    (s1, c2, 0, "approved",      None),
    (s1, c2, 1, "approved",      None),
    (s1, c2, 2, "approved",      None),
    (s2, c2, 0, "approved",      None),
    (s2, c2, 1, "approved",      None),
    (s2, c2, 2, "pending",       None),
    (s3, c2, 0, "not-approved",  _COMMENTS[3]),
    (s4, c2, 0, "approved",      None),
    (s4, c2, 1, "pending",       None),
    (s5, c2, 0, "approved",      None),
    (s5, c2, 1, "not-approved",  _COMMENTS[2]),
    # ── ОС (c3) ──────────────────────────────────────────────────────────────
    (s1, c3, 0, "approved",      None),
    (s1, c3, 1, "approved",      None),
    (s1, c3, 2, "pending",       None),
    (s2, c3, 0, "approved",      None),
    (s2, c3, 1, "pending",       None),
    (s3, c3, 0, "not-approved",  _COMMENTS[1]),
    (s6, c3, 0, "approved",      None),
    (s6, c3, 1, "approved",      None),
    (s6, c3, 2, "approved",      None),
    # ── Алгоритмы (c4) ───────────────────────────────────────────────────────
    (s2, c4, 0, "approved",      None),
    (s2, c4, 1, "approved",      None),
    (s3, c4, 0, "not-approved",  _COMMENTS[5]),
    (s4, c4, 0, "approved",      None),
    (s4, c4, 1, "approved",      None),
    (s4, c4, 2, "approved",      None),
    (s5, c4, 0, "approved",      None),
    (s5, c4, 1, "pending",       None),
    (s6, c4, 0, "approved",      None),
    (s6, c4, 1, "approved",      None),
    (s6, c4, 2, "not-approved",  _COMMENTS[2]),
    # ── ИБ (c5) ──────────────────────────────────────────────────────────────
    (s1, c5, 0, "approved",      None),
    (s1, c5, 1, "approved",      None),
    (s1, c5, 2, "approved",      None),
    (s2, c5, 0, "approved",      None),
    (s2, c5, 1, "not-approved",  _COMMENTS[4]),
    (s5, c5, 0, "pending",       None),
    (s6, c5, 0, "approved",      None),
    (s6, c5, 1, "pending",       None),
    # ── Веб (c6) ─────────────────────────────────────────────────────────────
    (s4,  c6, 0, "approved",     None),
    (s4,  c6, 1, "approved",     None),
    (s4,  c6, 2, "approved",     None),
    (s5,  c6, 0, "approved",     None),
    (s5,  c6, 1, "approved",     None),
    (s5,  c6, 2, "pending",      None),
    (s6,  c6, 0, "approved",     None),
    (s6,  c6, 1, "approved",     None),
    (s6,  c6, 2, "approved",     None),
    (s7,  c6, 0, "not-approved", _COMMENTS[1]),
    (s8,  c6, 0, "approved",     None),
    (s8,  c6, 1, "pending",      None),
    (s9,  c6, 0, "approved",     None),
    (s9,  c6, 1, "approved",     None),
    (s9,  c6, 2, "approved",     None),
    (s10, c6, 0, "approved",     None),
    (s10, c6, 1, "pending",      None),
    # ── Сети (c7) ────────────────────────────────────────────────────────────
    (s4,  c7, 0, "approved",     None),
    (s4,  c7, 1, "approved",     None),
    (s5,  c7, 0, "approved",     None),
    (s7,  c7, 0, "not-approved", _COMMENTS[0]),
    (s8,  c7, 0, "approved",     None),
    (s8,  c7, 1, "approved",     None),
    (s9,  c7, 0, "approved",     None),
    (s9,  c7, 1, "approved",     None),
    # ── Статистика (c8) ──────────────────────────────────────────────────────
    (s1,  c8, 0, "approved",     None),
    (s1,  c8, 1, "pending",      None),
    (s7,  c8, 0, "not-approved", _COMMENTS[2]),
    (s8,  c8, 0, "approved",     None),
    (s8,  c8, 1, "approved",     None),
    (s9,  c8, 0, "approved",     None),
    (s9,  c8, 1, "approved",     None),
    (s10, c8, 0, "approved",     None),
    # ── ML (c9) ──────────────────────────────────────────────────────────────
    (s3,  c9, 0, "not-approved", _COMMENTS[5]),
    (s8,  c9, 0, "approved",     None),
    (s8,  c9, 1, "pending",      None),
    (s9,  c9, 0, "approved",     None),
    (s9,  c9, 1, "approved",     None),
    (s9,  c9, 2, "approved",     None),
    (s10, c9, 0, "approved",     None),
    # ── Мобильная (c10) ──────────────────────────────────────────────────────
    (s5,  c10, 0, "approved",    None),
    (s6,  c10, 0, "approved",    None),
    (s6,  c10, 1, "approved",    None),
    (s7,  c10, 0, "not-approved", _COMMENTS[1]),
    (s8,  c10, 0, "approved",    None),
    (s8,  c10, 1, "pending",     None),
    (s9,  c10, 0, "approved",    None),
    (s9,  c10, 1, "approved",    None),
    (s10, c10, 0, "approved",    None),
    (s10, c10, 1, "approved",    None),
]

for sid, cid, lab_idx, status, comment in reports_raw:
    lab_id = lab_ids[cid][lab_idx]
    url = (f"https://docs.google.com/document/d/"
           f"s{_sid_num[sid]}_c{_cid_num[cid]}_lab{lab_idx + 1}")
    cur.execute(
        "INSERT INTO reports (lab_id, student_id, url, status, comment) "
        "VALUES (%s,%s,%s,%s::report_status,%s)",
        (lab_id, sid, url, status, comment),
    )
print(f"Отчёты: {len(reports_raw)} записей")

# ── Рейтинги курсов ──────────────────────────────────────────────────────────
ratings_data = [
    (s1,  c1, 5), (s1,  c2, 5), (s1,  c3, 4), (s1,  c5, 4), (s1,  c8, 4),
    (s2,  c1, 4), (s2,  c2, 5), (s2,  c4, 4), (s2,  c5, 3),
    (s3,  c1, 3), (s3,  c2, 3), (s3,  c4, 3), (s3,  c9, 3),
    (s4,  c1, 5), (s4,  c4, 5), (s4,  c6, 5), (s4,  c7, 4),
    (s5,  c1, 4), (s5,  c6, 4), (s5,  c7, 3), (s5,  c10, 4),
    (s6,  c1, 4), (s6,  c3, 4), (s6,  c6, 5), (s6,  c10, 4),
    (s7,  c6, 3), (s7,  c10, 2),
    (s8,  c6, 4), (s8,  c7, 4), (s8,  c8, 5), (s8,  c9, 4), (s8,  c10, 4),
    (s9,  c6, 5), (s9,  c7, 5), (s9,  c8, 5), (s9,  c9, 5), (s9,  c10, 5),
    (s10, c6, 4), (s10, c9, 4), (s10, c10, 4),
]
for sid, cid, rating in ratings_data:
    cur.execute(
        "INSERT INTO course_ratings (student_id, course_id, rating) "
        "VALUES (%s,%s,%s) ON CONFLICT DO NOTHING",
        (sid, cid, rating),
    )
print(f"Рейтинги: {len(ratings_data)} оценок")

# ── Чаты и сообщения ─────────────────────────────────────────────────────────
def insert_chat(student_id, course_id, name, messages):
    cur.execute(
        "INSERT INTO chats (student_id, course_id, name) VALUES (%s,%s,%s) RETURNING id",
        (student_id, course_id, name),
    )
    chat_id = cur.fetchone()[0]
    for role, content in messages:
        cur.execute(
            "INSERT INTO chat_messages (chat_id, role, content) VALUES (%s,%s,%s)",
            (chat_id, role, content),
        )
    return chat_id


chats_data = [
    (s1, c1, "Паттерны проектирования", [
        ("human", "Объясни разницу между «Фабричным методом» и «Абстрактной фабрикой»"),
        ("ai",
         "Оба паттерна — порождающие, но решают разные задачи.\n\n"
         "**Фабричный метод** определяет интерфейс создания объекта, но позволяет подклассам "
         "изменять тип создаваемого объекта. Используется, когда класс не знает заранее, "
         "объекты каких классов нужно создавать.\n\n"
         "**Абстрактная фабрика** предоставляет интерфейс для создания *семейств* "
         "взаимосвязанных объектов без указания конкретных классов.\n\n"
         "**Аналогия:** Фабричный метод — один вид продукта (только кнопка). "
         "Абстрактная фабрика — весь UI-набор (кнопка + чекбокс + поле) в едином стиле."),
        ("human", "А когда лучше использовать Builder?"),
        ("ai",
         "**Builder** подходит, когда:\n"
         "1. Объект имеет много необязательных параметров\n"
         "2. Нужно создавать разные представления одного объекта\n"
         "3. Сборка требует нескольких шагов\n\n"
         "```java\nPerson p = new Person.Builder(\"Иван\")\n"
         "    .age(25).email(\"ivan@mail.ru\").build();\n```\n\n"
         "В отличие от Фабрики, Builder конструирует объект пошагово."),
    ]),
    (s9, c9, "Нейронные сети", [
        ("human", "Как работает backpropagation?"),
        ("ai",
         "**Backpropagation** — алгоритм вычисления градиентов по правилу цепочки.\n\n"
         "**Шаги:**\n"
         "1. Forward pass: данные → активации каждого слоя\n"
         "2. Loss: вычисляем ошибку (Cross-Entropy или MSE)\n"
         "3. Backward pass: δL/δw = δL/δa · δa/δz · δz/δw\n"
         "4. Update: w = w − α · δL/δw\n\n"
         "**Проблема vanishing gradients** в глубоких сетях с sigmoid/tanh. "
         "Решение — ReLU и его варианты."),
        ("human", "Какую функцию потерь брать для многоклассовой классификации?"),
        ("ai",
         "Стандарт — **Categorical Cross-Entropy**: L = −Σ yᵢ · log(ŷᵢ)\n\n"
         "где yᵢ — one-hot метка, ŷᵢ — вероятность softmax.\n\n"
         "**Почему не MSE?** Слабый градиент для уверенно неверных предсказаний.\n\n"
         "Альтернативы: Focal Loss (дисбаланс классов), Label Smoothing (overconfidence)."),
    ]),
    (s4, c6, "React хуки", [
        ("human", "В чём разница между useEffect и useLayoutEffect?"),
        ("ai",
         "**useEffect** — асинхронно *после* отрисовки браузером. "
         "Для API-запросов, подписок, таймеров.\n\n"
         "**useLayoutEffect** — синхронно *после* DOM-мутаций, *до* отрисовки. "
         "Для измерения размеров DOM (избегаем мерцания).\n\n"
         "```tsx\n// Измерение DOM\nuseLayoutEffect(() => {\n"
         "  setWidth(ref.current.getBoundingClientRect().width);\n}, []);\n```\n\n"
         "**Правило:** начинайте с `useEffect`, "
         "переключайтесь на `useLayoutEffect` только при мерцании UI."),
    ]),
    (s2, c2, "Оконные функции SQL", [
        ("human", "Как работают оконные функции в PostgreSQL?"),
        ("ai",
         "Вычисляют значение для каждой строки на основе связанного набора — "
         "без группировки (строки не схлопываются).\n\n"
         "```sql\nSELECT student_id, avg_score,\n"
         "  RANK() OVER (PARTITION BY course_id ORDER BY avg_score DESC) AS rank\n"
         "FROM exam_results WHERE completed = TRUE;\n```\n\n"
         "**Функции:** ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD, SUM/AVG OVER."),
        ("human", "Как получить TOP-3 студента по каждому курсу?"),
        ("ai",
         "```sql\nWITH ranked AS (\n"
         "  SELECT student_id, course_id, AVG(avg_score) AS score,\n"
         "    ROW_NUMBER() OVER (PARTITION BY course_id\n"
         "                       ORDER BY AVG(avg_score) DESC) AS rn\n"
         "  FROM exam_results WHERE completed = TRUE\n"
         "  GROUP BY student_id, course_id\n"
         ")\nSELECT * FROM ranked WHERE rn <= 3;\n```\n\n"
         "ROW_NUMBER, а не RANK — чтобы при равных баллах строк было ровно 3."),
    ]),
    (s8, c8, "Проверка гипотез", [
        ("human", "Когда применять t-тест, а когда Mann-Whitney?"),
        ("ai",
         "**t-тест:** нормальное распределение (или n > 30), непрерывная переменная, "
         "равные дисперсии (тест Левена).\n\n"
         "**Mann-Whitney:** ненормальные данные, порядковая шкала, "
         "малые выборки, наличие выбросов.\n\n"
         "**Алгоритм выбора:**\n"
         "1. Shapiro-Wilk → p > 0.05: t-тест\n"
         "2. Shapiro-Wilk → p ≤ 0.05: Mann-Whitney\n\n"
         "Важно: Mann-Whitney проверяет равенство распределений, не средних."),
    ]),
    (s6, c5, "Симметричное vs асимметричное шифрование", [
        ("human", "Объясни разницу между симметричным и асимметричным шифрованием"),
        ("ai",
         "**Симметричное** — один ключ для шифрования и расшифровки.\n"
         "Примеры: AES-256-GCM. Быстрое, но проблема передачи ключа.\n\n"
         "**Асимметричное** — пара ключей (публичный + приватный).\n"
         "Примеры: RSA-2048, ECC. Решает проблему обмена, но медленное.\n\n"
         "**На практике — гибрид (TLS 1.3):**\n"
         "1. ECDH — безопасный обмен сессионным ключом\n"
         "2. AES-256-GCM — шифрование данных\n\n"
         "Поэтому HTTPS быстрый, несмотря на использование асимметричного шифрования."),
    ]),
]

for student_id, course_id, chat_name, messages in chats_data:
    insert_chat(student_id, course_id, chat_name, messages)
print(f"Чаты: {len(chats_data)}, сообщений: {sum(len(m) for *_, m in chats_data)}")

# ── Обновление материализованного представления ───────────────────────────────
conn.commit()
try:
    conn.autocommit = True
    cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY course_ranking_stats")
    print("course_ranking_stats обновлён")
except Exception as e:
    print(f"Предупреждение: не удалось обновить course_ranking_stats: {e}")
finally:
    conn.autocommit = False

cur.close()
conn.close()

print()
print("=" * 60)
print("Seed завершён успешно!")
print("=" * 60)
print("Преподаватели:")
print("  teacher1 / teacher1  — Алексей Соколов")
print("    Курсы: ООП, Базы данных, ОС, Алгоритмы, ИБ")
print("  teacher2 / teacher2  — Марина Белова")
print("    Курсы: Веб, Сети, Статистика, ML, Мобильная")
print()
print("Студенты (login = password):")
for i, (login, _, fn, ln, _) in enumerate(students_data, 1):
    print(f"  {login:12} — {fn} {ln}")
print()
print(f"Итого: 10 курсов, {len(enrollments)} зачислений, "
      f"{len(reports_raw)} отчётов, {len(exam_plan)} экзаменов, "
      f"{len(chats_data)} чатов")
