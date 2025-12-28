import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus, Trash2, Calculator } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const CreateMeltingProcess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    melting_date: new Date().toISOString().split('T')[0],
    heat_no: '',
    scrap_weight: '',
    time_in: '',
    time_out: '',
    carbon: '',
    manganese: '',
    silicon: '',
    aluminium: '',
    calcium: '',
    temperature: '',
  });

  const [scrapTotal, setScrapTotal] = useState(0);
  const [scrapError, setScrapError] = useState('');
  const [spectroReadings, setSpectroReadings] = useState([{
    id: Date.now(),
    carbon: '',
    silicon: '',
    manganese: '',
    phosphorus: '',
    sulphur: '',
    chrome: '',
  }]);

  const calculateScrapTotal = (expression) => {
    try {
      if (!expression || expression.trim() === '') {
        setScrapTotal(0);
        setScrapError('');
        return;
      }

      const cleaned = expression.replace(/\s/g, '');
      
      // Validate expression
      if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
        setScrapError('Only numbers and operators (+, -, *, /, ., ()) are allowed');
        setScrapTotal(0);
        return;
      }

      // Calculate
      const result = new Function('return ' + cleaned)();
      
      if (!isFinite(result) || isNaN(result)) {
        setScrapError('Invalid calculation');
        setScrapTotal(0);
        return;
      }

      setScrapTotal(parseFloat(result.toFixed(3)));
      setScrapError('');
    } catch (error) {
      setScrapError('Invalid expression');
      setScrapTotal(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'scrap_weight') {
      calculateScrapTotal(value);
    }
  };

  const handleScrapBlur = () => {
    if (formData.scrap_weight) {
      calculateScrapTotal(formData.scrap_weight);
    }
  };

  const handleSpectroChange = (id, field, value) => {
    setSpectroReadings(prev =>
      prev.map(reading =>
        reading.id === id ? { ...reading, [field]: value } : reading
      )
    );
  };

  const addSpectroReading = () => {
    setSpectroReadings(prev => [...prev, {
      id: Date.now(),
      carbon: '',
      silicon: '',
      manganese: '',
      phosphorus: '',
      sulphur: '',
      chrome: '',
    }]);
  };

  const removeSpectroReading = (id) => {
    if (spectroReadings.length === 1) {
      showToast('At least one spectro reading is required', 'error');
      return;
    }
    setSpectroReadings(prev => prev.filter(reading => reading.id !== id));
  };

  const validateForm = () => {
    if (!formData.melting_date) {
      showToast('Melting date is required', 'error');
      return false;
    }

    if (!formData.heat_no) {
      showToast('Heat number is required', 'error');
      return false;
    }

    if (!formData.scrap_weight) {
      showToast('Scrap weight is required', 'error');
      return false;
    }

    if (scrapError) {
      showToast('Please fix scrap weight calculation error', 'error');
      return false;
    }

    if (scrapTotal <= 0) {
      showToast('Scrap total must be greater than zero', 'error');
      return false;
    }

    if (!formData.time_in) {
      showToast('Time-in is required', 'error');
      return false;
    }

    if (!formData.time_out) {
      showToast('Time-out is required', 'error');
      return false;
    }

    if (formData.time_out <= formData.time_in) {
      showToast('Time-out must be after time-in', 'error');
      return false;
    }

    if (spectroReadings.length === 0) {
      showToast('At least one spectro reading is required', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        scrap_total: scrapTotal,
        carbon: formData.carbon ? parseFloat(formData.carbon) : null,
        manganese: formData.manganese ? parseFloat(formData.manganese) : null,
        silicon: formData.silicon ? parseFloat(formData.silicon) : null,
        aluminium: formData.aluminium ? parseFloat(formData.aluminium) : null,
        calcium: formData.calcium ? parseFloat(formData.calcium) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        spectro_readings: spectroReadings.map(reading => ({
          carbon: reading.carbon ? parseFloat(reading.carbon) : null,
          silicon: reading.silicon ? parseFloat(reading.silicon) : null,
          manganese: reading.manganese ? parseFloat(reading.manganese) : null,
          phosphorus: reading.phosphorus ? parseFloat(reading.phosphorus) : null,
          sulphur: reading.sulphur ? parseFloat(reading.sulphur) : null,
          chrome: reading.chrome ? parseFloat(reading.chrome) : null,
        })),
      };

      await apiService.createMeltingProcess(payload);
      showToast('Melting process created successfully', 'success');
      navigate('/manufacturing/melting');
    } catch (error) {
      showToast(error.message || 'Failed to create melting process', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Melting Process</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a new melting process with heat details and spectro readings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Section */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Melting Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="melting_date"
                value={formData.melting_date}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Heat No. <span className="text-red-500">*</span>
              </label>
              <select
                name="heat_no"
                value={formData.heat_no}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Heat Number</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>Heat {num}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrap Section */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Scrap Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Scrap Weight (Calculator) <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  name="scrap_weight"
                  value={formData.scrap_weight}
                  onChange={handleInputChange}
                  onBlur={handleScrapBlur}
                  placeholder="Example: 100+200+250"
                  className={`block w-full rounded-md border ${
                    scrapError ? 'border-red-500' : 'border-gray-300'
                  } px-3 py-2 pl-10 focus:border-blue-500 focus:outline-none`}
                  required
                />
                <Calculator className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {scrapError && (
                <p className="mt-1 text-sm text-red-600">{scrapError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter expression like: 100+200+250 or 500*2.5
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Scrap (Kgs)</label>
              <div className="mt-1 rounded-md bg-gray-100 px-4 py-2">
                <span className="text-lg font-bold text-gray-900">
                  {scrapTotal.toFixed(3)}
                </span>
                <span className="ml-2 text-sm text-gray-600">Kgs</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time-In <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time_in"
                value={formData.time_in}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time-Out <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time_out"
                value={formData.time_out}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Minerals Section */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Minerals Added (Kgs)</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">CARBON</label>
              <input
                type="number"
                name="carbon"
                value={formData.carbon}
                onChange={handleInputChange}
                step="0.001"
                placeholder="0.000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MANGANESE</label>
              <input
                type="number"
                name="manganese"
                value={formData.manganese}
                onChange={handleInputChange}
                step="0.001"
                placeholder="0.000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SILICON</label>
              <input
                type="number"
                name="silicon"
                value={formData.silicon}
                onChange={handleInputChange}
                step="0.001"
                placeholder="0.000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ALUMINIUM</label>
              <input
                type="number"
                name="aluminium"
                value={formData.aluminium}
                onChange={handleInputChange}
                step="0.001"
                placeholder="0.000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CALCIUM</label>
              <input
                type="number"
                name="calcium"
                value={formData.calcium}
                onChange={handleInputChange}
                step="0.001"
                placeholder="0.000"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">TEMPERATURE (°C)</label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                step="0.01"
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Spectro Readings Section */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Spectro Reading</h2>
              <p className="mt-1 text-sm text-gray-500">Add multiple test readings (4 decimal places)</p>
            </div>
            <button
              type="button"
              onClick={addSpectroReading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Reading
            </button>
          </div>

          <div className="space-y-4">
            {spectroReadings.map((reading, index) => (
              <div key={reading.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Reading {index + 1}</h3>
                  {spectroReadings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpectroReading(reading.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">CARBON*</label>
                    <input
                      type="number"
                      value={reading.carbon}
                      onChange={(e) => handleSpectroChange(reading.id, 'carbon', e.target.value)}
                      step="0.0001"
                      placeholder="0.0000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">SILICON*</label>
                    <input
                      type="number"
                      value={reading.silicon}
                      onChange={(e) => handleSpectroChange(reading.id, 'silicon', e.target.value)}
                      step="0.0001"
                      placeholder="0.0000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">MANGANESE*</label>
                    <input
                      type="number"
                      value={reading.manganese}
                      onChange={(e) => handleSpectroChange(reading.id, 'manganese', e.target.value)}
                      step="0.0001"
                      placeholder="0.0000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">PHOSPHORUS*</label>
                    <input
                      type="number"
                      value={reading.phosphorus}
                      onChange={(e) => handleSpectroChange(reading.id, 'phosphorus', e.target.value)}
                      step="0.0001"
                      placeholder="0.0000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">SULPHUR*</label>
                    <input
                      type="number"
                      value={reading.sulphur}
                      onChange={(e) => handleSpectroChange(reading.id, 'sulphur', e.target.value)}
                      step="0.0001"
                      placeholder="0.0000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">CHROME*</label>
                    <input
                      type="number"
                      value={reading.chrome}
                      onChange={(e) => handleSpectroChange(reading.id, 'chrome', e.target.value)}
                      step="0.0001"
                      placeholder="0.0000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/manufacturing/melting')}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300"
          >
            <X className="h-5 w-5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save Process'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeltingProcess;
