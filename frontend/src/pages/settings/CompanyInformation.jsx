import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Building2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/helpers';
import { INDIAN_STATES } from '../../utils/constants';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const CompanyInformation = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    company_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Gujarat',
    pincode: '',
    gstn: '',
    pan: '',
    contact_person: '',
    mobile: '',
    email: '',
    website: '',
    logo: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/company`);
      const data = response.data;
      setFormData({
        company_name: data.company_name || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || 'Gujarat',
        pincode: data.pincode || '',
        gstn: data.gstn || '',
        pan: data.pan || '',
        contact_person: data.contact_person || '',
        mobile: data.mobile || '',
        email: data.email || '',
        website: data.website || '',
        logo: null,
      });
      if (data.logo_url) {
        setLogoPreview(`${API_URL.replace('/api', '')}${data.logo_url}`);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      if (error.response?.status !== 404) {
        showToast('Failed to load company information', 'error');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo size should be less than 2MB', 'error');
        return;
      }
      setFormData((prev) => ({ ...prev, logo: file }));
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company_name) {
      newErrors.company_name = 'Company name is required';
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    if (formData.gstn && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstn)) {
      newErrors.gstn = 'Invalid GSTN format';
    }
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile number must be 10 digits';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'logo' && formData[key]) {
          formDataToSend.append('logo', formData[key]);
        } else if (key !== 'logo') {
          formDataToSend.append(key, formData[key] || '');
        }
      });

      await axios.put(`${API_URL}/settings/company`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showToast('Company information saved successfully', 'success');
      fetchCompanyInfo(); // Refresh data
    } catch (error) {
      console.error('Error saving company info:', error);
      showToast(error.response?.data?.message || 'Failed to save company information', 'error');
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
        <div className="p-3 bg-blue-100 rounded-lg">
          <Building2 className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
          <p className="text-sm text-gray-500">Manage your company details and branding</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.company_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter company name"
          />
          {errors.company_name && (
            <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
          )}
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1
          </label>
          <input
            type="text"
            name="address_line1"
            value={formData.address_line1}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Building, Street"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            name="address_line2"
            value={formData.address_line2}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Area, Locality"
          />
        </div>

        {/* City, State, Pincode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter pincode"
            maxLength="6"
          />
        </div>

        {/* GSTN & PAN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GSTN</label>
          <input
            type="text"
            name="gstn"
            value={formData.gstn}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.gstn ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="22AAAAA0000A1Z5"
            maxLength="15"
          />
          {errors.gstn && <p className="text-red-500 text-sm mt-1">{errors.gstn}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
          <input
            type="text"
            name="pan"
            value={formData.pan}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="AAAAA0000A"
            maxLength="10"
          />
        </div>

        {/* Contact Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter contact person name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.mobile ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="10-digit mobile number"
            maxLength="10"
          />
          {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="company@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="www.company.com"
          />
        </div>

        {/* Logo Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Logo
          </label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum file size: 2MB (JPG, PNG, GIF)</p>
            </div>
            {logoPreview && (
              <div className="flex-shrink-0">
                <img 
                  src={logoPreview} 
                  alt="Company Logo" 
                  className="w-24 h-24 object-contain border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Company Information'}
        </button>
      </div>
    </form>
    </div>
  );
};

export default CompanyInformation;
