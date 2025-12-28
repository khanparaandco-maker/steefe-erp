import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Filter, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    customer_id: '',
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders(filters);
      setOrders(response.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customer_id: '',
      from_date: '',
      to_date: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/view/${orderId}`);
  };

  const handleEditOrder = (orderId) => {
    navigate(`/orders/edit/${orderId}`);
  };

  const handleDeleteOrder = async (orderId, orderNo) => {
    console.log('Delete button clicked for order:', orderId, orderNo);
    
    const confirmed = window.confirm(`Are you sure you want to delete Order ${orderNo}?`);
    console.log('User confirmed:', confirmed);
    
    if (!confirmed) return;

    try {
      console.log('Calling API to delete order:', orderId);
      const response = await apiService.deleteOrder(orderId);
      console.log('Delete response:', response);
      showToast('Order deleted successfully', 'success');
      await fetchOrders();
    } catch (error) {
      console.error('Delete error:', error);
      showToast(error.message || 'Failed to delete order', 'error');
    }
  };

  const handlePrintProforma = (orderId) => {
    navigate(`/orders/proforma/${orderId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order List</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all customer orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.po_no || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.total_items || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.order_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Order Details"
                        >
                          <Eye size={16} />
                          <span className="text-xs">View</span>
                        </button>
                        <button
                          onClick={() => handleEditOrder(order.id)}
                          className="flex items-center gap-1 px-2 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit Order"
                        >
                          <Edit size={16} />
                          <span className="text-xs">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.order_no)}
                          className="flex items-center gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                          <span className="text-xs">Delete</span>
                        </button>
                        <button
                          onClick={() => handlePrintProforma(order.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Print Proforma Invoice"
                        >
                          <FileText size={16} />
                          <span className="text-xs">Proforma</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && orders.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.order_total || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
