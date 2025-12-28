import { useState, useEffect } from 'react';
import { TrendingUp, Filter, Download } from 'lucide-react';
import api from '../../services/api';

const ProductionReport = () => {
  const [production, setProduction] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    furnace_no: '',
  });

  useEffect(() => {
    fetchProduction();
  }, []);

  const fetchProduction = async () => {
    try {
      setLoading(true);
      const response = await api.getProductionReport(filters);
      setProduction(response.data || []);
    } catch (error) {
      console.error('Error fetching production report:', error);
      alert('Failed to load production report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    fetchProduction();
  };

  const handleClearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
      furnace_no: '',
    });
    setTimeout(() => fetchProduction(), 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    return parseFloat(num).toFixed(decimals);
  };

  const getTotalBags = () => {
    return production.reduce((sum, item) => sum + parseInt(item.bags_produced || 0), 0);
  };

  const getTotalWeight = () => {
    return getTotalBags() * 25; // Each bag = 25 kg
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Finished goods produced through heat treatment process
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
            <label className="block text-sm font-medium text-gray-700">Furnace No.</label>
            <select
              name="furnace_no"
              value={filters.furnace_no}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Furnaces</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>Furnace {num}</option>
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

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bags Produced</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{getTotalBags()} bags</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Weight Produced</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{getTotalWeight()} kg</p>
              <p className="mt-1 text-xs text-gray-500">@ 25 kg per bag</p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-600" />
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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Furnace No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Size (Item)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Temperature (°C)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bags Produced
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Weight (kg)
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
              ) : production.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No production data found
                  </td>
                </tr>
              ) : (
                production.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(item.treatment_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        Furnace {item.furnace_no}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.size_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.temperature}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        {item.bags_produced} bags
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {parseInt(item.bags_produced) * 25} kg
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

export default ProductionReport;
