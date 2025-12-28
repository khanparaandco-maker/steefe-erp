import { useState, useEffect } from 'react';
import { Package, Filter, Download } from 'lucide-react';
import api from '../../services/api';

const WIPStock = () => {
  const [wipStock, setWipStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
  });

  useEffect(() => {
    fetchWIPStock();
  }, []);

  const fetchWIPStock = async () => {
    try {
      setLoading(true);
      const response = await api.getWIPStock(filters);
      setWipStock(response.data || []);
    } catch (error) {
      console.error('Error fetching WIP stock:', error);
      alert('Failed to load WIP stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    fetchWIPStock();
  };

  const handleClearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
    });
    setTimeout(() => fetchWIPStock(), 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '0.00';
    return parseFloat(num).toFixed(decimals);
  };

  const getTotalWIP = () => {
    return wipStock.reduce((sum, item) => sum + parseFloat(item.wip_stock || 0), 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WIP Stock Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Work In Progress - Material after melting process awaiting heat treatment
          </p>
        </div>
        <button
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
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
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

      {/* Summary Card */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total WIP Stock</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(getTotalWIP())} kg</p>
          </div>
          <Package className="h-12 w-12 text-orange-600" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Heat No.
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Scrap Total (kg)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Used in Heat Treatment (kg)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  WIP Stock (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : wipStock.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No WIP stock data found
                  </td>
                </tr>
              ) : (
                wipStock.map((item, index) => {
                  const stock = parseFloat(item.wip_stock || 0);
                  const statusColor = stock === 0 ? 'bg-gray-100 text-gray-800' : 
                                    stock < 100 ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-green-100 text-green-800';
                  const status = stock === 0 ? 'Completed' : 'In Progress';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDate(item.melting_date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                          Heat {item.heat_no}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatNumber(item.scrap_total)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatNumber(item.used_in_heat_treatment)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatNumber(stock)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}>
                          {status}
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

export default WIPStock;
