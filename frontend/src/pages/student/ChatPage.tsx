import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { chatApi, type ChatMessage } from "@/api/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Plus, Loader2, MessageCircle, Bot, User, Pencil, Check, X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const { id: studentId } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: chats } = useQuery({
    queryKey: ["student-chats", studentId],
    queryFn: () => chatApi.getStudentChats(studentId!),
    enabled: !!studentId,
  });

  const courseChats = chats?.filter((c) => c.course_id === courseId) ?? [];

  const createChatMutation = useMutation({
    mutationFn: () => chatApi.create({ student_id: studentId!, course_id: courseId }),
    onSuccess: (data) => {
      setActiveChatId(data.chat_id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["student-chats"] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ chatId, name }: { chatId: number; name: string }) =>
      chatApi.rename(chatId, name),
    onSuccess: () => {
      setEditingChatId(null);
      queryClient.invalidateQueries({ queryKey: ["student-chats"] });
    },
    onError: () => toast.error("Ошибка переименования"),
  });

  const deleteMutation = useMutation({
    mutationFn: (chatId: number) => chatApi.delete(chatId),
    onSuccess: (_, chatId) => {
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
      queryClient.invalidateQueries({ queryKey: ["student-chats"] });
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatApi.sendMessage(activeChatId!, msg),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChatId) {
      chatApi.getHistory(activeChatId).then(setMessages).catch(() => setMessages([]));
    }
  }, [activeChatId]);

  const handleSend = () => {
    if (!message.trim() || !activeChatId) return;
    const msg = message;
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    sendMutation.mutate(msg);
  };

  const startRename = (chatId: number, currentName: string) => {
    setEditingChatId(chatId);
    setEditName(currentName);
  };

  const confirmRename = () => {
    if (!editingChatId || !editName.trim()) return;
    renameMutation.mutate({ chatId: editingChatId, name: editName.trim() });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4">
      <div className="flex items-center gap-4">
        <Link to={`/student/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> К курсу
        </Link>
        <h1 className="text-2xl font-heading text-foreground">AI-ассистент</h1>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <Button onClick={() => createChatMutation.mutate()} disabled={createChatMutation.isPending} variant="outline" className="w-full justify-start gap-2">
            <Plus className="w-4 h-4" /> Новый чат
          </Button>
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {courseChats.map((chat) => (
                <div key={chat.chat_id} className="group relative">
                  {editingChatId === chat.chat_id ? (
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename();
                          if (e.key === "Escape") setEditingChatId(null);
                        }}
                        className="h-7 text-xs bg-background border-border"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={confirmRename} disabled={renameMutation.isPending}>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingChatId(null)}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveChatId(chat.chat_id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors",
                        activeChatId === chat.chat_id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">{chat.name}</span>
                        <div className={cn(
                          "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                          activeChatId === chat.chat_id ? "opacity-100" : ""
                        )}>
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); startRename(chat.chat_id, chat.name); }}
                            className="p-0.5 rounded hover:bg-white/10"
                          >
                            <Pencil className="w-3 h-3" />
                          </span>
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(chat.chat_id); }}
                            className="p-0.5 rounded hover:bg-white/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
          {!activeChatId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-heading text-foreground mb-2">Выберите или создайте чат</h3>
                <p className="text-sm text-muted-foreground">AI ответит на вопросы по материалам курса</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto chat-scroll p-4 min-h-0">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-surface border border-border text-foreground rounded-bl-md"
                      )}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 mt-1">
                          <User className="w-4 h-4 text-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {sendMutation.isPending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Задайте вопрос..."
                    className="bg-background border-border"
                    disabled={sendMutation.isPending}
                  />
                  <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending} className="bg-primary hover:bg-primary/90 shrink-0">
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
