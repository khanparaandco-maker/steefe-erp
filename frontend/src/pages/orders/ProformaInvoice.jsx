import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:3000/api';

// Number to words conversion
const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  const convertToWords = (n) => {
    if (n === 0) return 'Zero';
    
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;
    
    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder) result += convertLessThanThousand(remainder);
    
    return result.trim();
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let words = 'Rupees ' + convertToWords(rupees);
  if (paise > 0) words += ' and ' + convertToWords(paise) + ' Paise';
  words += ' Only';
  
  return words;
};

const ProformaInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    // Set document title for PDF naming
    if (order && companyInfo) {
      document.title = `Proforma_${order.order_no}_${companyInfo.company_name || 'Invoice'}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    return () => {
      document.title = 'Steel ERP'; // Reset on unmount
    };
  }, [order, companyInfo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderResponse, companyResponse, bankResponse] = await Promise.all([
        apiService.getOrder(id),
        axios.get(`${API_URL}/settings/company`),
        axios.get(`${API_URL}/settings/banks`)
      ]);
      
      // The API returns { success: true, data: {...order, items: [...]} }
      const orderData = orderResponse.data || orderResponse;
      
      setOrder(orderData);
      setItems(orderData.items || []);
      
      const companyData = companyResponse.data;
      console.log('=== COMPANY INFO DEBUG ===');
      console.log('Full Company Response:', companyData);
      console.log('Logo URL from DB:', companyData?.logo_url);
      console.log('Logo Filename:', companyData?.logo_filename);
      console.log('Constructed Logo URL:', companyData?.logo_url ? 'http://localhost:3000' + companyData.logo_url : 'No logo');
      console.log('========================');
      setCompanyInfo(companyData);
      
      // Get primary bank or first active bank
      const banks = bankResponse.data?.data || bankResponse.data || [];
      const primaryBank = banks.find(bank => bank.is_primary && bank.is_active);
      const activeBanks = banks.filter(bank => bank.is_active);
      setBankDetails(primaryBank ? [primaryBank] : activeBanks.slice(0, 1));
    } catch (error) {
      showToast('Failed to load proforma invoice data', 'error');
      console.error('Error loading proforma data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const element = printRef.current;
      if (!element) return;

      showToast('Generating PDF...', 'info');

      // Get individual sections
      const header = element.querySelector('.invoice-header');
      const content = element.querySelector('.invoice-content');
      const footer = element.querySelector('.invoice-footer');

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Capture all sections
      const headerCanvas = header ? await html2canvas(header, {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#1e293b',
        logging: false
      }) : null;

      const contentCanvas = content ? await html2canvas(content, {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      }) : null;

      const footerCanvas = footer ? await html2canvas(footer, {
        scale: 2,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#1e293b',
        logging: false
      }) : null;

      // Calculate heights
      const headerHeight = headerCanvas ? (headerCanvas.height * contentWidth) / headerCanvas.width : 0;
      const contentHeight = contentCanvas ? (contentCanvas.height * contentWidth) / contentCanvas.width : 0;
      const footerHeight = footerCanvas ? (footerCanvas.height * contentWidth) / footerCanvas.width : 0;
      
      const totalHeight = headerHeight + contentHeight + footerHeight;
      
      // Calculate scale factor if content exceeds page
      let scale = 1;
      if (totalHeight > availableHeight) {
        scale = availableHeight / totalHeight;
      }
      
      // Apply scale to all dimensions
      const scaledHeaderHeight = headerHeight * scale;
      const scaledContentHeight = contentHeight * scale;
      const scaledFooterHeight = footerHeight * scale;
      const scaledWidth = contentWidth * scale;
      
      // Center horizontally if scaled
      const xOffset = margin + (contentWidth - scaledWidth) / 2;
      let yPosition = margin;

      // Add header
      if (headerCanvas) {
        const headerImgData = headerCanvas.toDataURL('image/png');
        pdf.addImage(headerImgData, 'PNG', xOffset, yPosition, scaledWidth, scaledHeaderHeight);
        yPosition += scaledHeaderHeight;
      }

      // Add content
      if (contentCanvas) {
        const contentImgData = contentCanvas.toDataURL('image/png');
        pdf.addImage(contentImgData, 'PNG', xOffset, yPosition, scaledWidth, scaledContentHeight);
        yPosition += scaledContentHeight;
      }

      // Add footer
      if (footerCanvas) {
        const footerImgData = footerCanvas.toDataURL('image/png');
        pdf.addImage(footerImgData, 'PNG', xOffset, yPosition, scaledWidth, scaledFooterHeight);
      }

      // Generate filename
      const filename = `Proforma_${order.order_no}_${companyInfo?.company_name || 'Invoice'}`
        .replace(/[^a-zA-Z0-9_]/g, '_') + '.pdf';
      
      // Save the PDF
      pdf.save(filename);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const handleSendWhatsApp = async () => {
    if (!order.customer_mobile) {
      showToast('Customer mobile number not available', 'error');
      return;
    }

    try {
      showToast('Generating PDF for WhatsApp...', 'info');

      // Generate PDF first
      const element = printRef.current;
      if (!element) {
        showToast('Invoice content not found', 'error');
        return;
      }

      const header = element.querySelector('.invoice-header');
      const content = element.querySelector('.invoice-content');
      const footer = element.querySelector('.invoice-footer');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      const headerCanvas = header ? await html2canvas(header, { scale: 2, useCORS: false, allowTaint: true, backgroundColor: '#1e293b', logging: false }) : null;
      const contentCanvas = content ? await html2canvas(content, { scale: 2, useCORS: false, allowTaint: true, backgroundColor: '#ffffff', logging: false }) : null;
      const footerCanvas = footer ? await html2canvas(footer, { scale: 2, useCORS: false, allowTaint: true, backgroundColor: '#1e293b', logging: false }) : null;

      const headerHeight = headerCanvas ? (headerCanvas.height * contentWidth) / headerCanvas.width : 0;
      const contentHeight = contentCanvas ? (contentCanvas.height * contentWidth) / contentCanvas.width : 0;
      const footerHeight = footerCanvas ? (footerCanvas.height * contentWidth) / footerCanvas.width : 0;
      const totalHeight = headerHeight + contentHeight + footerHeight;
      
      let scale = 1;
      if (totalHeight > availableHeight) {
        scale = availableHeight / totalHeight;
      }
      
      const scaledHeaderHeight = headerHeight * scale;
      const scaledContentHeight = contentHeight * scale;
      const scaledFooterHeight = footerHeight * scale;
      const scaledWidth = contentWidth * scale;
      const xOffset = margin + (contentWidth - scaledWidth) / 2;
      let yPosition = margin;

      if (headerCanvas) {
        pdf.addImage(headerCanvas.toDataURL('image/png'), 'PNG', xOffset, yPosition, scaledWidth, scaledHeaderHeight);
        yPosition += scaledHeaderHeight;
      }
      if (contentCanvas) {
        pdf.addImage(contentCanvas.toDataURL('image/png'), 'PNG', xOffset, yPosition, scaledWidth, scaledContentHeight);
        yPosition += scaledContentHeight;
      }
      if (footerCanvas) {
        pdf.addImage(footerCanvas.toDataURL('image/png'), 'PNG', xOffset, yPosition, scaledWidth, scaledFooterHeight);
      }

      // Get PDF as blob
      const pdfBlob = pdf.output('blob');
      
      // Upload PDF to server
      showToast('Uploading PDF...', 'info');
      const formData = new FormData();
      formData.append('file', pdfBlob, `Proforma_${order.order_no}.pdf`);
      formData.append('type', 'proforma');
      
      const uploadResponse = await axios.post(`${API_URL}/upload/proforma`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const pdfPath = uploadResponse.data.filePath;

      // Prepare invoice data
      showToast('Sending via WhatsApp...', 'info');
      const totals = calculateTotals();
      const isIGST = order.customer_state && order.customer_state !== companyInfo?.state;
      const primaryBank = bankDetails[0] || null;

      const invoiceData = {
        invoice_no: order.order_no,
        invoice_date: order.order_date,
        customer_name: order.customer_name,
        customer_address: order.customer_address,
        items: items.map(item => ({
          item_name: item.item_name,
          size_name: item.size_name,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        total_amount: totals.grandTotal,
        bank_name: primaryBank?.bank_name || 'N/A',
        account_number: primaryBank?.account_number || 'N/A',
        ifsc_code: primaryBank?.ifsc_code || 'N/A'
      };

      const response = await axios.post(`${API_URL}/whatsapp/send-proforma`, {
        phoneNumber: order.customer_mobile,
        invoiceData,
        pdfPath
      });

      showToast('Proforma invoice sent successfully via WhatsApp!', 'success');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      showToast(error.response?.data?.message || 'Failed to send WhatsApp message', 'error');
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalCgst = items.reduce((sum, item) => sum + parseFloat(item.cgst || 0), 0);
    const totalSgst = items.reduce((sum, item) => sum + parseFloat(item.sgst || 0), 0);
    const totalIgst = items.reduce((sum, item) => sum + parseFloat(item.igst || 0), 0);
    const grandTotal = items.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    
    // Get GST rates from first item (assuming all items have same rate)
    const firstItem = items[0] || {};
    const cgstRate = firstItem.cgst_rate || 9;
    const sgstRate = firstItem.sgst_rate || 9;
    const igstRate = firstItem.igst_rate || 18;

    return { subtotal, totalCgst, totalSgst, totalIgst, grandTotal, cgstRate, sgstRate, igstRate };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading proforma invoice...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Order not found</div>
      </div>
    );
  }

  const totals = calculateTotals();
  const isIGST = order.customer_state && order.customer_state !== companyInfo?.state;
  const amountInWords = numberToWords(totals.grandTotal);
  const primaryBank = bankDetails[0] || null;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      {/* Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end gap-3 no-print px-4 sm:px-0">
        <button
          onClick={() => navigate('/orders/list')}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={handleSendWhatsApp}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Send via WhatsApp</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Invoice</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Invoice Container */}
      <div
        ref={printRef}
        id="invoice-content"
        className="page-container max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:rounded-none print:shadow-none print:max-w-full"
        style={{ pageBreakAfter: 'avoid' }}
      >
        
        {/* Fixed Header */}
        <div className="invoice-header bg-slate-800 text-white p-8 print:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {companyInfo?.logo_url && (
                <img
                  src={companyInfo.logo_url}
                  alt="Company Logo"
                  className="h-24 w-24 print:h-20 print:w-20 object-contain rounded"
                  onError={(e) => {
                    console.error('❌ Logo failed to load:', companyInfo.logo_url);
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => console.log('✅ Logo loaded successfully!')}
                />
              )}
              <div>
                <h1 className="text-4xl print:text-3xl font-bold tracking-tight mb-1">{companyInfo?.company_name || 'Company Name'}</h1>
                <p className="text-slate-300 text-lg print:text-base mt-1">{companyInfo?.tagline || 'Manufacturing Excellence'}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl print:text-2xl font-bold text-white uppercase tracking-widest mb-1">PROFORMA INVOICE</h2>
              <p className="text-slate-300 text-lg print:text-base mt-1">#{order.order_no}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="invoice-content p-12 print:p-8">
          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-10 print:gap-6 mb-8 print:mb-6 pb-8 print:pb-6 border-b-2 border-slate-300">
            
            {/* Supplier Info */}
            <div className="text-lg print:text-sm text-slate-700 leading-relaxed">
              <h3 className="text-slate-900 font-bold uppercase text-base print:text-xs mb-3 print:mb-2 tracking-wider">SUPPLIED BY</h3>
              <p className="font-bold text-slate-900 mb-2 text-xl print:text-base">{companyInfo?.company_name || 'Company Name'}</p>
              <p className="leading-relaxed text-lg print:text-sm">{companyInfo?.address_line1}</p>
              {companyInfo?.address_line2 && <p className="leading-relaxed text-lg print:text-sm">{companyInfo.address_line2}</p>}
              <p className="leading-relaxed text-lg print:text-sm">{companyInfo?.city}, {companyInfo?.state} - {companyInfo?.pincode}</p>
              
              <div className="mt-4 print:mt-3 space-y-2 print:space-y-1.5">
                {companyInfo?.gstn && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg print:text-sm">📄</span>
                    <span className="text-lg print:text-sm">GSTN: <span className="font-bold text-slate-900">{companyInfo.gstn}</span></span>
                  </div>
                )}
                {companyInfo?.mobile && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg print:text-sm">📞</span>
                    <span className="text-lg print:text-sm">{companyInfo.mobile}</span>
                  </div>
                )}
                {companyInfo?.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg print:text-sm">✉️</span>
                    <span className="text-lg print:text-sm truncate">{companyInfo.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To */}
            <div className="text-lg print:text-sm text-slate-700 leading-relaxed">
              <h3 className="text-slate-900 font-bold uppercase text-base print:text-xs mb-3 print:mb-2 tracking-wider">BILL TO</h3>
              <p className="font-bold text-slate-900 mb-2 text-xl print:text-base">{order.customer_name}</p>
              {order.address_line1 && <p className="leading-relaxed text-lg print:text-sm">{order.address_line1}</p>}
              {order.address_line2 && <p className="leading-relaxed text-lg print:text-sm">{order.address_line2}</p>}
              <p className="leading-relaxed text-lg print:text-sm">{order.city}, {order.customer_state}</p>
              {order.customer_gstn && (
                <div className="mt-3 print:mt-2">
                  <span className="bg-slate-100 text-slate-700 px-3 py-1.5 text-base print:text-sm">GSTN: {order.customer_gstn}</span>
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="text-lg print:text-sm">
              <h3 className="text-slate-900 font-bold uppercase text-base print:text-xs mb-3 print:mb-2 tracking-wider">INVOICE DETAILS</h3>
              <div className="space-y-2 print:space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-bold text-slate-900">{formatDate(order.order_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">PO No:</span>
                  <span className="font-bold text-slate-900">{order.po_no || 'N/A'}</span>
                </div>
                {order.estimated_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Est. Delivery:</span>
                    <span className="font-bold text-slate-900">{formatDate(order.estimated_delivery_date)}</span>
                  </div>
                )}
              </div>
              {order.payment_condition && (
                <div className="mt-3 print:mt-2 pt-3 print:pt-2 border-t border-slate-300">
                  <div className="text-sm print:text-xs text-slate-600 mb-1">Payment Terms:</div>
                  <div className="font-semibold text-slate-900 text-base print:text-xs">{order.payment_condition}</div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-10 print:mb-6 border-2 border-slate-400">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-base print:text-xs tracking-wide border-b-2 border-slate-400">
                  <th className="p-4 print:py-2 print:px-2 w-20 print:w-12 text-center border-r border-slate-300">SR.</th>
                  <th className="p-4 print:py-2 print:px-2 border-r border-slate-300">ITEM DESCRIPTION</th>
                  <th className="p-4 print:py-2 print:px-2 text-right w-36 print:w-24 border-r border-slate-300">QTY</th>
                  <th className="p-4 print:py-2 print:px-2 text-center w-28 print:w-20 border-r border-slate-300">UOM</th>
                  <th className="p-4 print:py-2 print:px-2 text-right w-36 print:w-24 border-r border-slate-300">RATE (₹)</th>
                  <th className="p-4 print:py-2 print:px-2 text-right w-44 print:w-32">AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody className="text-lg print:text-xs text-slate-700">
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="p-4 print:py-2 print:px-2 text-center text-slate-600 border-r border-slate-200">{index + 1}</td>
                    <td className="p-4 print:py-2 print:px-2 font-medium text-slate-900 border-r border-slate-200">{item.item_name}</td>
                    <td className="p-4 print:py-2 print:px-2 text-right border-r border-slate-200">{formatCurrency(item.quantity)}</td>
                    <td className="p-4 print:py-2 print:px-2 text-center text-slate-600 border-r border-slate-200">{item.uom}</td>
                    <td className="p-4 print:py-2 print:px-2 text-right border-r border-slate-200">{formatCurrency(item.rate)}</td>
                    <td className="p-4 print:py-2 print:px-2 text-right font-semibold">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="grid grid-cols-2 gap-12 print:gap-8">
            
            {/* Left Column: Bank & Words */}
            <div className="space-y-6 print:space-y-4">
              <div>
                <p className="text-base print:text-xs font-bold text-slate-700 uppercase mb-2">AMOUNT IN WORDS</p>
                <p className="text-lg print:text-sm font-medium text-slate-900 italic border-l-4 border-slate-400 pl-4 py-2 leading-relaxed">
                  {amountInWords}
                </p>
              </div>

              {primaryBank && (
                <div className="bg-slate-50 p-5 print:p-4 border-2 border-slate-300">
                  <h4 className="font-bold text-slate-900 text-lg print:text-sm mb-3 print:mb-2">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-base print:text-xs text-slate-700">
                    <span>Bank Name:</span>
                    <span className="font-semibold text-slate-900">{primaryBank.bank_name}</span>
                    <span>A/C No:</span>
                    <span className="font-semibold text-slate-900">{primaryBank.account_number}</span>
                    <span>IFSC Code:</span>
                    <span className="font-semibold text-slate-900">{primaryBank.ifsc_code}</span>
                    <span>Branch:</span>
                    <span className="font-semibold text-slate-900">{primaryBank.branch}</span>
                  </div>
                </div>
              )}

              <div className="text-base print:text-xs text-slate-600 space-y-1.5 print:space-y-1 border-t-2 pt-4 print:pt-3">
                <h4 className="font-bold text-slate-900 mb-2 text-lg print:text-sm">Terms & Conditions:</h4>
                <p>1. This is a proforma invoice and not a tax invoice.</p>
                {order.payment_condition && (
                  <p>2. Payment terms: {order.payment_condition}</p>
                )}
                {!order.payment_condition && (
                  <p>2. Payment terms: As per agreement.</p>
                )}
                <p>3. Goods once sold will not be taken back.</p>
                <p>4. Subject to {companyInfo?.city} Jurisdiction.</p>
              </div>
            </div>

            {/* Right Column: Totals & Sign */}
            <div className="flex flex-col justify-between">
              {/* Totals */}
              <div className="space-y-3 print:space-y-2.5 text-lg print:text-sm text-right">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {isIGST ? (
                  <div className="flex justify-between text-slate-700">
                    <span>IGST ({totals.igstRate}%)</span>
                    <span>{formatCurrency(totals.totalIgst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>CGST ({totals.cgstRate}%)</span>
                      <span>{formatCurrency(totals.totalCgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>SGST ({totals.sgstRate}%)</span>
                      <span>{formatCurrency(totals.totalSgst)}</span>
                    </div>
                  </>
                )}
                  <div className="border-t-2 border-slate-900 mt-4 pt-4 flex justify-between font-bold text-2xl print:text-lg text-slate-900">
                  <span>Grand Total</span>
                  <span>₹ {formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-12 print:mt-6 text-center border-t-2 border-slate-300 pt-6 print:pt-4">
                <div className="h-20 print:h-16 flex items-end justify-center">
                  <span className="text-slate-400 text-xl print:text-base italic opacity-40">Authorized Signatory</span>
                </div>
                <p className="text-base print:text-xs text-slate-600 mt-3 print:mt-2 font-medium">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="invoice-footer bg-slate-800 text-slate-300 text-base print:text-sm p-5 print:p-4 text-center">
          Questions? Contact us at {companyInfo?.mobile || 'N/A'} or {companyInfo?.email || 'N/A'}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide all layout elements */
          body > div:not(#root),
          aside,
          nav,
          header,
          .sidebar,
          [class*="sidebar"],
          [class*="Sidebar"],
          .no-print {
            display: none !important;
          }

          /* Reset body and root */
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #root {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Reset all flex containers that might be part of layout */
          .flex.h-screen,
          .flex-1.flex.flex-col,
          .lg\\:ml-64,
          main {
            all: unset !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Show only the invoice container */
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .page-container {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Page settings - Single page with scaling */
          @page {
            size: A4;
            margin: 10mm;
          }

          /* Scale content to fit one page */
          #invoice-content {
            transform: scale(0.85);
            transform-origin: top center;
          }

          /* Preserve invoice styling */
          .bg-slate-800 { 
            background-color: #1e293b !important; 
            color: white !important; 
          }
          
          .text-slate-300 { 
            color: #cbd5e1 !important; 
          }
          
          .bg-slate-50 { 
            background-color: #f8fafc !important; 
          }
          
          .bg-slate-100 { 
            background-color: #f1f5f9 !important; 
          }
          
          .text-slate-500 { 
            color: #64748b !important; 
          }

          .text-slate-600 { 
            color: #475569 !important; 
          }

          .text-slate-700 { 
            color: #334155 !important; 
          }

          .text-slate-800 { 
            color: #1e293b !important; 
          }

          .text-slate-900 { 
            color: #0f172a !important; 
          }

          .border-slate-100 {
            border-color: #f1f5f9 !important;
          }

          .border-slate-200 {
            border-color: #e2e8f0 !important;
          }

          .border-slate-300 {
            border-color: #cbd5e1 !important;
          }

          .border-slate-400 {
            border-color: #94a3b8 !important;
          }

          /* Prevent page breaks */
          * {
            page-break-inside: avoid !important;
          }

          table {
            page-break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
        }

        /* Screen-only styles */
        @media screen {
          .page-container {
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
};

export default ProformaInvoice;
