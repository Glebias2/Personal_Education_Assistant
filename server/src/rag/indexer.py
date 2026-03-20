from uuid import uuid4

from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from database.vector.repositories import StorageManager
from .exceptions import InvalidFile


class Indexer():
    """Processes files and saves them to vector storage

    Args:
        storage_id: identifier of the storage where the content will be saved
    """

    def __init__(self, storage_id: str,  chunk_size: int = 1000, chunk_overlap: int = 200):
        self.__vector_storage = StorageManager.get_vector_storage(storage_id)
        self.__chunk_size = chunk_size
        self.__chunk_overlap = chunk_overlap


    def __index(self, documents: list[Document], file_id: str) -> None:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.__chunk_size,
            chunk_overlap=self.__chunk_overlap
        )

        chunks = splitter.split_documents(documents)

        for chunk in chunks:
            chunk.metadata["file_id"] = file_id

        self.__vector_storage.add_documents(chunks)


    def add_file(self, file_path: str) -> str:
        """Add file to indexer.

        Returns:
            file index in storage.

        Raises:
            InvalidFile: if the file type is not supported.
        """
        
        file_id = uuid4().hex
        #TODO uniqueness check

        lower_file_path = file_path.lower()
        if lower_file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)

        elif lower_file_path.endswith(".docx"):
            loader = Docx2txtLoader(file_path)

        elif lower_file_path.endswith(".txt"):
            loader = TextLoader(file_path)

        else:
            raise InvalidFile(f"file format '{file_path}' is not supported")

        documents = loader.load()
        self.__index(documents, file_id)

        return file_id
