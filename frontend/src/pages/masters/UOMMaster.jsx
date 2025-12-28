import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const UOMMaster = () => {
  const [uoms, setUoms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ uom_short_name: '', uom_description: '' });

  useEffect(() => {
    fetchUOMs();
  }, []);

  const fetchUOMs = async () => {
    try {
      const response = await apiService.getUOMs();
      setUoms(response.data || []);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.uom_short_name.trim()) {
      showToast('UOM short name is required', 'error');
      return;
    }

    try {
      if (editingId) {
        await apiService.updateUOM(editingId, formData);
        showToast('UOM updated successfully', 'success');
      } else {
        await apiService.createUOM(formData);
        showToast('UOM created successfully', 'success');
      }
      resetForm();
      fetchUOMs();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await apiService.deleteUOM(id);
      showToast('UOM deleted', 'success');
      fetchUOMs();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ uom_short_name: '', uom_description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UOM Master</h1>
          <p className="mt-1 text-sm text-gray-600">Manage Units of Measurement</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add UOM
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit UOM' : 'New UOM'}</h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label-text">UOM Short Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.uom_short_name}
                  onChange={(e) => setFormData({ ...formData, uom_short_name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., KG, MT, PCS"
                />
              </div>
              <div>
                <label className="label-text">UOM Description</label>
                <input
                  type="text"
                  value={formData.uom_description}
                  onChange={(e) => setFormData({ ...formData, uom_description: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Kilogram, Metric Ton"
                />
              </div>
            </div>

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
                  <th className="table-header">Short Name</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {uoms.map((uom) => (
                  <tr key={uom.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{uom.uom_short_name}</td>
                    <td className="table-cell">{uom.uom_description || '-'}</td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setFormData(uom); setEditingId(uom.id); setShowForm(true); }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(uom.id)}
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

export default UOMMaster;
