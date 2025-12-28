import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const PrintMeltingProcess = () => {
  const { id } = useParams();
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcessData();
  }, [id]);

  useEffect(() => {
    if (process) {
      // Trigger print dialog after data loads
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [process]);

  const fetchProcessData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMeltingProcess(id);
      setProcess(response.data);
    } catch (error) {
      showToast(error.message || 'Failed to fetch melting process', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatNumber = (num, decimals = 3) => {
    if (num === null || num === undefined) return '-';
    return parseFloat(num).toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Melting process not found</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

      <div className="print-container mx-auto max-w-4xl bg-white p-8">
        {/* Header */}
        <div className="mb-6 border-b-2 border-gray-800 pb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">STEELMELT ERP</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-700">Melting Process Record</h2>
        </div>

        {/* Basic Info */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-b border-gray-300 pb-4">
          <div>
            <p className="text-sm text-gray-600">Date:</p>
            <p className="text-lg font-semibold text-gray-900">{formatDate(process.melting_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Heat No:</p>
            <p className="text-lg font-semibold text-gray-900">Heat {process.heat_no}</p>
          </div>
        </div>

        {/* Scrap Details */}
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-bold text-gray-900">SCRAP DETAILS</h3>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-2">
              <p className="text-sm text-gray-600">Weight Formula:</p>
              <p className="font-mono text-base font-medium text-gray-900">{process.scrap_weight}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Scrap:</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(process.scrap_total)} Kgs</p>
            </div>
          </div>
        </div>

        {/* Time Details */}
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-bold text-gray-900">TIME</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">Time-In:</p>
              <p className="text-lg font-semibold text-gray-900">{formatTime(process.time_in)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">Time-Out:</p>
              <p className="text-lg font-semibold text-gray-900">{formatTime(process.time_out)}</p>
            </div>
          </div>
        </div>

        {/* Minerals Added */}
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-bold text-gray-900">MINERALS ADDED</h3>
          <div className="rounded-lg border border-gray-300 p-4">
            <table className="w-full">
              <tbody>
                {process.carbon && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-700">Carbon:</td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {formatNumber(process.carbon)} Kgs
                    </td>
                  </tr>
                )}
                {process.manganese && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-700">Manganese:</td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {formatNumber(process.manganese)} Kgs
                    </td>
                  </tr>
                )}
                {process.silicon && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-700">Silicon:</td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {formatNumber(process.silicon)} Kgs
                    </td>
                  </tr>
                )}
                {process.aluminium && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-700">Aluminium:</td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {formatNumber(process.aluminium)} Kgs
                    </td>
                  </tr>
                )}
                {process.calcium && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-700">Calcium:</td>
                    <td className="py-2 text-right font-semibold text-gray-900">
                      {formatNumber(process.calcium)} Kgs
                    </td>
                  </tr>
                )}
                {!process.carbon && !process.manganese && !process.silicon && 
                 !process.aluminium && !process.calcium && (
                  <tr>
                    <td className="py-2 text-center text-gray-500" colSpan="2">
                      No minerals added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Temperature */}
        {process.temperature && (
          <div className="mb-6">
            <h3 className="mb-3 text-lg font-bold text-gray-900">TEMPERATURE</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(process.temperature, 2)}°C
              </p>
            </div>
          </div>
        )}

        {/* Spectro Readings */}
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-bold text-gray-900">SPECTRO READING</h3>
          {process.spectro_readings && process.spectro_readings.length > 0 ? (
            <div className="space-y-4">
              {process.spectro_readings.map((reading, index) => (
                <div key={reading.id} className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                  <h4 className="mb-3 font-semibold text-gray-900">Reading {index + 1}:</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3">
                    {reading.carbon !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Carbon:</span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(reading.carbon, 4)}
                        </span>
                      </div>
                    )}
                    {reading.silicon !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Silicon:</span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(reading.silicon, 4)}
                        </span>
                      </div>
                    )}
                    {reading.manganese !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Manganese:</span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(reading.manganese, 4)}
                        </span>
                      </div>
                    )}
                    {reading.phosphorus !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Phosphorus:</span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(reading.phosphorus, 4)}
                        </span>
                      </div>
                    )}
                    {reading.sulphur !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Sulphur:</span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(reading.sulphur, 4)}
                        </span>
                      </div>
                    )}
                    {reading.chrome !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Chrome:</span>
                        <span className="font-semibold text-gray-900">
                          {formatNumber(reading.chrome, 4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No spectro readings available</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-300 pt-4 text-center text-sm text-gray-500">
          <p>Generated on {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    </>
  );
};

export default PrintMeltingProcess;
