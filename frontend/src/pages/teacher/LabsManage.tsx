import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labsApi, type Lab } from "@/api/labs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LabsManage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [number, setNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [task, setTask] = useState("");

  const { data: labs } = useQuery({
    queryKey: ["course-labs", courseId],
    queryFn: () => labsApi.getAll(courseId),
  });

  const createMutation = useMutation({
    mutationFn: () => labsApi.create(courseId, { number, title, task }),
    onSuccess: () => {
      toast.success("Лабораторная создана");
      queryClient.invalidateQueries({ queryKey: ["course-labs", courseId] });
      resetForm();
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const updateMutation = useMutation({
    mutationFn: () => labsApi.update(editingLab!.id, { number, title, task }),
    onSuccess: () => {
      toast.success("Лабораторная обновлена");
      queryClient.invalidateQueries({ queryKey: ["course-labs", courseId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (labId: number) => labsApi.delete(labId),
    onSuccess: () => {
      toast.success("Лабораторная удалена");
      queryClient.invalidateQueries({ queryKey: ["course-labs", courseId] });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingLab(null);
    setNumber((labs?.length ?? 0) + 1);
    setTitle("");
    setTask("");
  };

  const openEdit = (lab: Lab) => {
    setEditingLab(lab);
    setNumber(lab.number);
    setTitle(lab.title);
    setTask(lab.task);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingLab(null);
    setNumber((labs?.length ?? 0) + 1);
    setTitle("");
    setTask("");
    setDialogOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={`/teacher/courses/${courseId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к курсу
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading text-foreground">Лабораторные</h1>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading">{editingLab ? "Редактировать" : "Новая лабораторная"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Номер</Label>
                <Input type="number" value={number} onChange={(e) => setNumber(Number(e.target.value))} className="bg-background border-border w-24" />
              </div>
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название лабораторной" className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label>Задание</Label>
                <Textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Описание задания..." rows={4} className="bg-background border-border" />
              </div>
              <Button
                onClick={() => (editingLab ? updateMutation.mutate() : createMutation.mutate())}
                disabled={!title || createMutation.isPending || updateMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingLab ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {labs?.length === 0 && <p className="text-muted-foreground text-center py-12">Лабораторных пока нет</p>}
        {labs?.map((lab, i) => (
          <motion.div key={lab.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-heading text-lg shrink-0">{lab.number}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{lab.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">{lab.task}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(lab)} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => deleteMutation.mutate(lab.id)} className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
