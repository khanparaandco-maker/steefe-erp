import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const CategoryMaster = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ category_name: '', alias: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_name.trim() || !formData.alias.trim()) {
      setErrors({ category_name: 'Both fields are required' });
      return;
    }

    try {
      if (editingId) {
        await apiService.updateCategory(editingId, formData);
        showToast('Category updated successfully', 'success');
      } else {
        await apiService.createCategory(formData);
        showToast('Category created successfully', 'success');
      }
      resetForm();
      fetchCategories();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiService.deleteCategory(id);
      showToast('Category deleted', 'success');
      fetchCategories();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ category_name: '', alias: '' });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Master</h1>
          <p className="mt-1 text-sm text-gray-600">Manage product categories</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label-text">Category Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">Alias <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            {errors.category_name && <p className="error-text">{errors.category_name}</p>}

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header">Category Name</th>
                  <th className="table-header">Alias</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{cat.category_name}</td>
                    <td className="table-cell">{cat.alias}</td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setFormData(cat); setEditingId(cat.id); setShowForm(true); }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMaster;
