import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Save } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';
import { COMPANY_STATE } from '../../utils/constants';

const CreateOrder = () => {
  const { id } = useParams(); // Get order ID from URL for edit mode
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    order_no: 'Auto Generate',
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    po_no: '',
    estimated_delivery_date: '',
    preferred_transporter_id: '',
    payment_condition: '',
    po_copy: null,
  });

  const [orderItems, setOrderItems] = useState([{
    id: Date.now(),
    item_id: '',
    item_name: '',
    quantity: '',
    bag_count: '',
    rate: '',
    amount: 0,
    gst_rate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total_amount: 0,
  }]);

  const [errors, setErrors] = useState({});
  const [customerState, setCustomerState] = useState('');

  useEffect(() => {
    fetchData();
    if (isEditMode) {
      fetchOrderData();
    }
  }, [isEditMode]);

  const fetchData = async () => {
    try {
      const [customersRes, itemsRes, transportersRes] = await Promise.all([
        apiService.getCustomers(),
        apiService.getItems(),
        apiService.getTransporters(),
      ]);
      setCustomers(customersRes.data || []);
      setItems(itemsRes.data || []);
      setTransporters(transportersRes.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
    } finally {
      if (!isEditMode) {
        setLoading(false);
      }
    }
  };

  const fetchOrderData = async () => {
    try {
      const response = await apiService.getOrderById(id);
      const order = response.data;
      
      // Set form data
      setFormData({
        order_no: order.order_no,
        customer_id: order.customer_id.toString(),
        order_date: order.order_date.split('T')[0],
        po_no: order.po_no || '',
        estimated_delivery_date: order.estimated_delivery_date ? order.estimated_delivery_date.split('T')[0] : '',
        preferred_transporter_id: order.preferred_transporter_id ? order.preferred_transporter_id.toString() : '',
        payment_condition: order.payment_condition || '',
        po_copy: null,
      });
      
      // Set customer state
      const customer = await apiService.getCustomers();
      const customerData = customer.data.find(c => c.id === order.customer_id);
      setCustomerState(customerData?.state || '');
      
      // Fetch and set order items
      const itemsResponse = await apiService.getOrderById(id);
      const orderItems = itemsResponse.data.items || [];
      
      setOrderItems(orderItems.map(item => ({
        id: item.id, // Use actual item ID for updates
        item_id: item.item_id.toString(),
        item_name: item.item_name,
        quantity: item.quantity.toString(),
        bag_count: item.bag_count.toString(),
        rate: item.rate.toString(),
        amount: item.amount,
        gst_rate: item.gst_rate || 0,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        total_amount: item.total_amount,
      })));
      
    } catch (error) {
      showToast(error.message || 'Failed to fetch order data', 'error');
      navigate('/orders/list');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'customer_id') {
      const customer = customers.find(c => c.id === parseInt(value));
      setCustomerState(customer?.state || '');
      // Recalculate all item GST when customer changes
      recalculateAllItems(customer?.state || '');
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, po_copy: file }));
    }
  };

  const handleItemChange = (id, field, value) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // If item is selected, populate rate and gst_rate
        if (field === 'item_id') {
          const selectedItem = items.find(i => i.id === parseInt(value));
          if (selectedItem) {
            updatedItem.item_name = selectedItem.item_name;
            updatedItem.rate = selectedItem.rate || '';
            updatedItem.gst_rate = selectedItem.gst_rate || 0;
          }
        }

        // Calculate bag count from quantity
        if (field === 'quantity' && value) {
          const qty = parseFloat(value);
          updatedItem.bag_count = (qty / 25).toFixed(3);
        }

        // Calculate amount when quantity or rate changes
        if ((field === 'quantity' || field === 'rate') && updatedItem.quantity && updatedItem.rate) {
          const qty = parseFloat(updatedItem.quantity);
          const rate = parseFloat(updatedItem.rate);
          updatedItem.amount = (qty * rate).toFixed(2);

          // Calculate GST
          const gst = calculateGST(parseFloat(updatedItem.amount), parseFloat(updatedItem.gst_rate));
          updatedItem.cgst = gst.cgst;
          updatedItem.sgst = gst.sgst;
          updatedItem.igst = gst.igst;
          updatedItem.total_amount = (
            parseFloat(updatedItem.amount) +
            parseFloat(gst.cgst) +
            parseFloat(gst.sgst) +
            parseFloat(gst.igst)
          ).toFixed(2);
        }

        return updatedItem;
      })
    );
  };

  const calculateGST = (amount, gstRate) => {
    const gstAmount = (amount * gstRate) / 100;
    
    if (customerState === COMPANY_STATE) {
      // Same state: CGST + SGST
      return {
        cgst: (gstAmount / 2).toFixed(2),
        sgst: (gstAmount / 2).toFixed(2),
        igst: 0,
      };
    } else {
      // Different state: IGST
      return {
        cgst: 0,
        sgst: 0,
        igst: gstAmount.toFixed(2),
      };
    }
  };

  const recalculateAllItems = (state) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (!item.amount || !item.gst_rate) return item;

        const gst = calculateGST(parseFloat(item.amount), parseFloat(item.gst_rate));
        return {
          ...item,
          cgst: gst.cgst,
          sgst: gst.sgst,
          igst: gst.igst,
          total_amount: (
            parseFloat(item.amount) +
            parseFloat(gst.cgst) +
            parseFloat(gst.sgst) +
            parseFloat(gst.igst)
          ).toFixed(2),
        };
      })
    );
  };

  const addOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_id: '',
        item_name: '',
        quantity: '',
        bag_count: '',
        rate: '',
        amount: 0,
        gst_rate: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total_amount: 0,
      },
    ]);
  };

  const removeOrderItem = (id) => {
    if (orderItems.length === 1) {
      showToast('At least one item is required', 'error');
      return;
    }
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    const totals = orderItems.reduce(
      (acc, item) => ({
        quantity: acc.quantity + (parseFloat(item.quantity) || 0),
        bag_count: acc.bag_count + (parseFloat(item.bag_count) || 0),
        amount: acc.amount + (parseFloat(item.amount) || 0),
        cgst: acc.cgst + (parseFloat(item.cgst) || 0),
        sgst: acc.sgst + (parseFloat(item.sgst) || 0),
        igst: acc.igst + (parseFloat(item.igst) || 0),
        total: acc.total + (parseFloat(item.total_amount) || 0),
      }),
      { quantity: 0, bag_count: 0, amount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
    return totals;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    if (!formData.order_date) {
      newErrors.order_date = 'Order date is required';
    }

    // Validate order items
    const hasValidItem = orderItems.some(
      (item) => item.item_id && item.quantity && item.rate
    );
    if (!hasValidItem) {
      newErrors.items = 'At least one valid item with quantity and rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const validItems = orderItems.filter(
        (item) => item.item_id && item.quantity && item.rate
      );

      const orderData = {
        customer_id: parseInt(formData.customer_id),
        order_date: formData.order_date,
        po_no: formData.po_no || null,
        estimated_delivery_date: formData.estimated_delivery_date || null,
        preferred_transporter_id: formData.preferred_transporter_id ? parseInt(formData.preferred_transporter_id) : null,
        payment_condition: formData.payment_condition || null,
        items: validItems.map((item) => ({
          id: isEditMode ? item.id : undefined, // Include ID for updates
          item_id: parseInt(item.item_id),
          quantity: parseFloat(item.quantity),
          bag_count: parseFloat(item.bag_count),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.amount),
          cgst: parseFloat(item.cgst),
          sgst: parseFloat(item.sgst),
          igst: parseFloat(item.igst),
          total_amount: parseFloat(item.total_amount),
        })),
      };

      // TODO: Handle file upload for PO copy
      if (isEditMode) {
        await apiService.updateOrder(id, orderData);
        showToast('Order updated successfully', 'success');
        navigate('/orders/list');
      } else {
        await apiService.createOrder(orderData);
        showToast('Order created successfully', 'success');
        
        // Reset form
        setFormData({
          order_no: 'Auto Generate',
          customer_id: '',
          order_date: new Date().toISOString().split('T')[0],
          po_no: '',
          estimated_delivery_date: '',
          preferred_transporter_id: '',
          payment_condition: '',
          po_copy: null,
        });
        setOrderItems([{
          id: Date.now(),
          item_id: '',
          item_name: '',
          quantity: '',
          bag_count: '',
          rate: '',
          amount: 0,
          gst_rate: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total_amount: 0,
        }]);
        setCustomerState('');
      }
    } catch (error) {
      showToast(error.message || `Failed to ${isEditMode ? 'update' : 'create'} order`, 'error');
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Order' : 'Create Order'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode ? 'Update order details' : 'Enter order details received from customer'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Header */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order No
                </label>
                <input
                  type="text"
                  value={formData.order_no}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                {!isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">Serial No auto populate</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customer_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_name}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
                )}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.order_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.order_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.order_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO No
                </label>
                <input
                  type="text"
                  name="po_no"
                  value={formData.po_no}
                  onChange={handleInputChange}
                  placeholder="Enter PO number"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Transporter
                </label>
                <select
                  name="preferred_transporter_id"
                  value={formData.preferred_transporter_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Transporter</option>
                  {transporters.map((transporter) => (
                    <option key={transporter.id} value={transporter.id}>
                      {transporter.transporter_name}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload PO Copy
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="po-upload"
                  />
                  <label
                    htmlFor="po-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload size={18} />
                    {formData.po_copy ? formData.po_copy.name : 'Choose File'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Order Items</h2>
              <button
                type="button"
                onClick={addOrderItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            {errors.items && (
              <p className="text-red-500 text-sm mb-4">{errors.items}</p>
            )}

            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Sr No
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Item Name <span className="text-red-500">*</span>
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    QTY
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Bag
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Rate
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    GST Rate
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    CGST
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    SGST
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    IGST
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Total
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <select
                        value={item.item_id}
                        onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Item</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.item_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="number"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        placeholder="0.000"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="text"
                        value={item.bag_count}
                        readOnly
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                      {parseFloat(item.amount || 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                      {item.gst_rate}%
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                      {parseFloat(item.cgst || 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                      {parseFloat(item.sgst || 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                      {parseFloat(item.igst || 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-sm font-semibold">
                      {parseFloat(item.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeOrderItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border border-gray-300 px-2 py-2 text-center" colSpan="2">
                    Total
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {totals.quantity.toFixed(3)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {totals.bag_count.toFixed(3)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {totals.amount.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {totals.cgst.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {totals.sgst.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {totals.igst.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {totals.total.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                </tr>
              </tbody>
            </table>

            {/* GST Calculation Notes */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">GST Calculation Notes:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>
                  • If Customer State is same as Company State ({COMPANY_STATE}): Amount × GST Rate ÷ 2 for CGST and SGST
                </li>
                <li>
                  • If Customer State is different from Company State: Amount × GST Rate for IGST (CGST and SGST = 0)
                </li>
                <li>
                  • Bag count is auto-calculated as: Quantity ÷ 25
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save size={18} />
              {isEditMode ? 'Update Order' : 'Save Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateOrder;
