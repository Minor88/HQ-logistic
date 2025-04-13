import { useAuthContext } from '../contexts/AuthContext';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && <Navigation />}
      <main>{children}</main>
    </div>
  );
}; 