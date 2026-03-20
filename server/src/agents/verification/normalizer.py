import re
import nltk
from nltk.corpus import stopwords
from natasha import Doc
from natasha import (
    Segmenter, 
    MorphVocab, 
    NewsEmbedding, 
    NewsMorphTagger
)

class TextNormalizer:
    def __init__(self, language='russian'):
        self.__segmenter = Segmenter()
        self.__morph_vocab = MorphVocab()
        self.__morph_tagger = NewsMorphTagger(NewsEmbedding())
        self.__stopwords = set(stopwords.words(language))

    def normalize_text(self, text: str, remove_stopwords=True, use_lemmatization=True) -> str:
        nltk.download('stopwords')
        text = text.lower()
        text = re.sub(r'[^a-zA-Zа-яё\s]', ' ', text)

        doc = Doc(text)
        doc.segment(self.__segmenter)

        # Морфологический разбор
        doc.tag_morph(self.__morph_tagger)

        # Лемматизация
        if use_lemmatization:
            for token in doc.tokens:
                token.lemmatize(self.__morph_vocab)
            words = [token.lemma for token in doc.tokens]
        else:
            words = [token.text for token in doc.tokens]

        # Удаление стоп-слов
        if remove_stopwords:
            words = [word for word in words if word not in self.__stopwords]

        return ' '.join(words)
