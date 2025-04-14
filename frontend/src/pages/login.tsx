import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Схема валидации для формы входа
const loginSchema = z.object({
  username: z.string().min(1, "Обязательное поле"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Настройка формы с валидацией через zod
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Используем поле username для передачи email или имени пользователя
      await login(data.username, data.password);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      // Обработка ошибок происходит в контексте аутентификации
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-sm border">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Package className="h-10 w-10 text-apple-purple" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">LogiFlow</h2>
          <p className="mt-2 text-gray-600">Войдите в свой аккаунт</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя пользователя или Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="username или email@example.com" 
                      {...field} 
                      autoComplete="username"
                      type="text"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="******" 
                      {...field} 
                      type="password"
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-apple-purple hover:bg-apple-purple/90"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
            
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>
                Для тестирования используйте учетные записи:<br/>
                super@example.com, admin@example.com, boss@example.com<br/>
                или имена пользователей: superuser, admin, boss<br/>
                Пароль: password
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Login; 