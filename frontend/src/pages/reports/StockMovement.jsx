import { useState, useEffect } from 'react';
import { Activity, Filter, Download } from 'lucide-react';
import api from '../../services/api';

const StockMovement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
    item_name: '',
    movement_type: '',
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await api.getStockMovement(filters);
      setMovements(response.data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      alert('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilter = () => {
    fetchMovements();
  };

  const handleClearFilters = () => {
    setFilters({
      from_date: '',
      to_date: '',
      item_name: '',
      movement_type: '',
    });
    setTimeout(() => fetchMovements(), 0);
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

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'GRN': return 'bg-green-100 text-green-800';
      case 'Melting': return 'bg-blue-100 text-blue-800';
      case 'Heat Treatment': return 'bg-purple-100 text-purple-800';
      case 'Dispatch': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movement Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Complete tracking of stock movements across all processes
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
            <label className="block text-sm font-medium text-gray-700">Item Name</label>
            <input
              type="text"
              name="item_name"
              value={filters.item_name}
              onChange={handleFilterChange}
              placeholder="Search..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Movement Type</label>
            <select
              name="movement_type"
              value={filters.movement_type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="GRN">GRN (Receipt)</option>
              <option value="Melting">Melting (Issue)</option>
              <option value="Heat Treatment">Heat Treatment (Production)</option>
              <option value="Dispatch">Dispatch (Issue)</option>
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
                  Movement Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  In Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Out Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No stock movements found
                  </td>
                </tr>
              ) : (
                movements.map((movement, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(movement.movement_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {movement.item_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.category_name}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {movement.in_qty ? formatNumber(movement.in_qty) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-red-600">
                      {movement.out_qty ? formatNumber(movement.out_qty) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatNumber(movement.balance)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {movement.reference || '-'}
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

export default StockMovement;
