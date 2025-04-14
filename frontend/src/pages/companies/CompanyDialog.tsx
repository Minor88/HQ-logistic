import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoaderIcon } from 'lucide-react';
import { Company, CreateCompanyData } from '@/types/company';

// Схема валидации
const companySchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  inn: z.string().optional(),
  email: z.string().email('Введите корректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

interface CompanyDialogProps {
  open: boolean;
  company?: Company;
  onClose: () => void;
  onSubmit: (data: CreateCompanyData) => void;
  isLoading?: boolean;
}

export function CompanyDialog({ 
  open, 
  company, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: CompanyDialogProps) {
  const isEditMode = !!company;
  
  // Инициализация формы
  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      inn: company?.inn || '',
      email: company?.email || '',
      phone: company?.phone || '',
      address: company?.address || '',
    },
  });
  
  const handleSubmit = (data: z.infer<typeof companySchema>) => {
    // Преобразуем пустые строки в null для опциональных полей
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key as keyof CreateCompanyData] = value === '' ? undefined : value;
      return acc;
    }, {} as CreateCompanyData);
    
    onSubmit(cleanedData);
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Редактирование компании' : 'Создание новой компании'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Измените информацию о компании и нажмите Сохранить' 
              : 'Заполните форму для создания новой компании'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название компании *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ИНН</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 