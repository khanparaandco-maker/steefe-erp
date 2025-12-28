import { useState, useEffect } from 'react';
import { axiosInstance as api } from '../../services/api';
import { Download, Printer, Filter } from 'lucide-react';

const StockStatement = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    categoryId: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Please select start and end dates');
      return;
    }

    if (new Date(filters.endDate) < new Date(filters.startDate)) {
      alert('End date must be after or equal to start date');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }

      const response = await api.get(`/stock-reports/stock-statement?${params.toString()}`);
      setReportData(response.data); // Extract the data property
    } catch (error) {
      console.error('Error fetching stock statement:', error);
      alert(error.message || 'Failed to fetch stock statement');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!reportData || !reportData.items || reportData.items.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = [
      'Item Name',
      'Category',
      'UOM',
      'Opening Qty',
      'Opening Rate',
      'Opening Amount',
      'Receipt Qty',
      'Receipt Rate',
      'Receipt Amount',
      'Issue Qty',
      'Issue Rate',
      'Issue Amount',
      'Closing Qty',
      'Closing Rate',
      'Closing Amount'
    ];

    const csvRows = [headers.join(',')];

    reportData.items.forEach(item => {
      const row = [
        item.item_name,
        item.category_name || '',
        item.uom_short_name || '',
        item.opening_qty || 0,
        item.opening_rate || 0,
        item.opening_amount || 0,
        item.receipt_qty || 0,
        item.receipt_rate || 0,
        item.receipt_amount || 0,
        item.issue_qty || 0,
        item.issue_rate || 0,
        item.issue_amount || 0,
        item.closing_qty || 0,
        item.closing_rate || 0,
        item.closing_amount || 0
      ];
      csvRows.push(row.join(','));
    });

    // Add totals row
    csvRows.push('');
    csvRows.push([
      'TOTAL',
      '',
      '',
      reportData.totals.opening_qty || 0,
      reportData.totals.opening_rate || 0,
      reportData.totals.opening_amount || 0,
      reportData.totals.receipt_qty || 0,
      reportData.totals.receipt_rate || 0,
      reportData.totals.receipt_amount || 0,
      reportData.totals.issue_qty || 0,
      reportData.totals.issue_rate || 0,
      reportData.totals.issue_amount || 0,
      reportData.totals.closing_qty || 0,
      reportData.totals.closing_rate || 0,
      reportData.totals.closing_amount || 0
    ].join(','));

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-statement-${filters.startDate}-to-${filters.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatNumber = (num) => {
    return parseFloat(num || 0).toFixed(2);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-gray-800 print:text-center">Stock Statement Report</h1>
        <p className="text-gray-600 print:text-center">FIFO-based Inventory Valuation</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Actions */}
      {reportData && (
        <div className="flex justify-between items-center mb-4 print:hidden">
          <div className="text-sm text-gray-600">
            Showing {reportData.items?.length || 0} items
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      )}

      {/* Report Header - Print Only */}
      {reportData && (
        <div className="hidden print:block mb-4 text-center border-b-2 border-gray-300 pb-4">
          <h2 className="text-xl font-bold">Stock Statement</h2>
          <p className="text-sm">
            Period: {new Date(filters.startDate).toLocaleDateString()} to {new Date(filters.endDate).toLocaleDateString()}
          </p>
          <p className="text-sm">
            Category: {filters.categoryId ? categories.find(c => c.id == filters.categoryId)?.category_name : 'All Categories'}
          </p>
        </div>
      )}

      {/* Report Table */}
      {reportData && reportData.items && reportData.items.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th rowSpan="2" className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                    Item Details
                  </th>
                  <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                    Opening Stock
                  </th>
                  <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                    Receipt
                  </th>
                  <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                    Issue
                  </th>
                  <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Closing Stock
                  </th>
                </tr>
                <tr>
                  {/* Opening */}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Rate</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">Amount</th>
                  {/* Receipt */}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Rate</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">Amount</th>
                  {/* Issue */}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Rate</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase border-r">Amount</th>
                  {/* Closing */}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Rate</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-r">
                      <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                      <div className="text-xs text-gray-500">
                        {item.category_name} | {item.uom_short_name}
                      </div>
                    </td>
                    {/* Opening */}
                    <td className="px-3 py-2 text-right text-sm text-gray-900">{formatNumber(item.opening_qty)}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-900">{formatNumber(item.opening_rate)}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 border-r">{formatNumber(item.opening_amount)}</td>
                    {/* Receipt */}
                    <td className="px-3 py-2 text-right text-sm text-green-600">{formatNumber(item.receipt_qty)}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-900">{formatNumber(item.receipt_rate)}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-green-600 border-r">{formatNumber(item.receipt_amount)}</td>
                    {/* Issue */}
                    <td className="px-3 py-2 text-right text-sm text-red-600">{formatNumber(item.issue_qty)}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-900">{formatNumber(item.issue_rate)}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-red-600 border-r">{formatNumber(item.issue_amount)}</td>
                    {/* Closing */}
                    <td className="px-3 py-2 text-right text-sm text-blue-600 font-medium">{formatNumber(item.closing_qty)}</td>
                    <td className="px-3 py-2 text-right text-sm text-gray-900">{formatNumber(item.closing_rate)}</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-blue-600">{formatNumber(item.closing_amount)}</td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-3 py-3 text-sm text-gray-900 border-r">TOTAL</td>
                  {/* Opening */}
                  <td className="px-3 py-3 text-right text-sm text-gray-900">{formatNumber(reportData.totals.opening_qty)}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-900">{reportData.totals.opening_rate}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-900 border-r">{formatNumber(reportData.totals.opening_amount)}</td>
                  {/* Receipt */}
                  <td className="px-3 py-3 text-right text-sm text-green-600">{formatNumber(reportData.totals.receipt_qty)}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-900">{reportData.totals.receipt_rate}</td>
                  <td className="px-3 py-3 text-right text-sm text-green-600 border-r">{formatNumber(reportData.totals.receipt_amount)}</td>
                  {/* Issue */}
                  <td className="px-3 py-3 text-right text-sm text-red-600">{formatNumber(reportData.totals.issue_qty)}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-900">{reportData.totals.issue_rate}</td>
                  <td className="px-3 py-3 text-right text-sm text-red-600 border-r">{formatNumber(reportData.totals.issue_amount)}</td>
                  {/* Closing */}
                  <td className="px-3 py-3 text-right text-sm text-blue-600">{formatNumber(reportData.totals.closing_qty)}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-900">{reportData.totals.closing_rate}</td>
                  <td className="px-3 py-3 text-right text-sm text-blue-600">{formatNumber(reportData.totals.closing_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : reportData && reportData.items && reportData.items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No stock transactions found for the selected date range and category.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or add stock transactions first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Select date range and click "Generate Report" to view stock statement.</p>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          table, table * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default StockStatement;
