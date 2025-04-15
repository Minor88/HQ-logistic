import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Article {
  id: number;
  name: string;
  company: number;
  company_name?: string;
}

const articleSchema = z.object({
  name: z.string().min(3, { message: 'Название должно содержать минимум 3 символа' }),
});

type FormData = z.infer<typeof articleSchema>;

const ArticleManager: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      name: '',
    },
  });

  // Загрузка статей расходов/доходов
  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ results: Article[] }>('/articles/');
      // Обрабатываем пагинированные данные
      setArticles(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error('Не удалось загрузить статьи расходов/доходов');
      console.error('Ошибка при загрузке статей расходов/доходов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // Создание новой статьи
  const handleAddArticle = async (data: FormData) => {
    try {
      if (!user?.companyId) {
        toast.error('Не удалось определить компанию пользователя');
        return;
      }

      // Добавляем company_id из профиля текущего пользователя
      const payload = {
        ...data,
        company: parseInt(user.companyId)
      };

      await api.post('/articles/', payload);
      toast.success('Статья успешно создана');
      await loadArticles();
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Не удалось создать статью');
      console.error('Ошибка при создании статьи:', error);
    }
  };

  // Обновление статьи
  const handleUpdateArticle = async (data: FormData) => {
    if (!selectedArticle) return;

    try {
      // Сохраняем существующий company_id при обновлении
      const payload = {
        ...data,
        company: selectedArticle.company
      };

      await api.put(`/articles/${selectedArticle.id}/`, payload);
      toast.success('Статья успешно обновлена');
      await loadArticles();
      setIsEditDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Не удалось обновить статью');
      console.error('Ошибка при обновлении статьи:', error);
    }
  };

  // Удаление статьи
  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту статью расходов/доходов?')) return;

    try {
      await api.delete(`/articles/${id}/`);
      toast.success('Статья успешно удалена');
      await loadArticles();
    } catch (error) {
      toast.error('Не удалось удалить статью');
      console.error('Ошибка при удалении статьи:', error);
    }
  };

  // Открытие диалога редактирования
  const handleEditClick = (article: Article) => {
    setSelectedArticle(article);
    form.reset({
      name: article.name,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Статьи расходов и доходов</h2>
        <Button onClick={() => {
          form.reset();
          setIsAddDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить статью
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Загрузка...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-4">Статьи расходов и доходов не найдены</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead style={{ width: '120px' }}>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell>{article.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(article)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteArticle(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Диалог добавления статьи */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить статью расходов/доходов</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddArticle)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="например, Транспортные расходы" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования статьи */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать статью расходов/доходов</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateArticle)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="например, Транспортные расходы" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleManager; 