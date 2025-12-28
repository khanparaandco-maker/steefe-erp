import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '../../services/api';

const PrintScrapGRN = () => {
  const { id } = useParams();
  const [grn, setGrn] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grnRes, companyRes] = await Promise.all([
        apiService.getScrapGRN(id),
        apiService.getSettings()
      ]);
      
      setGrn(grnRes.data);
      setCompanyInfo(companyRes);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load GRN data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600">Failed to load GRN data</div>
      </div>
    );
  }

  const supplierState = grn.supplier_state?.trim().toLowerCase() || '';
  const companyState = companyInfo?.state?.trim().toLowerCase() || '';
  const isIGST = supplierState !== companyState;

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white">
      {/* Print Button - Hidden in print */}
      <div className="no-print mb-6 flex justify-end gap-3">
        <button
          onClick={() => window.close()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print GRN
        </button>
      </div>

      {/* Print Content */}
      <div className="print-content">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{companyInfo?.company_name || 'Company Name'}</h1>
              <p className="text-sm text-gray-600 mt-2">
                {companyInfo?.address_line1}<br />
                {companyInfo?.address_line2 && <>{companyInfo.address_line2}<br /></>}
                {companyInfo?.city}, {companyInfo?.state} - {companyInfo?.pin_code}
              </p>
              <p className="text-sm text-gray-600">
                GSTIN: {companyInfo?.gstin || 'N/A'}<br />
                Email: {companyInfo?.email || 'N/A'}<br />
                Phone: {companyInfo?.phone || 'N/A'}
              </p>
            </div>
            {companyInfo?.logo_url && (
              <img 
                src={`http://localhost:3000${companyInfo.logo_url}`} 
                alt="Company Logo" 
                className="h-20 object-contain"
              />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">SCRAP GOODS RECEIPT NOTE</h2>
          <p className="text-lg font-semibold text-blue-600 mt-1">{grn.grn_no}</p>
        </div>

        {/* GRN Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">Supplier Details</h3>
            <p className="text-sm mb-1"><span className="font-semibold">Name:</span> {grn.supplier_name}</p>
            <p className="text-sm mb-1"><span className="font-semibold">State:</span> {grn.supplier_state}</p>
          </div>
          
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">Invoice Details</h3>
            <p className="text-sm mb-1"><span className="font-semibold">Invoice No:</span> {grn.invoice_no}</p>
            <p className="text-sm mb-1"><span className="font-semibold">Invoice Date:</span> {new Date(grn.invoice_date).toLocaleDateString('en-IN')}</p>
            <p className="text-sm mb-1"><span className="font-semibold">Vehicle No:</span> {grn.vehicle_no || 'N/A'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Items Details</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">S.No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Item Name</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">UOM</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Rate</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Amount</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">GST %</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">GST Amt</th>
              </tr>
            </thead>
            <tbody>
              {grn.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.item_name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.uom}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">{parseFloat(item.quantity).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">₹{parseFloat(item.amount).toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">{parseFloat(item.gst_rate).toFixed(2)}%</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">₹{parseFloat(item.gst_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-96 border border-gray-300 rounded">
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span className="text-sm font-semibold">Items Total:</span>
              <span className="text-sm">₹{parseFloat(grn.total_amount - (grn.packing_forwarding || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span className="text-sm font-semibold">Packing & Forwarding:</span>
              <span className="text-sm">₹{parseFloat(grn.packing_forwarding || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-b border-gray-300 bg-gray-50">
              <span className="text-sm font-bold">Total (A):</span>
              <span className="text-sm font-bold">₹{parseFloat(grn.total_amount).toFixed(2)}</span>
            </div>
            {isIGST ? (
              <div className="flex justify-between px-4 py-2 border-b border-gray-300">
                <span className="text-sm font-semibold">IGST:</span>
                <span className="text-sm">₹{parseFloat(grn.igst).toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between px-4 py-2 border-b border-gray-300">
                  <span className="text-sm font-semibold">CGST:</span>
                  <span className="text-sm">₹{parseFloat(grn.cgst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 border-b border-gray-300">
                  <span className="text-sm font-semibold">SGST:</span>
                  <span className="text-sm">₹{parseFloat(grn.sgst).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between px-4 py-3 bg-blue-50">
              <span className="text-base font-bold">Invoice Total:</span>
              <span className="text-base font-bold text-blue-600">₹{parseFloat(grn.invoice_total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* GST Note */}
        <div className="mb-6 p-3 bg-gray-50 border border-gray-300 rounded">
          <p className="text-xs text-gray-700">
            <strong>Note:</strong> {isIGST 
              ? 'IGST is applicable as supplier and company are in different states.' 
              : 'CGST & SGST are applicable as supplier and company are in the same state.'}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            <strong>GST on Packing & Forwarding:</strong> Fixed at 18%
          </p>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-6 mt-12 pt-6 border-t border-gray-300">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm font-semibold">Prepared By</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm font-semibold">Checked By</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-16">
              <p className="text-sm font-semibold">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>This is a computer-generated document. No signature is required.</p>
          <p className="mt-1">Generated on: {new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-content {
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintScrapGRN;
