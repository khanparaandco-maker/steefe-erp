import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const PrintHeatTreatment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [treatment, setTreatment] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [treatmentResponse, companyResponse] = await Promise.all([
        api.getHeatTreatment(id),
        api.getCompanySettings(),
      ]);
      setTreatment(treatmentResponse.data);
      setCompanyInfo(companyResponse.data);
      
      // Trigger print after data loads
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load heat treatment record');
      navigate('/manufacturing/heat-treatment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!treatment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button (Hidden in print) */}
      <div className="no-print fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate('/manufacturing/heat-treatment')}
          className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-6">
        {/* Company Header */}
        <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {companyInfo?.company_name || 'SteelMelt ERP'}
          </h1>
          {companyInfo?.address && (
            <p className="text-sm text-gray-600">{companyInfo.address}</p>
          )}
          {companyInfo?.city && companyInfo?.state && (
            <p className="text-sm text-gray-600">
              {companyInfo.city}, {companyInfo.state}
              {companyInfo.pincode && ` - ${companyInfo.pincode}`}
            </p>
          )}
          {companyInfo?.phone && (
            <p className="text-sm text-gray-600">Phone: {companyInfo.phone}</p>
          )}
          {companyInfo?.email && (
            <p className="text-sm text-gray-600">Email: {companyInfo.email}</p>
          )}
        </div>

        {/* Document Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 uppercase">
            Heat Treatment Process Record
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Record ID: #{treatment.id}
          </p>
        </div>

        {/* Treatment Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-base font-semibold text-gray-900">
                {formatDate(treatment.treatment_date)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Furnace No</p>
              <p className="text-base font-semibold text-gray-900">
                Furnace {treatment.furnace_no}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Size (Finished Good)</p>
              <p className="text-base font-semibold text-gray-900">
                {treatment.size_name}
                {treatment.size_alias && ` (${treatment.size_alias})`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Temperature</p>
              <p className="text-base font-semibold text-gray-900">
                {treatment.temperature}°
              </p>
            </div>
          </div>

          {/* Time Details */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Time Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Time In</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatTime(treatment.time_in)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Time Out</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatTime(treatment.time_out)}
                </p>
              </div>
            </div>
          </div>

          {/* Production Details */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Production Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  No of Bags Produced (Finished Goods)
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {treatment.bags_produced} Bags
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Printed on:</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Authorized Signature</p>
                <div className="mt-8 border-t border-gray-400 w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintHeatTreatment;
