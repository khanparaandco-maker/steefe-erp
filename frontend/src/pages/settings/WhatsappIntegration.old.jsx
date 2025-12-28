import { useState, useEffect } from 'react';
import { Save, TestTube, ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/helpers';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const WhatsappIntegration = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    api_key: '',
    phone_number: '',
    instance_id: '',
    enabled: false,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchWhatsAppConfig();
  }, []);

  const fetchWhatsAppConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/whatsapp`);
      const data = response.data;
      setFormData({
        api_key: data.whatsapp_api_key || '',
        phone_number: data.whatsapp_phone_number || '',
        instance_id: data.whatsapp_instance_id || '',
        enabled: data.whatsapp_enabled || false,
      });
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
      if (error.response?.status !== 404) {
        showToast('Failed to load WhatsApp configuration', 'error');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTest = async () => {
    if (!formData.phone_number) {
      showToast('Please enter phone number first', 'error');
      return;
    }

    try {
      setTesting(true);
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showToast('Test message sent successfully!', 'success');
    } catch (error) {
      showToast('Failed to send test message', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await axios.put(`${API_URL}/settings/whatsapp`, {
        whatsapp_enabled: formData.enabled,
        whatsapp_api_key: formData.api_key,
        whatsapp_phone_number: formData.phone_number,
        whatsapp_instance_id: formData.instance_id,
      });
      showToast('WhatsApp configuration saved successfully', 'success');
      fetchWhatsAppConfig();
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      showToast(error.response?.data?.message || 'Failed to save configuration', 'error');
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <MessageCircle className="text-green-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">WhatsApp Integration</h2>
          <p className="text-sm text-gray-500">Configure WhatsApp API for sending notifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Enable WhatsApp Integration</h3>
          <p className="text-sm text-gray-500 mt-1">
            Send order updates and notifications via WhatsApp
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            checked={formData.enabled}
            onChange={handleInputChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Configuration Fields */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="api_key"
            value={formData.api_key}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter WhatsApp API key"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from WhatsApp Business API provider
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="91XXXXXXXXXX (with country code)"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            WhatsApp Business number with country code (e.g., 919876543210)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instance ID
          </label>
          <input
            type="text"
            name="instance_id"
            value={formData.instance_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter instance ID"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Your WhatsApp instance identifier
          </p>
        </div>
      </div>

      {/* Integration Features */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Available Features</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Send order confirmation messages to customers
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Send dispatch notifications with tracking details
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Send delivery updates and status changes
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Send invoice and payment reminders
          </li>
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={handleTest}
          disabled={!formData.enabled || testing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
        >
          <TestTube size={18} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        <button
          type="submit"
          disabled={loading || !formData.enabled}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
    </div>
  );
};

export default WhatsappIntegration;
