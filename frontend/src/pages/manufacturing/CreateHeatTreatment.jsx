import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import api from '../../services/api';

const CreateHeatTreatment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [formData, setFormData] = useState({
    treatment_date: new Date().toISOString().split('T')[0],
    furnace_no: '1',
    size_item_id: '',
    time_in: '',
    time_out: '',
    temperature: '',
    bags_produced: '',
  });

  useEffect(() => {
    fetchFinishedGoods();
  }, []);

  const fetchFinishedGoods = async () => {
    try {
      const response = await api.getItems();
      // Filter only Finished Product category items
      const finished = response.data.filter(item => 
        item.category_name === 'Finished Product'
      );
      setFinishedGoods(finished);
    } catch (error) {
      console.error('Error fetching finished goods:', error);
      alert('Failed to load finished goods');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.treatment_date) {
      alert('Please select a date');
      return false;
    }
    if (!formData.furnace_no) {
      alert('Please select a furnace number');
      return false;
    }
    if (!formData.size_item_id) {
      alert('Please select a size (finished good item)');
      return false;
    }
    if (!formData.time_in) {
      alert('Please enter Time In');
      return false;
    }
    if (!formData.time_out) {
      alert('Please enter Time Out');
      return false;
    }
    if (formData.time_out <= formData.time_in) {
      alert('Time Out must be after Time In');
      return false;
    }
    if (!formData.temperature || formData.temperature <= 0) {
      alert('Please enter a valid temperature');
      return false;
    }
    if (!formData.bags_produced || formData.bags_produced <= 0) {
      alert('Please enter a valid number of bags produced');
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
      await api.createHeatTreatment(formData);
      alert('Heat treatment record created successfully');
      navigate('/manufacturing/heat-treatment');
    } catch (error) {
      console.error('Error creating heat treatment:', error);
      alert(error.response?.data?.message || 'Failed to create heat treatment record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Heat Treatment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a new heat treatment process for finished goods production
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Treatment Information */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Treatment Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="treatment_date"
                value={formData.treatment_date}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Furnace No */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Furnace No <span className="text-red-500">*</span>
              </label>
              <select
                name="furnace_no"
                value={formData.furnace_no}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Furnace</option>
                <option value="1">Furnace 1</option>
                <option value="2">Furnace 2</option>
                <option value="3">Furnace 3</option>
                <option value="4">Furnace 4</option>
                <option value="5">Furnace 5</option>
                <option value="6">Furnace 6</option>
              </select>
            </div>

            {/* Size (Finished Good) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Size (Finished Good) <span className="text-red-500">*</span>
              </label>
              <select
                name="size_item_id"
                value={formData.size_item_id}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Size</option>
                {finishedGoods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} {item.alias ? `(${item.alias})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Only Finished Product items are shown
              </p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Temperature <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                required
                min="1"
                placeholder="Enter temperature"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Time Details */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Time Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Time In */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time In <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time_in"
                value={formData.time_in}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Time Out */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time Out <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="time_out"
                value={formData.time_out}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Production Details */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Production Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Bags Produced */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                No of Bags Produced <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bags_produced"
                value={formData.bags_produced}
                onChange={handleChange}
                required
                min="1"
                placeholder="Enter number of bags"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Production of Finished Goods for the size item selected above
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/manufacturing/heat-treatment')}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Heat Treatment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHeatTreatment;
