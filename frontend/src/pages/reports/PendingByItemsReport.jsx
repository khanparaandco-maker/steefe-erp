import { useState, useEffect } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const PendingByItemsReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    item_id: '',
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, ordersRes] = await Promise.all([
        apiService.getItems(),
        apiService.getOrders({ status: 'Pending' }),
      ]);
      
      setItems(itemsRes.data || []);
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

      // Group by item
      const itemsMap = {};
      ordersWithItems.forEach(order => {
        order.items.forEach(item => {
          const balanceQty = parseFloat(item.balance_quantity || 0);
          if (balanceQty > 0) {
            if (!filters.item_id || item.item_id.toString() === filters.item_id) {
              if (!itemsMap[item.item_id]) {
                itemsMap[item.item_id] = {
                  item_id: item.item_id,
                  item_name: item.item_name,
                  uom: item.uom,
                  total_pending_qty: 0,
                  total_pending_value: 0,
                  orders: [],
                };
              }
              
              const itemValue = balanceQty * parseFloat(item.rate || 0);
              itemsMap[item.item_id].total_pending_qty += balanceQty;
              itemsMap[item.item_id].total_pending_value += itemValue;
              itemsMap[item.item_id].orders.push({
                order_no: order.order_no,
                customer_name: order.customer_name,
                balance_qty: balanceQty,
                rate: parseFloat(item.rate || 0),
                value: itemValue,
              });
            }
          }
        });
      });

      const reportArray = Object.values(itemsMap).sort((a, b) => 
        b.total_pending_qty - a.total_pending_qty
      );

      setReportData(reportArray);
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleReset = () => {
    setFilters({ item_id: '' });
    setTimeout(() => {
      fetchData();
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const rows = [];
    reportData.forEach(item => {
      rows.push([item.item_name, item.total_pending_qty.toFixed(3), item.uom, item.total_pending_value.toFixed(2)]);
      item.orders.forEach(order => {
        rows.push(['', order.order_no, order.customer_name, order.balance_qty.toFixed(3), order.rate.toFixed(2), order.value.toFixed(2)]);
      });
    });

    const csvContent = [
      ['Item', 'Pending Qty', 'UOM', 'Pending Value'].join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-by-items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalQty = reportData.reduce((sum, item) => sum + item.total_pending_qty, 0);
  const totalValue = reportData.reduce((sum, item) => sum + item.total_pending_value, 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending By Items Report</h1>
          <p className="text-sm text-gray-500 mt-1">Item-wise pending quantities across all orders</p>
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
              Item
            </label>
            <select
              name="item_id"
              value={filters.item_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.item_name}
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
        <h1 className="text-2xl font-bold text-center mb-2">SteelMelt ERP</h1>
        <h2 className="text-xl font-semibold text-center mb-4">Pending By Items Report</h2>
        <p className="text-sm text-center text-gray-600">
          Generated on: {new Date().toLocaleDateString()}
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
          <p className="text-gray-500">All items have been dispatched.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto print:shadow-none">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sr No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item, index) => (
                <>
                  <tr key={item.item_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      {item.total_pending_qty.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.uom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                      ₹{item.total_pending_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr key={`details-${item.item_id}`} className="bg-blue-50">
                    <td colSpan="5" className="px-12 py-3">
                      <div className="text-sm">
                        <div className="font-medium mb-2">Order Details:</div>
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Order No</th>
                              <th className="px-3 py-2 text-left">Customer</th>
                              <th className="px-3 py-2 text-right">Balance Qty</th>
                              <th className="px-3 py-2 text-right">Rate</th>
                              <th className="px-3 py-2 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.orders.map((order, idx) => (
                              <tr key={idx} className="border-t border-gray-200">
                                <td className="px-3 py-2">{order.order_no}</td>
                                <td className="px-3 py-2">{order.customer_name}</td>
                                <td className="px-3 py-2 text-right">{order.balance_qty.toFixed(3)}</td>
                                <td className="px-3 py-2 text-right">₹{order.rate.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-medium">
                                  ₹{order.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="4" className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  Grand Total:
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                  ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingByItemsReport;
