import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShipmentStatusManager from '@/components/settings/ShipmentStatusManager';
import RequestStatusManager from '@/components/settings/RequestStatusManager';
import ArticleManager from '@/components/settings/ArticleManager';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shipment-statuses');

  // Проверяем, имеет ли пользователь доступ к настройкам (только superuser и company_admin)
  if (!user || (user.role !== 'superuser' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Настройки компании</h1>
          <p className="text-muted-foreground">
            Управление статусами отправок, заявок и статьями расходов и доходов
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>
              Настройте параметры для вашей компании
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="shipment-statuses"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="shipment-statuses">Статусы отправок</TabsTrigger>
                <TabsTrigger value="request-statuses">Статусы заявок</TabsTrigger>
                <TabsTrigger value="articles">Статьи расходов/доходов</TabsTrigger>
              </TabsList>
              <TabsContent value="shipment-statuses" className="py-4">
                <ShipmentStatusManager />
              </TabsContent>
              <TabsContent value="request-statuses" className="py-4">
                <RequestStatusManager />
              </TabsContent>
              <TabsContent value="articles" className="py-4">
                <ArticleManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage; 