import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Bot,
  User,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  createChat,
  getStudentChats,
  getChatMessages,
  sendChatMessage,
  deleteChat,
  renameChat,
  type ChatInfo,
  type ChatMessageDTO,
} from "@/lib/api";

interface AIAssistantChatProps {
  courseId: number;
  studentId: number;
  courseTitle?: string;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistantChat({ courseId, studentId, courseTitle }: AIAssistantChatProps) {
  // Sidebar state
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  // Load chat list
  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const allChats = await getStudentChats(studentId);
      // Filter chats for this course only
      const courseChats = allChats.filter((c) => c.course_id === courseId);
      setChats(courseChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [studentId, courseId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const raw = await getChatMessages(activeChatId);
        setMessages(
          raw.map((m: ChatMessageDTO) => ({
            role: m.role === "human" ? "user" : "assistant",
            content: m.content,
          }))
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [activeChatId]);

  // Create new chat
  const handleCreateChat = async () => {
    setCreatingChat(true);
    try {
      const result = await createChat(studentId, courseId);
      await loadChats();
      setActiveChatId(result.chat_id);
    } catch (error: any) {
      console.error("Failed to create chat:", error);
    } finally {
      setCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      if (activeChatId === chatId) setActiveChatId(null);
      await loadChats();
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleRenameChat = async (chatId: number) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await renameChat(chatId, trimmed);
      setEditingChatId(null);
      await loadChats();
    } catch (error) {
      console.error("Failed to rename chat:", error);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !activeChatId) return;

    const userMsg: DisplayMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await sendChatMessage(activeChatId, trimmed);
      const aiMsg: DisplayMessage = { role: "assistant", content: res.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка при обработке запроса. Попробуйте ещё раз.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeChat = chats.find((c) => c.chat_id === activeChatId);

  return (
    <div className="flex h-[650px] rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 border-r border-border/50 bg-card/50 flex flex-col overflow-hidden shrink-0`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-border/50">
          <Button
            onClick={handleCreateChat}
            disabled={creatingChat}
            className="w-full gap-2"
            variant="outline"
            size="sm"
          >
            {creatingChat ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Новый чат
          </Button>
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingChats ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Нет чатов. Создайте первый!
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.chat_id}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                    activeChatId === chat.chat_id
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "hover:bg-muted/50 text-foreground/80 border border-transparent"
                  }`}
                >
                  {editingChatId === chat.chat_id ? (
                    <div className="flex items-center gap-1">
                      <input
                        className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm min-w-0"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameChat(chat.chat_id);
                          if (e.key === "Escape") setEditingChatId(null);
                        }}
                        autoFocus
                      />
                      <button onClick={() => handleRenameChat(chat.chat_id)} className="p-1 hover:text-green-500">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingChatId(null)} className="p-1 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="cursor-pointer" onClick={() => setActiveChatId(chat.chat_id)}>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                        <span className="truncate font-medium flex-1">{chat.name}</span>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.chat_id);
                              setEditingName(chat.name);
                            }}
                            className="p-1 rounded hover:bg-muted"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.chat_id);
                            }}
                            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 ml-6">
                        {new Date(chat.created_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {activeChat ? activeChat.name : "AI Ассистент"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {courseTitle || "Курс"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!activeChatId ? (
            // Empty state — no chat selected
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Ассистент курса</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Задавайте вопросы по материалам курса, лабораторным работам или
                экзаменационным вопросам. AI найдёт ответ в загруженных материалах.
              </p>
              <Button onClick={handleCreateChat} disabled={creatingChat} className="gap-2">
                {creatingChat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Начать новый чат
              </Button>
            </div>
          ) : loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Начните диалог — задайте вопрос по курсу
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md border border-border/50"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-sm prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-headings:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/70 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        AI думает...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {activeChatId && (
          <div className="border-t border-border/50 p-4 bg-card/30">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Задайте вопрос по материалам курса..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="bg-muted/30 border-border/50 focus-visible:ring-primary/30"
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={sending || !input.trim()}
                className="shrink-0 h-10 w-10"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI отвечает на основе загруженных материалов курса
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
