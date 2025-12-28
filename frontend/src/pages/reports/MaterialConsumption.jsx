import { useState, useEffect } from 'react';
import { TrendingDown, Filter, Download } from 'lucide-react';
import api from '../../services/api';

const MaterialConsumption = () => {
  const [consumption, setConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    heat_no: '',
  });

  useEffect(() => {
    fetchConsumption();
  }, []);

  const fetchConsumption = async () => {
    try {
      setLoading(true);
      const response = await api.getMaterialConsumption(filters);
      setConsumption(response.data || []);
    } catch (error) {
      console.error('Error fetching material consumption:', error);
      alert('Failed to load material consumption data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    fetchConsumption();
  };

  const handleClearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
      heat_no: '',
    });
    setTimeout(() => fetchConsumption(), 0);
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

  const getTotalConsumption = () => {
    return consumption.reduce((sum, item) => sum + parseFloat(item.total_weight || 0), 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Consumption Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Materials consumed in melting process (MS Scrap, Minerals)
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Heat No.</label>
            <select
              name="heat_no"
              value={filters.heat_no}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Heats</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>Heat {num}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
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
            <p className="text-sm font-medium text-gray-600">Total Material Consumed</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(getTotalConsumption())} kg</p>
          </div>
          <TrendingDown className="h-12 w-12 text-red-600" />
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Weight (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Process Type
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
              ) : consumption.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No consumption data found
                  </td>
                </tr>
              ) : (
                consumption.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(item.melting_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        Heat {item.heat_no}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.item_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.category_name}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatNumber(item.total_weight)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
                        {item.process_type || 'Melting'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaterialConsumption;
