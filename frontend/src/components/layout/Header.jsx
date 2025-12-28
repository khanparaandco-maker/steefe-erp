import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/login');
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserName = () => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-6">
      {/* Left section */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Steel Manufacturing ERP</h2>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User menu */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 rounded-lg border border-gray-200 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-medium text-gray-700">{getUserName()}</span>
              {user?.email && (
                <p className="text-xs text-gray-500">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
