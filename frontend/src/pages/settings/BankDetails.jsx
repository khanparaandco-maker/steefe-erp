import { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, ArrowLeft, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/helpers';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const ACCOUNT_TYPES = ['Savings', 'Current', 'Cash Credit', 'Overdraft'];

const BankDetails = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    branch_name: '',
    account_type: 'Current',
    upi_id: '',
    swift_code: '',
    micr_code: '',
    is_primary: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/banks`);
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      showToast('Failed to load bank accounts', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bank_name) newErrors.bank_name = 'Bank name is required';
    if (!formData.account_holder_name) newErrors.account_holder_name = 'Account holder name is required';
    if (!formData.account_number) newErrors.account_number = 'Account number is required';
    if (!formData.ifsc_code) {
      newErrors.ifsc_code = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code)) {
      newErrors.ifsc_code = 'Invalid IFSC format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (editingBank) {
        await axios.put(`${API_URL}/settings/banks/${editingBank.id}`, formData);
        showToast('Bank account updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/settings/banks`, formData);
        showToast('Bank account added successfully', 'success');
      }
      
      fetchBanks();
      resetForm();
    } catch (error) {
      console.error('Error saving bank:', error);
      showToast(error.response?.data?.message || 'Failed to save bank account', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      bank_name: bank.bank_name,
      account_holder_name: bank.account_holder_name,
      account_number: bank.account_number,
      ifsc_code: bank.ifsc_code,
      branch_name: bank.branch_name || '',
      account_type: bank.account_type || 'Current',
      upi_id: bank.upi_id || '',
      swift_code: bank.swift_code || '',
      micr_code: bank.micr_code || '',
      is_primary: bank.is_primary || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    try {
      await axios.delete(`${API_URL}/settings/banks/${id}`);
      showToast('Bank account deleted successfully', 'success');
      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
      showToast('Failed to delete bank account', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_holder_name: '',
      account_number: '',
      ifsc_code: '',
      branch_name: '',
      account_type: 'Current',
      upi_id: '',
      swift_code: '',
      micr_code: '',
      is_primary: false,
    });
    setEditingBank(null);
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Building className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bank Details</h2>
            <p className="text-sm text-gray-500">Manage company bank accounts</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Bank Account
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bank_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="State Bank of India"
                />
                {errors.bank_name && <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>}
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.account_holder_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Company Name"
                />
                {errors.account_holder_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.account_holder_name}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.account_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234567890"
                />
                {errors.account_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>
                )}
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.ifsc_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="SBIN0001234"
                  maxLength={11}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.ifsc_code && <p className="text-red-500 text-sm mt-1">{errors.ifsc_code}</p>}
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ahmedabad Main Branch"
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  name="upi_id"
                  value={formData.upi_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="company@sbi"
                />
              </div>

              {/* MICR Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MICR Code</label>
                <input
                  type="text"
                  name="micr_code"
                  value={formData.micr_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="380002001"
                  maxLength={9}
                />
              </div>

              {/* SWIFT Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT Code (for international transfers)
                </label>
                <input
                  type="text"
                  name="swift_code"
                  value={formData.swift_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SBININBB123"
                />
              </div>

              {/* Primary Bank */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_primary"
                    checked={formData.is_primary}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Set as Primary Bank Account
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Primary bank will be selected by default in transactions
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save size={18} />
                {loading ? 'Saving...' : editingBank ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bank Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Holder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IFSC Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Primary
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No bank accounts added yet. Click "Add Bank Account" to get started.
                  </td>
                </tr>
              ) : (
                banks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{bank.bank_name}</div>
                      {bank.branch_name && (
                        <div className="text-xs text-gray-500">{bank.branch_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{bank.account_holder_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">{bank.account_number}</div>
                      {bank.upi_id && (
                        <div className="text-xs text-gray-500 mt-1">UPI: {bank.upi_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">{bank.ifsc_code}</div>
                      {bank.micr_code && (
                        <div className="text-xs text-gray-500 mt-1">MICR: {bank.micr_code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{bank.account_type}</td>
                    <td className="px-6 py-4 text-center">
                      {bank.is_primary && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(bank)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bank.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

export default BankDetails;
