import weaviate
from weaviate import WeaviateClient
from weaviate.classes.config import Property, DataType, Configure

from .client import wvt_client


class VecDatabase:
    def init_db(self) -> None:
        self.__create_report_index()

    @wvt_client
    def __create_report_index(self, client: WeaviateClient) -> None:
        if client.collections.exists("ReportIndex"):
            return

        client.collections.create(
            name="ReportIndex",
            properties=[
                Property(
                    name="student_id",
                    data_type=DataType.TEXT,
                    index_searchable=True
                ),
            ],
            vector_config=[
                Configure.Vectors.self_provided(
                    name="simhash"
                )
            ]
        )