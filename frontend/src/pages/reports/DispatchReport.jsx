import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast, formatDate } from '../../utils/helpers';

const DispatchReport = () => {
  const navigate = useNavigate();
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    order_id: '',
    customer_id: '',
    from_date: '',
    to_date: '',
  });
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        apiService.getOrders(),
        apiService.getCustomers(),
      ]);
      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
      await fetchDispatches();
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispatches = async () => {
    try {
      const params = {};
      if (filters.order_id) params.order_id = filters.order_id;
      if (filters.from_date) params.from_date = filters.from_date;
      if (filters.to_date) params.to_date = filters.to_date;

      const response = await apiService.getDispatches(params);
      let dispatchList = response.data || [];

      // Filter by customer if selected
      if (filters.customer_id) {
        dispatchList = dispatchList.filter(d => d.customer_id?.toString() === filters.customer_id);
      }

      setDispatches(dispatchList);
    } catch (error) {
      showToast(error.message || 'Failed to fetch dispatches', 'error');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchDispatches();
  };

  const handleReset = () => {
    setFilters({
      order_id: '',
      customer_id: '',
      from_date: '',
      to_date: '',
    });
    setTimeout(() => {
      fetchDispatches();
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ['Dispatch ID', 'Order No', 'Customer', 'Dispatch Date', 'Transporter', 'LR No', 'Invoice No', 'Total Qty'];
    const rows = dispatches.map(dispatch => [
      dispatch.id,
      dispatch.order_no,
      dispatch.customer_name,
      formatDate(dispatch.dispatch_date),
      dispatch.transporter_name || '-',
      dispatch.lr_no || '-',
      dispatch.invoice_no,
      parseFloat(dispatch.total_quantity || 0).toFixed(3),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispatch-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalQuantity = dispatches.reduce((sum, dispatch) => sum + parseFloat(dispatch.total_quantity || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dispatch Report</h1>
          <p className="text-sm text-gray-500 mt-1">All dispatch records with details</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 print:hidden">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              name="order_id"
              value={filters.order_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Orders</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.order_no}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              name="customer_id"
              value={filters.customer_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Report Header for Print */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">SteelMelt ERP</h1>
        <h2 className="text-xl font-semibold text-center mb-4">Dispatch Report</h2>
        <p className="text-sm text-center text-gray-600">
          Generated on: {formatDate(new Date().toISOString())}
        </p>
        {(filters.from_date || filters.to_date) && (
          <p className="text-sm text-center text-gray-600">
            Period: {filters.from_date || 'All'} to {filters.to_date || 'All'}
          </p>
        )}
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : dispatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Dispatches Found</h3>
          <p className="text-gray-500">No dispatch records match the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto print:shadow-none">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispatch ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispatch Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LR No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Qty
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dispatches.map((dispatch) => (
                <tr key={dispatch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{dispatch.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {dispatch.order_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(dispatch.dispatch_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.transporter_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.lr_no || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.invoice_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                    {parseFloat(dispatch.total_quantity || 0).toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:hidden">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => navigate(`/orders/dispatch-details/view/${dispatch.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Dispatch"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="7" className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  Total Quantity:
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  {totalQuantity.toFixed(3)}
                </td>
                <td className="print:hidden"></td>
              </tr>
              <tr>
                <td colSpan="7" className="px-6 py-2 text-sm font-semibold text-gray-700 text-right">
                  Total Dispatches:
                </td>
                <td className="px-6 py-2 text-sm font-semibold text-gray-700 text-right">
                  {dispatches.length}
                </td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default DispatchReport;
