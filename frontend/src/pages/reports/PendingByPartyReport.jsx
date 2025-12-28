import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Printer, ChevronDown, ChevronRight } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast, formatDate } from '../../utils/helpers';

const PendingByPartyReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedParties, setExpandedParties] = useState(new Set());
  const [filters, setFilters] = useState({
    customer_id: '',
  });
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, ordersRes] = await Promise.all([
        apiService.getCustomers(),
        apiService.getOrders({ status: 'Pending' }),
      ]);
      
      setCustomers(customersRes.data || []);
      const pendingOrders = (ordersRes.data || []).filter(o => o.status === 'Pending');
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        pendingOrders.map(async (order) => {
          try {
            const orderDetailsRes = await apiService.getOrderById(order.id);
            return {
              ...order,
              items: orderDetailsRes.data.items || [],
            };
          } catch (error) {
            return { ...order, items: [] };
          }
        })
      );

      // Group by customer
      const grouped = ordersWithItems.reduce((acc, order) => {
        if (!filters.customer_id || order.customer_id.toString() === filters.customer_id) {
          if (!acc[order.customer_id]) {
            acc[order.customer_id] = {
              customer_id: order.customer_id,
              customer_name: order.customer_name,
              orders: [],
              total_pending_value: 0,
              total_orders: 0,
            };
          }
          
          // Calculate pending value (items with balance)
          const pendingItems = order.items.filter(item => parseFloat(item.balance_quantity || 0) > 0);
          const pendingValue = pendingItems.reduce((sum, item) => {
            const balanceQty = parseFloat(item.balance_quantity || 0);
            const rate = parseFloat(item.rate || 0);
            return sum + (balanceQty * rate);
          }, 0);

          acc[order.customer_id].orders.push({
            ...order,
            pending_items: pendingItems,
            pending_value: pendingValue,
          });
          acc[order.customer_id].total_pending_value += pendingValue;
          acc[order.customer_id].total_orders += 1;
        }
        return acc;
      }, {});

      const reportArray = Object.values(grouped).sort((a, b) => 
        b.total_pending_value - a.total_pending_value
      );

      setReportData(reportArray);
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleParty = (customerId) => {
    const newExpanded = new Set(expandedParties);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedParties(newExpanded);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleReset = () => {
    setFilters({ customer_id: '' });
    setTimeout(() => {
      fetchData();
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const rows = [];
    reportData.forEach(party => {
      rows.push([party.customer_name, party.total_orders, party.total_pending_value.toFixed(2)]);
      party.orders.forEach(order => {
        rows.push(['', order.order_no, formatDate(order.order_date), order.pending_value.toFixed(2)]);
        order.pending_items.forEach(item => {
          rows.push(['', '', item.item_name, item.balance_quantity, item.rate, (item.balance_quantity * item.rate).toFixed(2)]);
        });
      });
    });

    const csvContent = [
      ['Customer', 'Orders', 'Pending Value'].join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-by-party-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const grandTotal = reportData.reduce((sum, party) => sum + party.total_pending_value, 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending By Party Report</h1>
          <p className="text-sm text-gray-500 mt-1">Customer-wise pending orders and items</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <h1 className="text-2xl font-bold text-center mb-2">SSCPL</h1>
        <h2 className="text-xl font-semibold text-center mb-4">Pending By Party Report</h2>
        <p className="text-sm text-center text-gray-600">
          Generated on: {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Items Found</h3>
          <p className="text-gray-500">All orders have been completed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md print:shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Orders
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((party) => (
                  <>
                    <tr 
                      key={party.customer_id} 
                      className="hover:bg-gray-50 cursor-pointer print:cursor-default"
                      onClick={() => toggleParty(party.customer_id)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="print:hidden">
                            {expandedParties.has(party.customer_id) ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </span>
                          {party.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">
                        {party.total_orders}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        ₹{party.total_pending_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {expandedParties.has(party.customer_id) && party.orders.map((order) => (
                      <tr key={`order-${order.id}`} className="bg-blue-50">
                        <td className="px-12 py-3 text-sm text-gray-700" colSpan="3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">Order: {order.order_no}</span>
                              <span className="ml-4 text-gray-600">Date: {formatDate(order.order_date)}</span>
                              <span className="ml-4 text-gray-600">Items: {order.pending_items.length}</span>
                            </div>
                            <span className="font-semibold">
                              ₹{order.pending_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="mt-2">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left">Item</th>
                                  <th className="px-3 py-2 text-right">Balance Qty</th>
                                  <th className="px-3 py-2 text-right">Rate</th>
                                  <th className="px-3 py-2 text-right">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.pending_items.map((item, idx) => (
                                  <tr key={idx} className="border-t border-gray-200">
                                    <td className="px-3 py-2">{item.item_name}</td>
                                    <td className="px-3 py-2 text-right">{parseFloat(item.balance_quantity).toFixed(3)}</td>
                                    <td className="px-3 py-2 text-right">₹{parseFloat(item.rate).toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right font-medium">
                                      ₹{(parseFloat(item.balance_quantity) * parseFloat(item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    Grand Total:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingByPartyReport;
