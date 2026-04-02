from langgraph.graph import StateGraph, START, END

from models.report import Report
from .normalizer import TextNormalizer
from .simhash import create_simhash_vector
from models.enums import VerificationStatus
from database.vector.repositories import ReportIndex
from settings import VerificationModuleSettings
from .nodes import (
    State,
    evaluate_work_1,
    evaluate_work_2,
    evaluate_work_3,
    aggregation, gen_agent_message,
)

settings = VerificationModuleSettings()


class VerificationAgent:
    __workflow = None

    def __init__(self):
        if not self.__workflow:
            self.__create_workflow()

    async def arun(self, lr_condition: str, report: Report):
        report_index = ReportIndex()
        normalizer = TextNormalizer(language="russian")
        norm_text = normalizer.normalize_text(report.text)

        vector = create_simhash_vector(norm_text)
        similarity_degree = report_index.compare_report(vector)

        if similarity_degree < settings.threshold_distance:
            return {
                "status": VerificationStatus.DISAPPROVE,
                "agent_message": "low degree of uniqueness of the text"
            }

        result = await self.__workflow.ainvoke(
            {
                "report": report,
                "lr_condition": lr_condition
            }
        )

        if result["status"] == VerificationStatus.APPROVE:
            return {"status": VerificationStatus.APPROVE, "vector":vector}

        return {
            "status": VerificationStatus.DISAPPROVE,
            "agent_message": result["agent_message"]
        }

    @classmethod
    def __create_workflow(cls):
        graph = StateGraph(State)
        graph.add_node("evaluate_work_1", evaluate_work_1)
        graph.add_node("evaluate_work_2", evaluate_work_2)
        graph.add_node("evaluate_work_3", evaluate_work_3)
        graph.add_node("aggregation", aggregation)
        graph.add_node("gen_agent_message", gen_agent_message)

        graph.add_edge(START, "evaluate_work_1")
        graph.add_edge(START, "evaluate_work_2")
        graph.add_edge(START, "evaluate_work_3")
        graph.add_edge("evaluate_work_1", "aggregation")
        graph.add_edge("evaluate_work_2", "aggregation")
        graph.add_edge("evaluate_work_3", "aggregation")
        graph.add_conditional_edges(
            "aggregation",
            lambda state: state["status"],
            {
                VerificationStatus.APPROVE: END,
                VerificationStatus.DISAPPROVE: "gen_agent_message"
            }
        )
        graph.add_edge("gen_agent_message", END)

        cls.__workflow = graph.compile()
