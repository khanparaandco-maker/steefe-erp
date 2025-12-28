import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';

const EditOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: '',
    po_no: '',
    estimated_delivery_date: '',
    preferred_transporter_id: '',
    payment_condition: '',
  });
  const [orderItems, setOrderItems] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [orderResponse, customersData, itemsData] = await Promise.all([
        apiService.getOrder(id),
        apiService.getCustomers(),
        apiService.getItems(),
      ]);

      const orderData = orderResponse.data || orderResponse;
      
      setFormData({
        customer_id: orderData.customer_id,
        order_date: orderData.order_date?.split('T')[0] || '',
        po_no: orderData.po_no || '',
        estimated_delivery_date: orderData.estimated_delivery_date?.split('T')[0] || '',
        preferred_transporter_id: orderData.preferred_transporter_id || '',
        payment_condition: orderData.payment_condition || '',
      });

      setOrderItems(
        (orderData.items || []).map((item) => ({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          bag_count: item.bag_count,
          rate: item.rate,
        }))
      );

      setCustomers(customersData.data || customersData || []);
      setItems(itemsData.data || itemsData || []);
    } catch (error) {
      showToast('Failed to load order data', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;

    if (field === 'quantity') {
      updatedItems[index].bag_count = Math.ceil(parseFloat(value) / 25);
    }

    setOrderItems(updatedItems);
  };

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      { item_id: '', quantity: '', bag_count: '', rate: '' },
    ]);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.order_date || !formData.estimated_delivery_date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (orderItems.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    try {
      setSaving(true);
      await apiService.updateOrder(id, {
        ...formData,
        items: orderItems.map((item) => ({
          id: item.id,
          item_id: item.item_id,
          quantity: parseFloat(item.quantity),
          bag_count: parseInt(item.bag_count),
          rate: parseFloat(item.rate),
        })),
      });
      showToast('Order updated successfully', 'success');
      navigate('/orders/list');
    } catch (error) {
      showToast(error.message || 'Failed to update order', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading order...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/orders/list')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back to Orders</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Order</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input
                type="text"
                name="po_no"
                value={formData.po_no}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="estimated_delivery_date"
                value={formData.estimated_delivery_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Condition
              </label>
              <input
                type="text"
                name="payment_condition"
                value={formData.payment_condition}
                onChange={handleInputChange}
                placeholder="e.g., 30 days credit, Advance payment, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Sr</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Bags</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          required
                        >
                          <option value="">Select Item</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.item_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                          required
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.bag_count}
                          onChange={(e) => handleItemChange(index, 'bag_count', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded"
                          required
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/orders/list')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Save size={18} />
              {saving ? 'Updating...' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrder;
