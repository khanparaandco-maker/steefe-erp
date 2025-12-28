import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Truck, FileText, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [orders, customers, items] = await Promise.all([
        apiService.getOrders(),
        apiService.getCustomers(),
        apiService.getItems(),
      ]);

      setStats({
        totalOrders: orders.data?.length || 0,
        pendingOrders: orders.data?.filter((o) => o.status === 'pending').length || 0,
        totalCustomers: customers.data?.length || 0,
        totalItems: items.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      link: '/orders/list',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: FileText,
      color: 'bg-yellow-500',
      link: '/reports/pending-orders',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Package,
      color: 'bg-green-500',
      link: '/masters/customers',
    },
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Truck,
      color: 'bg-purple-500',
      link: '/masters/items',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome to SteelMelt ERP System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/orders/create"
            className="card hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Create New Order</h3>
              <p className="text-sm text-gray-600">Add a new customer order</p>
            </div>
          </Link>
          <Link
            to="/orders/dispatch"
            className="card hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <Truck className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Dispatch Order</h3>
              <p className="text-sm text-gray-600">Create dispatch details</p>
            </div>
          </Link>
          <Link
            to="/reports/pending-orders"
            className="card hover:shadow-md transition-shadow flex items-center space-x-4"
          >
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Check pending orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
