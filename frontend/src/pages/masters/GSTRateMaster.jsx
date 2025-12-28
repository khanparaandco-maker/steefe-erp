import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const GSTRateMaster = () => {
  const [gstRates, setGstRates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    gst_details: '',
    hsn_code: '',
    effective_date: new Date().toISOString().split('T')[0],
    gst_rate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchGSTRates();
  }, []);

  const fetchGSTRates = async () => {
    try {
      const response = await apiService.getGSTRates();
      setGstRates(response.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch GST rates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.gst_details.trim()) {
      newErrors.gst_details = 'GST Details is required';
    }
    if (!formData.hsn_code.trim()) {
      newErrors.hsn_code = 'HSN Code is required';
    }
    if (!formData.gst_rate) {
      newErrors.gst_rate = 'GST Rate is required';
    } else {
      const rate = parseFloat(formData.gst_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.gst_rate = 'GST Rate must be between 0 and 100';
      }
    }
    if (!formData.effective_date) {
      newErrors.effective_date = 'Effective Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const dataToSubmit = {
        ...formData,
        gst_rate: parseFloat(formData.gst_rate),
        is_active: true,
      };

      if (editingId) {
        await apiService.updateGSTRate(editingId, dataToSubmit);
        showToast('GST Rate updated successfully', 'success');
      } else {
        await apiService.createGSTRate(dataToSubmit);
        showToast('GST Rate created successfully', 'success');
      }
      resetForm();
      fetchGSTRates();
    } catch (error) {
      showToast(error.message || 'Failed to save GST rate', 'error');
    }
  };

  const handleEdit = (gstRate) => {
    setFormData({
      gst_details: gstRate.gst_details || '',
      hsn_code: gstRate.hsn_code || '',
      effective_date: gstRate.effective_date || new Date().toISOString().split('T')[0],
      gst_rate: gstRate.gst_rate?.toString() || '',
    });
    setEditingId(gstRate.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this GST rate?')) return;

    try {
      await apiService.deleteGSTRate(id);
      showToast('GST Rate deleted successfully', 'success');
      fetchGSTRates();
    } catch (error) {
      showToast(error.message || 'Failed to delete GST rate', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      gst_details: '',
      hsn_code: '',
      effective_date: new Date().toISOString().split('T')[0],
      gst_rate: '',
    });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">GST Rate Master</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add GST Rate
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingId ? 'Edit GST Rate' : 'Add New GST Rate'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Details <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gst_details"
                  value={formData.gst_details}
                  onChange={handleInputChange}
                  placeholder="e.g., GST 18% on Iron & Steel"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gst_details ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.gst_details && (
                  <p className="text-red-500 text-sm mt-1">{errors.gst_details}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hsn_code"
                  value={formData.hsn_code}
                  onChange={handleInputChange}
                  placeholder="e.g., 7201"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.hsn_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hsn_code && (
                  <p className="text-red-500 text-sm mt-1">{errors.hsn_code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="effective_date"
                  value={formData.effective_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.effective_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.effective_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.effective_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleInputChange}
                  placeholder="e.g., 18.00"
                  step="0.01"
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.gst_rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.gst_rate && (
                  <p className="text-red-500 text-sm mt-1">{errors.gst_rate}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading GST rates...</p>
          </div>
        ) : gstRates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No GST rates found. Click "Add GST Rate" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HSN Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Rate (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gstRates.map((gstRate) => (
                  <tr key={gstRate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {gstRate.gst_details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {gstRate.hsn_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(gstRate.effective_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {gstRate.gst_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          gstRate.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {gstRate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(gstRate)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(gstRate.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GSTRateMaster;
