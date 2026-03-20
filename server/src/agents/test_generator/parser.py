import re
from typing import List, Dict, Tuple
from .models import Question

# Парсер вопросов из текста LLM
class TestParser:
    def __init__(self, debug: bool = False):
        self.debug = debug

    def parse_questions(self, text: str) -> Tuple[List[Question], List[str]]:
        questions = []
        errors = []

        question_pattern = r'(?:QUESTION|ВОПРОС)\s*[:\.]?\s*(\d+)\s*[:\.]?\s*(.+?)(?=(?:QUESTION|ВОПРОС|$))'
        question_matches = re.finditer(question_pattern, text, re.IGNORECASE | re.DOTALL)

        for match in question_matches:
            try:
                q_num = int(match.group(1))
                q_text_block = match.group(2).strip()
                correct_answer = self._find_correct_answer(q_text_block)
                q_text_block_cleaned = self._remove_answer_line(q_text_block)
                lines = q_text_block_cleaned.split('\n')

                question_text = ""
                options_start_idx = 0

                for idx, line in enumerate(lines):
                    line = line.strip()
                    if line and not re.match(r'^[A-D]\)', line):
                        question_text = line
                        options_start_idx = idx + 1
                        break

                if not question_text:
                    errors.append(f"Вопрос {q_num}: Текст вопроса не найден")
                    continue

                options = self._extract_options(lines[options_start_idx:])

                error = self._validate_question(q_num, question_text, options, correct_answer)

                if error:
                    errors.append(error)
                    continue

                question = Question(
                    question_num=q_num,
                    text=question_text,
                    options=options,
                    correct_answer=correct_answer,
                    type="multiple_choice"
                )

                questions.append(question)

            except Exception as e:
                errors.append(f"Ошибка при парсинге: {str(e)}")
                if self.debug:
                    print(f"Ошибка парсинга вопроса: {e}")
        return questions, errors

    # Извлекает варианты ответа
    def _extract_options(self, lines: List[str]) -> Dict[str, str]:
        options = {}
        current_letter = None
        current_text = ""

        for line in lines:
            line = line.strip()
            if not line:
                continue

            match = re.match(r'^([A-D])\)\s*(.*)', line)
            if match:
                if current_letter and current_text:
                    options[current_letter] = current_text

                current_letter = match.group(1).upper()
                current_text = match.group(2).strip()
            else:
                if current_letter:
                    current_text += " " + line

        # Сохраняем последнюю опцию
        if current_letter and current_text:
            options[current_letter] = current_text

        return options

    # Нахожит ответ в тексте LLM
    def _find_correct_answer(self, text: str) -> str:
        patterns = [
            (r'ОТВЕТ\s*[:：]\s*([A-D])', 'ОТВЕТ: {letter}'),
            (r'ANSWER\s*[:：]\s*([A-D])', 'ANSWER: {letter}'),
            (r'ответ\s*[:：]\s*([A-D])', 'ответ: {letter}'),
            (r'answer\s*[:：]\s*([A-D])', 'answer: {letter}'),
            (r'\*\*([A-D])\*\*', '**{letter}**'),
            (r'\*([A-D])\*', '*{letter}*'),
        ]

        for pattern, name in patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE))
            if matches:
                last_match = matches[-1]
                answer = last_match.group(1).upper()
                if answer in ['A', 'B', 'C', 'D']:
                    return answer

        # Резервный вариант - ищем последнюю букву A-D перед концом текста
        last_lines = text.split('\n')[-5:]
        for line in reversed(last_lines):
            for letter in ['A', 'B', 'C', 'D']:
                if letter in line.upper():
                    return letter

        if self.debug:
            print(f"Ответ не найден! Используется A как по умолчанию")
        return "A"

    # Удаляет строку ОТВЕТ: из текста
    def _remove_answer_line(self, text: str) -> str:
        lines = text.split('\n')
        cleaned_lines = []

        for line in lines:
            if not re.search(r'(?:ОТВЕТ|ANSWER)\s*[:：]\s*[A-D]', line, re.IGNORECASE):
                cleaned_lines.append(line)

        return '\n'.join(cleaned_lines)

    # Валидация вопроса
    def _validate_question(self, num: int, text: str, options: Dict, answer: str) -> str:
        # Проверка текста вопроса
        if not text or len(text) < 5:
            return f"Вопрос {num}: Текст слишком короткий"

        # Проверка количества вариантов
        if len(options) < 3:
            return f"Вопрос {num}: Должно быть минимум 3 варианта ответов, найдено {len(options)}"

        # Если 3 варианта, добавляем четвертый
        if len(options) < 4:
            letters = set(options.keys())
            all_letters = {'A', 'B', 'C', 'D'}
            missing_letter = list(all_letters - letters)[0] if letters != all_letters else None

            if missing_letter:
                options[missing_letter] = f"Вариант {missing_letter}"

        # Проверка букв вариантов
        valid_letters = {'A', 'B', 'C', 'D'}
        if len(set(options.keys()) & valid_letters) < 3:
            return f"❌ Вопрос {num}: Неправильные буквы вариантов: {list(options.keys())}"

        # Проверка правильного ответа
        if not answer or answer not in valid_letters:
            return f"❌ Вопрос {num}: Правильный ответ не найден или неправильный"

        return ""
