import { useState, useRef, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import ReactMarkdown from "react-markdown"
import { MessageSquare, Plus, Send, Loader2, Trash2, PenLine, Bot, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/shared/EmptyState"
import { useAuth } from "@/features/auth/AuthContext"
import { createChat, getStudentChats, getChatMessages, sendChatMessage, deleteChat, renameChat } from "@/lib/api/chat"
import { cn } from "@/lib/utils"

export default function CourseChat() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [activeChatId, setActiveChatId] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [pendingAI, setPendingAI] = useState(false)
  const [localMessages, setLocalMessages] = useState<{ role: "human" | "ai"; content: string }[]>([])
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: chats = [] } = useQuery({
    queryKey: ["chats", user!.id, courseId],
    queryFn: () => getStudentChats(user!.id).then(all => all.filter(c => c.course_id === Number(courseId))),
  })

  const { data: serverMessages = [] } = useQuery({
    queryKey: ["chat-messages", activeChatId],
    queryFn: () => getChatMessages(activeChatId!),
    enabled: !!activeChatId,
  })

  useEffect(() => {
    setLocalMessages(serverMessages)
  }, [serverMessages, activeChatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages, pendingAI])

  const createMutation = useMutation({
    mutationFn: () => createChat(user!.id, Number(courseId)),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["chats", user!.id, courseId] })
      setActiveChatId(data.chat_id)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (chatId: number) => deleteChat(chatId),
    onSuccess: (_, chatId) => {
      qc.invalidateQueries({ queryKey: ["chats", user!.id, courseId] })
      if (activeChatId === chatId) { setActiveChatId(null); setLocalMessages([]) }
    },
  })

  const renameMutation = useMutation({
    mutationFn: ({ chatId, name }: { chatId: number; name: string }) => renameChat(chatId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chats", user!.id, courseId] })
      setRenamingId(null)
    },
  })

  const handleSend = async () => {
    if (!message.trim() || !activeChatId || pendingAI) return
    const msg = message.trim()
    setMessage("")
    setLocalMessages(prev => [...prev, { role: "human", content: msg }])
    setPendingAI(true)
    try {
      const res = await sendChatMessage(activeChatId, msg)
      setLocalMessages(prev => [...prev, { role: "ai", content: res.response }])
    } catch {
      toast.error("Ошибка при отправке сообщения")
    } finally {
      setPendingAI(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden">
      {/* Chat list */}
      <div className="w-64 border-r border-border/50 flex flex-col bg-background shrink-0">
        <div className="p-3 border-b border-border/50">
          <Button size="sm" className="w-full gap-1.5" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus className="w-3.5 h-3.5" /> Новый чат
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {chats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Чатов нет</p>
          ) : chats.map((chat) => (
            <div
              key={chat.chat_id}
              className={cn(
                "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors",
                activeChatId === chat.chat_id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => setActiveChatId(chat.chat_id)}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              {renamingId === chat.chat_id ? (
                <input
                  autoFocus
                  className="flex-1 min-w-0 text-xs bg-transparent border-b border-primary outline-none"
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={() => { if (renameVal.trim()) renameMutation.mutate({ chatId: chat.chat_id, name: renameVal }); else setRenamingId(null) }}
                  onKeyDown={e => { if (e.key === "Enter" && renameVal.trim()) renameMutation.mutate({ chatId: chat.chat_id, name: renameVal }) }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 min-w-0 text-xs truncate">{chat.name}</span>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button className="p-0.5 hover:text-foreground" onClick={e => { e.stopPropagation(); setRenamingId(chat.chat_id); setRenameVal(chat.name) }}>
                  <PenLine className="w-3 h-3" />
                </button>
                <button className="p-0.5 hover:text-destructive" onClick={e => { e.stopPropagation(); deleteMutation.mutate(chat.chat_id) }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Выберите чат"
              description="Или создайте новый для общения с AI-ассистентом"
              action={
                <Button size="sm" onClick={() => createMutation.mutate()}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Создать чат
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {localMessages.length === 0 && !pendingAI && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Задайте вопрос по материалам курса
                </div>
              )}
              {localMessages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "human" ? "justify-end" : "justify-start")}>
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "human"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                  )}>
                    {msg.role === "ai" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2 prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === "human" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {pendingAI && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-border/50 bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Спросите что-нибудь о материалах курса..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  disabled={pendingAI}
                />
                <Button size="icon" onClick={handleSend} disabled={!message.trim() || pendingAI}>
                  {pendingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-center">Enter для отправки</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
