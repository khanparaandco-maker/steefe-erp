import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { INDIAN_STATES } from '../../utils/constants';
import { validateGSTN, validateMobile, showToast } from '../../utils/helpers';

const CustomerMaster = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    gstn: '',
    contact_person1: '',
    mobile_no: '',
    contact_person2: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiService.getCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }
    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Address line 1 is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.gstn.trim()) {
      newErrors.gstn = 'GSTN is required';
    } else if (!validateGSTN(formData.gstn)) {
      newErrors.gstn = 'Invalid GSTN format';
    }
    if (!formData.contact_person1.trim()) {
      newErrors.contact_person1 = 'Contact person is required';
    }
    if (formData.mobile_no && !validateMobile(formData.mobile_no)) {
      newErrors.mobile_no = 'Invalid mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingId) {
        await apiService.updateCustomer(editingId, formData);
        showToast('Customer updated successfully', 'success');
      } else {
        await apiService.createCustomer(formData);
        showToast('Customer created successfully', 'success');
      }
      resetForm();
      fetchCustomers();
    } catch (error) {
      showToast(error.message || 'Failed to save customer', 'error');
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await apiService.deleteCustomer(id);
      showToast('Customer deleted successfully', 'success');
      fetchCustomers();
    } catch (error) {
      showToast(error.message || 'Failed to delete customer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      gstn: '',
      contact_person1: '',
      mobile_no: '',
      contact_person2: '',
    });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Master</h1>
          <p className="mt-1 text-sm text-gray-600">Manage customer information</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Customer' : 'New Customer'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label-text">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className="input-field"
                />
                {errors.customer_name && (
                  <p className="error-text">{errors.customer_name}</p>
                )}
              </div>

              <div>
                <label className="label-text">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  className="input-field"
                />
                {errors.address_line1 && (
                  <p className="error-text">{errors.address_line1}</p>
                )}
              </div>

              <div>
                <label className="label-text">Address Line 2</label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input-field"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div>
                <label className="label-text">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="error-text">{errors.state}</p>}
              </div>

              <div>
                <label className="label-text">
                  GSTN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gstn"
                  value={formData.gstn}
                  onChange={handleInputChange}
                  className="input-field"
                  maxLength="15"
                />
                {errors.gstn && <p className="error-text">{errors.gstn}</p>}
              </div>

              <div>
                <label className="label-text">
                  Contact Person 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact_person1"
                  value={formData.contact_person1}
                  onChange={handleInputChange}
                  className="input-field"
                />
                {errors.contact_person1 && (
                  <p className="error-text">{errors.contact_person1}</p>
                )}
              </div>

              <div>
                <label className="label-text">
                  Mobile No <span className="text-xs text-gray-500">(For WhatsApp notifications)</span>
                </label>
                <input
                  type="text"
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="919876543210 (with country code)"
                  maxLength="15"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code without + (e.g., 919876543210 for India)
                </p>
                {errors.mobile_no && <p className="error-text">{errors.mobile_no}</p>}
              </div>

              <div>
                <label className="label-text">Contact Person 2</label>
                <input
                  type="text"
                  name="contact_person2"
                  value={formData.contact_person2}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Save'} Customer
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header">Customer Name</th>
                  <th className="table-header">City</th>
                  <th className="table-header">State</th>
                  <th className="table-header">GSTN</th>
                  <th className="table-header">Contact Person</th>
                  <th className="table-header">Mobile</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-cell text-center text-gray-500">
                      No customers found. Click "Add Customer" to create one.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{customer.customer_name}</td>
                      <td className="table-cell">{customer.city}</td>
                      <td className="table-cell">{customer.state}</td>
                      <td className="table-cell">{customer.gstn}</td>
                      <td className="table-cell">{customer.contact_person1}</td>
                      <td className="table-cell">{customer.mobile_no || '-'}</td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
};

export default CustomerMaster;
