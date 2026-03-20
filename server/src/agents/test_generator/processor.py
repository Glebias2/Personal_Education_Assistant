from .config import Config

class MaterialProcessor:
    @staticmethod
    def prepare_for_llm(material: str) -> str:
        # Удаляем лишние пробелы и переносы
        material = ' '.join(material.split())

        # Обрезаем до максимальной длины
        if len(material) > Config.MAX_MATERIAL_LENGTH:
            material = material[:Config.MAX_MATERIAL_LENGTH]

        return material

    # Для PDF-файла
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            raise Exception(f"Ошибка при чтении PDF: {str(e)}")

    # Для Docs-файла
    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        try:
            from docx import Document
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Ошибка при чтении DOCX: {str(e)}")

    # Извлекает текст по типу файла
    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        if file_path.endswith('.pdf'):
            return MaterialProcessor.extract_text_from_pdf(file_path)
        elif file_path.endswith('.docx'):
            return MaterialProcessor.extract_text_from_docx(file_path)
        elif file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            raise Exception(f"Неподдерживаемый формат файла: {file_path}")
