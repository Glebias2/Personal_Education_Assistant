import { useRef } from "react"
import { FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface LabData {
  id: number
  number: number
  title: string
  task?: string
}

interface FileData {
  id: number
  filename: string
  file_id: string
  created_at: string
}

interface Props {
  course: any
  courseIdNum: number
  labs: LabData[]
  courseFiles: FileData[]
  uploadingFiles: boolean
  newLab: { number: number; title: string; task: string }
  editingLab: any | null
  onNewLabChange: (lab: { number: number; title: string; task: string }) => void
  onEditingLabChange: (lab: any | null) => void
  onCreateLab: () => void
  onUpdateLab: () => void
  onDeleteLab: (labId: number) => void
  onUploadFiles: (files: FileList | null) => void
  onDeleteFile: (fileId: number, filename: string) => void
}

export default function CourseOverviewPanel({
  course,
  courseIdNum,
  labs,
  courseFiles,
  uploadingFiles,
  newLab,
  editingLab,
  onNewLabChange,
  onEditingLabChange,
  onCreateLab,
  onUpdateLab,
  onDeleteLab,
  onUploadFiles,
  onDeleteFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Материалы курса */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Материалы курса</CardTitle>
          <CardDescription>Загрузите PDF, DOCX или TXT файлы — они будут проиндексированы для AI-ассистента</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30">
            <div>
              <div className="font-medium">Векторное хранилище</div>
              <div className="text-sm text-muted-foreground mt-1">
                {course.storage_id || course.vector_storage_id
                  ? `ID: ${course.storage_id || course.vector_storage_id}`
                  : "Не подключено"}
              </div>
            </div>
            <Badge variant={course.storage_id || course.vector_storage_id ? "default" : "secondary"}>
              {course.storage_id || course.vector_storage_id ? "Активно" : "Нет"}
            </Badge>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => onUploadFiles(e.target.files)}
          />
          <div
            onClick={() => !uploadingFiles && fileInputRef.current?.click()}
            className={`relative p-6 rounded-xl border-2 border-dashed transition-colors text-center cursor-pointer ${
              uploadingFiles
                ? "border-primary/30 bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            {uploadingFiles ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Загрузка и индексация файлов...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Нажмите для загрузки файлов</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, TXT</p>
              </div>
            )}
          </div>

          {courseFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Загруженные файлы ({courseFiles.length}):</div>
              {courseFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg bg-card/30 border border-border/50 group">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate">{f.filename}</span>
                  <Badge variant="secondary" className="ml-auto text-xs shrink-0">Проиндексирован</Badge>
                  <button
                    onClick={() => onDeleteFile(f.id, f.filename)}
                    className="p-1 rounded hover:bg-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Лабораторные */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Лабораторные</CardTitle>
            <CardDescription>Создание и управление лабами</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="gradient" className="shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Добавить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая лабораторная</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Номер</Label>
                  <Input
                    type="number"
                    value={newLab.number}
                    onChange={(e) => onNewLabChange({ ...newLab, number: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={newLab.title} onChange={(e) => onNewLabChange({ ...newLab, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Задание</Label>
                  <Textarea value={newLab.task} onChange={(e) => onNewLabChange({ ...newLab, task: e.target.value })} />
                </div>
                <Button onClick={onCreateLab} variant="gradient" className="w-full">Создать</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {labs.length === 0 ? (
            <div className="text-sm text-muted-foreground">Лабораторные пока не добавлены</div>
          ) : (
            labs.map((lab) => (
              <div key={lab.id} className="p-4 rounded-xl border border-border bg-card/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">Лаба {lab.number}: {lab.title}</div>
                    {lab.task && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{lab.task}</div>}
                  </div>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEditingLabChange({ ...lab })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Редактировать лабораторную</DialogTitle>
                        </DialogHeader>
                        {editingLab && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Номер</Label>
                              <Input
                                type="number"
                                value={editingLab.number}
                                onChange={(e) => onEditingLabChange({ ...editingLab, number: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Название</Label>
                              <Input
                                value={editingLab.title}
                                onChange={(e) => onEditingLabChange({ ...editingLab, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Задание</Label>
                              <Textarea
                                value={editingLab.task}
                                onChange={(e) => onEditingLabChange({ ...editingLab, task: e.target.value })}
                              />
                            </div>
                            <Button onClick={onUpdateLab} variant="gradient" className="w-full">Сохранить</Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteLab(lab.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
