from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.messages import trim_messages


class ChatMemory:
    """class for storing dialogue history"""

    def __init__(
        self,
        token_counter = len,
        max_tokens: int = 20,
        strategy: str = "last",
        start_on: str = "human",
        include_system: bool = True
    ) -> None:
        self.__token_counter = token_counter
        self.__max_tokens: int = max_tokens
        self.__strategy: str = strategy
        self.__start_on: str = start_on
        self.__include_system: bool = include_system
        self.__memory = []


    def add_context(self, human_message: str, ai_message: str) -> None:
        messages = [
            HumanMessage(content=human_message),
            AIMessage(content=ai_message)
        ]

        self.__memory.extend(messages)


    def get_messages(self) -> list:
        history = self.__memory
        if history is None:
            return []

        messages = trim_messages(
            history,
            token_counter=self.__token_counter,
            max_tokens=self.__max_tokens,
            strategy=self.__strategy,
            start_on=self.__start_on,
            include_system=self.__include_system,
        )

        return messages
