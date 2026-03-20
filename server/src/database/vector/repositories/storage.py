from uuid import uuid4
from typing import Any

import weaviate
from weaviate import WeaviateClient
from weaviate.classes.config import Property, DataType, Configure
from langchain_weaviate import WeaviateVectorStore
from langchain_core.documents import Document


from settings import settings
from database.vector.client import wvt_client


class VectorStore(WeaviateVectorStore):
    def check_in(self, query: str, distance: float = 0.7) -> bool:
        collection = self._client.collections.get(self._index_name)

        result = collection.query.near_text(
            query=query,
            limit=1,
            target_vector="main_vector",
            distance=distance
        )

        if result.objects:
            return True
        else:
            return False

    def similarity_search(self, query: str, k: int = 4, **kwargs: Any) -> list[Document]:
        """Поиск через Weaviate near_text (серверная векторизация).
        Возвращает документы с metadata['distance'] для фильтрации по релевантности.
        """
        from weaviate.classes.query import MetadataQuery

        collection = self._client.collections.get(self._index_name)
        result = collection.query.near_text(
            query=query,
            limit=k,
            target_vector="main_vector",
            return_metadata=MetadataQuery(distance=True),
        )
        docs = []
        for obj in result.objects:
            text = obj.properties.get("text", "")
            metadata = {key: val for key, val in obj.properties.items() if key != "text"}
            metadata["distance"] = obj.metadata.distance
            docs.append(Document(page_content=text, metadata=metadata))
        return docs

    def hybrid_search(self, query: str, k: int = 15, alpha: float = 0.75, **kwargs: Any) -> list[Document]:
        """Гибридный поиск: BM25 (ключевые слова) + vector (семантика).

        alpha=0.0 — чистый BM25, alpha=1.0 — чистый vector, 0.75 — 75% семантика.
        Результаты уже отсортированы по комбинированному score.
        """
        from weaviate.classes.query import MetadataQuery, HybridFusion

        collection = self._client.collections.get(self._index_name)
        result = collection.query.hybrid(
            query=query,
            limit=k,
            alpha=alpha,
            target_vector="main_vector",
            fusion_type=HybridFusion.RELATIVE_SCORE,
            return_metadata=MetadataQuery(distance=True, score=True),
        )
        docs = []
        for obj in result.objects:
            text = obj.properties.get("text", "")
            metadata = {key: val for key, val in obj.properties.items() if key != "text"}
            metadata["distance"] = obj.metadata.distance
            metadata["score"] = obj.metadata.score
            docs.append(Document(page_content=text, metadata=metadata))
        return docs

    def delete_by_file_id(self, file_id: str) -> int:
        """Удаляет все чанки документа по file_id. Возвращает кол-во удалённых."""
        from weaviate.classes.query import Filter

        collection = self._client.collections.get(self._index_name)
        result = collection.query.fetch_objects(
            filters=Filter.by_property("file_id").equal(file_id),
            limit=10000,
        )
        count = 0
        for obj in result.objects:
            collection.data.delete_by_id(obj.uuid)
            count += 1
        return count

    def __del__(self):
        self._client.close()


class StorageManager:
    @staticmethod
    def get_vector_storage(storage_id: str) -> VectorStore:
        client = weaviate.connect_to_local(host="weaviate", port=8080, grpc_port=50051)

        if not client.collections.exists(f"VectorStorage_{storage_id}"):
            raise ValueError(
                f"storage with id {storage_id} is missing from the database")

        vector_storage = VectorStore(
            client=client,
            text_key="text",
            index_name=f"VectorStorage_{storage_id}",
            embedding=None  # векторизация на стороне Weaviate
        )

        return vector_storage

    
    @staticmethod
    @wvt_client
    def create_storage(client: WeaviateClient = None) -> str:
        storage_id = uuid4().hex
        storage_name = f"VectorStorage_{storage_id}"

        while client.collections.exists(storage_name):
            storage_id = uuid4().hex
            storage_name = f"VectorStorage_{storage_id}"

        client.collections.create(
            name=storage_name,
            properties=[
                Property(name="file_id", data_type=DataType.TEXT, index_searchable=True),
                Property(name="text", data_type=DataType.TEXT),
            ],
            vector_config=[
                Configure.Vectors.text2vec_transformers(
                    name="main_vector",
                    source_properties=["text"]
                )
            ]
        )
        return storage_id

    
    @staticmethod
    @wvt_client
    def delete_storage(storage_id: str, client: WeaviateClient = None) -> None:

        if not client.collections.exists(f"VectorStorage_{storage_id}"):
            raise ValueError(
                f"storage with id {storage_id} is missing from the database")

        client.collections.delete(f"VectorStorage_{storage_id}")
