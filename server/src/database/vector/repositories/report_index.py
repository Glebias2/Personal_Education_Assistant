import weaviate
from weaviate import WeaviateClient
from weaviate.classes.query import MetadataQuery

from database.vector.client import wvt_client


class ReportIndex:
    @wvt_client
    def compare_report(self, vector: list, client: WeaviateClient = None) -> float | None:
        collection = client.collections.get("ReportIndex")

        result = collection.query.near_vector(
            near_vector=vector,
            limit=1,
            target_vector="simhash",
            return_metadata=MetadataQuery(distance=True)
        )

        for obj in result.objects:
            return obj.metadata.distance
        else:
            return 2

    @wvt_client
    def add_report(self, vector: list, student_id: int, client: WeaviateClient = None):
        collection = client.collections.get("ReportIndex")

        collection.data.insert(
            properties={"student_id": student_id},
            vector={"simhash": vector}
        )
