import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const ItemMaster = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    item_name: '',
    alias: '',
    category_id: '',
    uom_id: '',
    gst_rate_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes, uomsRes, gstRatesRes] = await Promise.all([
        apiService.getItems(),
        apiService.getCategories(),
        apiService.getUOMs(),
        apiService.getGSTRates(),
      ]);
      setItems(itemsRes.data || []);
      setCategories(categoriesRes.data || []);
      setUoms(uomsRes.data || []);
      setGstRates(gstRatesRes.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
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

    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    if (!formData.uom_id) {
      newErrors.uom_id = 'UOM is required';
    }
    if (!formData.gst_rate_id) {
      newErrors.gst_rate_id = 'GST Rate is required';
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
      const dataToSubmit = {
        ...formData,
        category_id: parseInt(formData.category_id),
        uom_id: parseInt(formData.uom_id),
        gst_rate_id: parseInt(formData.gst_rate_id),
      };

      if (editingId) {
        await apiService.updateItem(editingId, dataToSubmit);
        showToast('Item updated successfully', 'success');
      } else {
        await apiService.createItem(dataToSubmit);
        showToast('Item created successfully', 'success');
      }
      resetForm();
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to save item', 'error');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      item_name: item.item_name || '',
      alias: item.alias || '',
      category_id: item.category_id?.toString() || '',
      uom_id: item.uom_id?.toString() || '',
      gst_rate_id: item.gst_rate_id?.toString() || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await apiService.deleteItem(id);
      showToast('Item deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message || 'Failed to delete item', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      alias: '',
      category_id: '',
      uom_id: '',
      gst_rate_id: '',
    });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.category_name || '-';
  };

  const getUOMName = (uomId) => {
    const uom = uoms.find((u) => u.id === uomId);
    return uom?.uom_short_name || '-';
  };

  const getGSTRate = (gstRateId) => {
    const gstRate = gstRates.find((g) => g.id === gstRateId);
    return gstRate ? `${gstRate.gst_rate}% (${gstRate.hsn_code})` : '-';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="mt-1 text-sm text-gray-600">Manage item/product information</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Item' : 'New Item'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label-text">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., TMT Bar 8mm"
                />
                {errors.item_name && (
                  <p className="error-text">{errors.item_name}</p>
                )}
              </div>

              <div>
                <label className="label-text">Alias</label>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., TMT8"
                />
              </div>

              <div>
                <label className="label-text">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="error-text">{errors.category_id}</p>
                )}
              </div>

              <div>
                <label className="label-text">
                  UOM <span className="text-red-500">*</span>
                </label>
                <select
                  name="uom_id"
                  value={formData.uom_id}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select UOM</option>
                  {uoms.map((uom) => (
                    <option key={uom.id} value={uom.id}>
                      {uom.uom_short_name} - {uom.uom_long_name}
                    </option>
                  ))}
                </select>
                {errors.uom_id && (
                  <p className="error-text">{errors.uom_id}</p>
                )}
              </div>

              <div>
                <label className="label-text">
                  GST Rate <span className="text-red-500">*</span>
                </label>
                <select
                  name="gst_rate_id"
                  value={formData.gst_rate_id}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select GST Rate</option>
                  {gstRates.map((gstRate) => (
                    <option key={gstRate.id} value={gstRate.id}>
                      {gstRate.gst_rate}% - {gstRate.hsn_code} ({gstRate.gst_details})
                    </option>
                  ))}
                </select>
                {errors.gst_rate_id && (
                  <p className="error-text">{errors.gst_rate_id}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Save'} Item
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
                  <th className="table-header">Item Name</th>
                  <th className="table-header">Alias</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">UOM</th>
                  <th className="table-header">GST Rate</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-cell text-center text-gray-500">
                      No items found. Click "Add Item" to create one.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{item.item_name}</td>
                      <td className="table-cell">{item.alias || '-'}</td>
                      <td className="table-cell">{getCategoryName(item.category_id)}</td>
                      <td className="table-cell">{getUOMName(item.uom_id)}</td>
                      <td className="table-cell">{getGSTRate(item.gst_rate_id)}</td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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

export default ItemMaster;
