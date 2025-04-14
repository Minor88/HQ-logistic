import { useEffect } from 'react';
import { z } from 'zod';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useCompanyDetails, useCreateCompany, useUpdateCompany } from '../../hooks/useCompanies';
import { CompanyRequest } from '../../types/company';

// Валидационная схема
const companySchema = z.object({
  name: z.string().min(2, 'Название компании должно содержать не менее 2 символов'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Некорректный email').optional().nullable(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number | null;
}

export function CompanyDialog({ open, onOpenChange, companyId }: CompanyDialogProps) {
  const isEditMode = !!companyId;
  
  // Запрос данных компании для режима редактирования
  const { data: company, isLoading: isLoadingCompany } = useCompanyDetails(companyId || 0);
  
  // Мутации для создания/обновления компании
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany(companyId || 0);

  // Настройка формы с валидацией
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useHookForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  // Заполняем форму данными компании при редактировании
  useEffect(() => {
    if (isEditMode && company) {
      reset({
        name: company.name,
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
      });
    } else if (!isEditMode) {
      reset({
        name: '',
        address: '',
        phone: '',
        email: '',
      });
    }
  }, [isEditMode, company, reset]);

  // Обработчик отправки формы
  const onSubmit = async (data: CompanyFormData) => {
    try {
      // Преобразуем пустые строки в null
      const cleanData: CompanyRequest = {
        name: data.name,
        address: data.address === '' ? null : data.address,
        phone: data.phone === '' ? null : data.phone,
        email: data.email === '' ? null : data.email,
      };

      if (isEditMode && companyId) {
        await updateCompany.mutateAsync(cleanData);
        // Уведомление об успешном обновлении
        console.log('Компания успешно обновлена');
      } else {
        await createCompany.mutateAsync(cleanData);
        // Уведомление об успешном создании
        console.log('Компания успешно создана');
      }
      
      onOpenChange(false);
    } catch (error) {
      // Уведомление об ошибке
      console.error('Ошибка при сохранении компании:', error);
    }
  };

  // Определение состояния загрузки
  const isLoading = createCompany.isPending || updateCompany.isPending || isLoadingCompany;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Редактирование компании' : 'Создание компании'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Отредактируйте информацию о компании" 
              : "Заполните данные для создания новой компании"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Название компании*
            </label>
            <Input
              id="name"
              placeholder="Введите название компании"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium">
              Адрес
            </label>
            <Input
              id="address"
              placeholder="Введите адрес компании"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium">
              Телефон
            </label>
            <Input
              id="phone"
              placeholder="Введите телефон компании"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Введите email компании"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isEditMode ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 