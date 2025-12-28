import { useState, useEffect } from 'react';
import { Package, Filter, Download } from 'lucide-react';
import api from '../../services/api';

const RawMaterialStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    item_name: '',
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await api.getRawMaterialStock(filters);
      setStock(response.data || []);
    } catch (error) {
      console.error('Error fetching raw material stock:', error);
      
      // More detailed error message
      let errorMessage = 'Failed to load raw material stock';
      if (error.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (error.message) {
        errorMessage = `Failed to load raw material stock: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    fetchStock();
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      item_name: '',
    });
    setTimeout(() => fetchStock(), 0);
  };

  const handleExport = () => {
    // TODO: Implement export to Excel
    console.log('Export to Excel');
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '0.00';
    return parseFloat(num).toFixed(decimals);
  };

  const getTotalStock = () => {
    return stock.reduce((sum, item) => sum + parseFloat(item.current_stock || 0), 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raw Material Stock</h1>
          <p className="mt-1 text-sm text-gray-500">
            Current stock of raw materials received through GRN
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <Download className="h-5 w-5" />
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Minerals">Minerals</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              name="item_name"
              value={filters.item_name}
              onChange={handleFilterChange}
              placeholder="Search by item name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              onClick={handleFilter}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stock.length}</p>
            </div>
            <Package className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stock Weight</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(getTotalStock())} kg</p>
            </div>
            <Package className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stock.filter(item => parseFloat(item.current_stock || 0) < 100).length}
              </p>
            </div>
            <Package className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  UOM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Received
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Consumed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : stock.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No stock data found
                  </td>
                </tr>
              ) : (
                stock.map((item, index) => {
                  const currentStock = parseFloat(item.current_stock || 0);
                  const stockStatus = currentStock < 100 ? 'Low' : currentStock < 500 ? 'Medium' : 'Good';
                  const statusColor = currentStock < 100 ? 'bg-red-100 text-red-800' : 
                                    currentStock < 500 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-green-100 text-green-800';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.category_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.uom_name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatNumber(item.total_received)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatNumber(item.total_consumed)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatNumber(currentStock)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}>
                          {stockStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialStock;
