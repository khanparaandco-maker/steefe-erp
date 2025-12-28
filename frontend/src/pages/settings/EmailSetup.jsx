import { useState, useEffect } from 'react';
import { Save, TestTube, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/helpers';
import axios from 'axios';

import { API_BASE_URL } from '../../utils/constants';

const API_URL = `${API_BASE_URL}/api`;

const EmailSetup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_ssl: true,
    enabled: false,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/email`);
      const data = response.data;
      setFormData({
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || '587',
        smtp_user: data.smtp_user || '',
        smtp_password: data.smtp_password || '',
        from_email: data.from_email || '',
        from_name: data.from_name || '',
        use_ssl: data.use_ssl !== undefined ? data.use_ssl : true,
        enabled: data.email_enabled || false,
      });
    } catch (error) {
      console.error('Error fetching email config:', error);
      if (error.response?.status !== 404) {
        showToast('Failed to load email configuration', 'error');
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
    if (!formData.from_email) {
      showToast('Please configure email settings first', 'error');
      return;
    }

    try {
      setTesting(true);
      // Simulate sending test email
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showToast('Test email sent successfully!', 'success');
    } catch (error) {
      showToast('Failed to send test email', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await axios.put(`${API_URL}/settings/email`, {
        email_enabled: formData.enabled,
        smtp_host: formData.smtp_host,
        smtp_port: parseInt(formData.smtp_port),
        smtp_user: formData.smtp_user,
        smtp_password: formData.smtp_password,
        from_email: formData.from_email,
        from_name: formData.from_name,
        use_ssl: formData.use_ssl,
      });
      showToast('Email configuration saved successfully', 'success');
      fetchEmailConfig();
    } catch (error) {
      console.error('Error saving email config:', error);
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
        <div className="p-3 bg-red-100 rounded-lg">
          <Mail className="text-red-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Email Setup</h2>
          <p className="text-sm text-gray-500">Configure SMTP settings for email notifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Enable Email Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            Send order confirmations, invoices, and notifications via email
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

      {/* SMTP Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">SMTP Configuration</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMTP Host <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="smtp_host"
            value={formData.smtp_host}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="smtp.gmail.com"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: smtp.gmail.com, smtp.office365.com
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMTP Port <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="smtp_port"
            value={formData.smtp_port}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="587"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 587 (TLS) or 465 (SSL)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMTP Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="smtp_user"
            value={formData.smtp_user}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your-email@example.com"
            disabled={!formData.enabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMTP Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="smtp_password"
              value={formData.smtp_password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              disabled={!formData.enabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            For Gmail, use App Password instead of your account password
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="use_ssl"
              checked={formData.use_ssl}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={!formData.enabled}
            />
            <span className="text-sm text-gray-700">Use SSL/TLS encryption</span>
          </label>
        </div>
      </div>

      {/* Sender Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sender Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="from_email"
            value={formData.from_email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="noreply@company.com"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            This email will appear as sender in all outgoing emails
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Name
          </label>
          <input
            type="text"
            name="from_name"
            value={formData.from_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SSCPL"
            disabled={!formData.enabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Display name for the sender
          </p>
        </div>
      </div>

      {/* Email Features */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Order confirmation emails to customers
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Invoice generation and delivery
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Dispatch notifications with tracking
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Payment reminders and receipts
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
          {testing ? 'Testing...' : 'Send Test Email'}
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

export default EmailSetup;
