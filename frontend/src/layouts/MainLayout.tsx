import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import {
  Building2,
  Package,
  FileText,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  User,
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Верхняя панель */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold">HQ-logistic</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6">
              {user?.user_group !== 'client' && (
                <>
                  <Link to="/companies" className="flex items-center space-x-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    <span>Компании</span>
                  </Link>
                  <Link to="/shipments" className="flex items-center space-x-2 text-sm font-medium">
                    <Package className="h-4 w-4" />
                    <span>Отправки</span>
                  </Link>
                  <Link to="/requests" className="flex items-center space-x-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    <span>Заявки</span>
                  </Link>
                  <Link to="/finance" className="flex items-center space-x-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    <span>Финансы</span>
                  </Link>
                  <Link to="/analytics" className="flex items-center space-x-2 text-sm font-medium">
                    <BarChart3 className="h-4 w-4" />
                    <span>Аналитика</span>
                  </Link>
                </>
              )}
              {user?.user_group === 'client' && (
                <>
                  <Link to="/my-requests" className="flex items-center space-x-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    <span>Мои заявки</span>
                  </Link>
                  <Link to="/my-shipments" className="flex items-center space-x-2 text-sm font-medium">
                    <Package className="h-4 w-4" />
                    <span>Мои отправки</span>
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm font-medium text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout; 