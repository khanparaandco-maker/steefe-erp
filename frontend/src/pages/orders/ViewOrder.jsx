import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit, MessageCircle, FileText } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';
import axios from 'axios';

import { API_BASE_URL } from '../../utils/constants';

const API_URL = `${API_BASE_URL}/api`;

const ViewOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrderById(id);
      setOrder(response.data);
    } catch (error) {
      showToast(error.message || 'Failed to fetch order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrderConfirmation = async () => {
    if (!order.customer_mobile) {
      showToast('Customer mobile number not available', 'error');
      return;
    }

    try {
      setSending(true);
      showToast('Sending order confirmation via WhatsApp...', 'info');

      // Prepare order data with all items
      const orderData = {
        order_no: order.order_no,
        order_date: order.order_date,
        customer_name: order.customer_name,
        contact_person: order.items?.[0]?.contact_person || order.customer_name,
        items: order.items.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          uom: item.uom || 'KG',
          rate: item.rate,
          amount: item.amount
        })),
        total_amount: order.items.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0),
        estimated_delivery_date: order.estimated_delivery_date,
        payment_condition: order.payment_condition
      };

      // Send without PDF for now (PDF generation can be added later)
      const response = await axios.post(`${API_URL}/whatsapp/send-order`, {
        phoneNumber: order.customer_mobile,
        orderData
      });

      showToast('Order confirmation sent successfully via WhatsApp!', 'success');
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      showToast(error.response?.data?.message || 'Failed to send order confirmation', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateTotals = () => {
    if (!order?.items) return { quantity: 0, bags: 0, amount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
    
    return order.items.reduce((acc, item) => ({
      quantity: acc.quantity + parseFloat(item.quantity || 0),
      bags: acc.bags + parseFloat(item.bag_count || 0),
      amount: acc.amount + parseFloat(item.amount || 0),
      cgst: acc.cgst + parseFloat(item.cgst || 0),
      sgst: acc.sgst + parseFloat(item.sgst || 0),
      igst: acc.igst + parseFloat(item.igst || 0),
      total: acc.total + parseFloat(item.total_amount || 0),
    }), { quantity: 0, bags: 0, amount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Order not found</p>
          <button
            onClick={() => navigate('/orders/list')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders/list')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
            <p className="text-sm text-gray-500 mt-1">Order No: {order.order_no}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSendOrderConfirmation}
            disabled={sending || !order.customer_mobile}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <MessageCircle size={18} />
            {sending ? 'Sending...' : 'Send Order Confirmation'}
          </button>
          <button
            onClick={() => navigate(`/orders/proforma/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText size={18} />
            Proforma Invoice
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Order Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium text-gray-900">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">State</p>
              <p className="font-medium text-gray-900">{order.customer_state}</p>
            </div>
            {order.address_line1 && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {order.address_line1}
                  {order.address_line2 && <>, {order.address_line2}</>}
                  {order.city && <><br />{order.city}</>}
                </p>
              </div>
            )}
            {order.customer_gstn && (
              <div>
                <p className="text-sm text-gray-500">GSTN</p>
                <p className="font-medium text-gray-900">{order.customer_gstn}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Order Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium text-gray-900">{formatDate(order.order_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </p>
              </div>
            </div>
            {order.po_no && (
              <div>
                <p className="text-sm text-gray-500">PO Number</p>
                <p className="font-medium text-gray-900">{order.po_no}</p>
              </div>
            )}
            {order.estimated_delivery_date && (
              <div>
                <p className="text-sm text-gray-500">Estimated Delivery</p>
                <p className="font-medium text-gray-900">{formatDate(order.estimated_delivery_date)}</p>
              </div>
            )}
            {order.payment_condition && (
              <div>
                <p className="text-sm text-gray-500">Payment Condition</p>
                <p className="font-medium text-gray-900">{order.payment_condition}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sr</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bags</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{parseFloat(item.quantity).toFixed(3)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{parseFloat(item.bag_count).toFixed(3)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.rate)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.cgst)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.sgst)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.igst)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="2" className="px-4 py-3 text-sm text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{totals.quantity.toFixed(3)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{totals.bags.toFixed(3)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">-</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(totals.amount)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(totals.cgst)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(totals.sgst)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(totals.igst)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(totals.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Summary */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-end">
          <div className="w-full md:w-1/2 lg:w-1/3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.amount)}</span>
              </div>
              {totals.cgst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST:</span>
                  <span className="font-medium">{formatCurrency(totals.cgst)}</span>
                </div>
              )}
              {totals.sgst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST:</span>
                  <span className="font-medium">{formatCurrency(totals.sgst)}</span>
                </div>
              )}
              {totals.igst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGST:</span>
                  <span className="font-medium">{formatCurrency(totals.igst)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span className="text-blue-600">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;
