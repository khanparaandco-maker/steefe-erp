import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, Upload, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const DispatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewMode = location.pathname.includes('/view/');
  const isEditMode = Boolean(id) && !isViewMode;
  
  const [orders, setOrders] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    transporter_id: '',
    lr_no: '',
    lr_date: '',
    invoice_no: '',
    invoice_date: '',
    lr_copy: null,
  });

  const [dispatchItems, setDispatchItems] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode || isViewMode) {
      fetchDispatchData();
    } else {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [ordersRes, transportersRes] = await Promise.all([
        apiService.getPendingOrders(),
        apiService.getTransporters(),
      ]);
      
      // Pending orders already filtered by backend
      const pendingOrders = ordersRes.data || [];
      setOrders(pendingOrders);
      setTransporters(transportersRes.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispatchData = async () => {
    try {
      const [dispatchRes, transportersRes] = await Promise.all([
        apiService.getDispatch(id),
        apiService.getTransporters(),
      ]);
      
      const dispatch = dispatchRes.data;
      setTransporters(transportersRes.data || []);
      
      // Populate form data - ensure dates are in YYYY-MM-DD format
      setFormData({
        order_id: dispatch.order_id,
        customer_name: dispatch.customer_name,
        dispatch_date: dispatch.dispatch_date ? dispatch.dispatch_date.split('T')[0] : '',
        transporter_id: dispatch.transporter_id?.toString() || '',
        lr_no: dispatch.lr_no || '',
        lr_date: dispatch.lr_date ? dispatch.lr_date.split('T')[0] : '',
        invoice_no: dispatch.invoice_no || '',
        invoice_date: dispatch.invoice_date ? dispatch.invoice_date.split('T')[0] : '',
        lr_copy: null,
      });
      
      // Fetch order details to show in readonly
      const orderRes = await apiService.getOrderById(dispatch.order_id);
      setSelectedOrder(orderRes.data);
      
      // Set dispatch items (readonly in edit mode) - map full item details
      if (dispatch.items && dispatch.items.length > 0) {
        const items = dispatch.items.map(item => ({
          id: item.order_item_id,
          item_id: item.item_id,
          item_name: item.item_name,
          quantity_ordered: parseFloat(item.ordered_quantity || 0),
          quantity_dispatched: parseFloat(item.quantity_dispatched), // Current dispatch qty (for display)
          current_dispatch: parseFloat(item.quantity_dispatched), // Store original dispatch qty
          balance_quantity: 0, // Will be calculated from order items
          new_dispatch: parseFloat(item.quantity_dispatched),
        }));
        setDispatchItems(items);
        
        // Fetch order items to get correct balance (excluding current dispatch)
        const orderItems = orderRes.data.items || [];
        const itemsWithBalance = items.map(dispatchItem => {
          const orderItem = orderItems.find(oi => oi.id === dispatchItem.id);
          if (orderItem) {
            // In edit mode: available = balance from view + current dispatch
            // This gives us: ordered - other_dispatches (excluding current)
            const availableQty = parseFloat(orderItem.balance_quantity || 0) + dispatchItem.current_dispatch;
            // other_dispatches = dispatched from view (includes current) - current dispatch
            const otherDispatches = parseFloat(orderItem.dispatched_quantity || 0) - dispatchItem.current_dispatch;
            return {
              ...dispatchItem,
              balance_quantity: availableQty,
              other_dispatches: otherDispatches, // Store for display
            };
          }
          return dispatchItem;
        });
        
        setDispatchItems(itemsWithBalance);
        setOrderItems(itemsWithBalance);
      }
      
    } catch (error) {
      showToast(error.message || 'Failed to fetch dispatch details', 'error');
      navigate('/orders/dispatches');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await apiService.getOrderById(orderId);
      const order = response.data;
      
      setSelectedOrder(order);
      setFormData(prev => ({
        ...prev,
        order_id: orderId,
        customer_name: order.customer_name,
        transporter_id: order.preferred_transporter_id?.toString() || '',
      }));
      
      // Fetch order items with balance
      const items = order.items || [];
      const itemsWithBalance = items.map(item => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item_name,
        quantity_ordered: parseFloat(item.quantity),
        quantity_dispatched: parseFloat(item.dispatched_quantity || 0),
        balance_quantity: parseFloat(item.balance_quantity || item.quantity),
        new_dispatch: '',
      })).filter(item => item.balance_quantity > 0); // Only show items with balance
      
      setOrderItems(itemsWithBalance);
      setDispatchItems(itemsWithBalance);
    } catch (error) {
      showToast(error.message || 'Failed to fetch order details', 'error');
    }
  };

  const handleOrderChange = (e) => {
    const orderId = e.target.value;
    setFormData(prev => ({ ...prev, order_id: orderId }));
    
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setSelectedOrder(null);
      setOrderItems([]);
      setDispatchItems([]);
      setFormData(prev => ({ ...prev, customer_name: '' }));
    }
    
    if (errors.order_id) {
      setErrors(prev => ({ ...prev, order_id: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, lr_copy: file }));
    }
  };

  const handleDispatchQuantityChange = (itemId, value) => {
    setDispatchItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newDispatch = parseFloat(value) || 0;
          const balanceQty = item.balance_quantity;
          
          // Validate that new dispatch doesn't exceed balance
          if (newDispatch > balanceQty) {
            showToast(`Dispatch quantity cannot exceed balance quantity (${balanceQty})`, 'error');
            return { ...item, new_dispatch: balanceQty.toString() };
          }
          
          return { ...item, new_dispatch: value };
        }
        return item;
      })
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.order_id) {
      newErrors.order_id = 'Order is required';
    }
    if (!formData.dispatch_date) {
      newErrors.dispatch_date = 'Dispatch date is required';
    }
    if (!formData.invoice_no) {
      newErrors.invoice_no = 'Invoice number is required';
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }

    // Validate at least one item has dispatch quantity
    const hasValidDispatch = dispatchItems.some(
      item => item.new_dispatch && parseFloat(item.new_dispatch) > 0
    );
    
    if (!hasValidDispatch) {
      newErrors.items = 'At least one item must have dispatch quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditMode) {
        // Update dispatch with items
        const itemsToDispatch = dispatchItems
          .filter(item => item.new_dispatch && parseFloat(item.new_dispatch) > 0)
          .map(item => ({
            order_item_id: item.id,
            quantity_dispatched: parseFloat(item.new_dispatch),
          }));

        const updateData = {
          dispatch_date: formData.dispatch_date,
          transporter_id: formData.transporter_id ? parseInt(formData.transporter_id) : null,
          lr_no: formData.lr_no || null,
          lr_date: formData.lr_date || null,
          invoice_no: formData.invoice_no,
          invoice_date: formData.invoice_date,
          items: itemsToDispatch,
        };

        await apiService.updateDispatch(id, updateData);
        showToast('Dispatch updated successfully', 'success');
        navigate('/orders/dispatches');
      } else {
        // Create new dispatch
        const itemsToDispatch = dispatchItems
          .filter(item => item.new_dispatch && parseFloat(item.new_dispatch) > 0)
          .map(item => ({
            order_item_id: item.id,
            quantity_dispatched: parseFloat(item.new_dispatch),
          }));

        const dispatchData = {
          order_id: parseInt(formData.order_id),
          dispatch_date: formData.dispatch_date,
          transporter_id: formData.transporter_id ? parseInt(formData.transporter_id) : null,
          lr_no: formData.lr_no || null,
          lr_date: formData.lr_date || null,
          invoice_no: formData.invoice_no,
          invoice_date: formData.invoice_date,
          items: itemsToDispatch,
        };

        await apiService.createDispatch(dispatchData);
        showToast('Dispatch created successfully', 'success');
        
        // Send WhatsApp notification if customer has mobile number
        if (selectedOrder?.customer_mobile) {
          try {
            const transporter = transporters.find(t => t.id === parseInt(formData.transporter_id));
            const dispatchedItems = dispatchItems
              .filter(item => item.new_dispatch && parseFloat(item.new_dispatch) > 0);
            
            const whatsappData = {
              order_no: selectedOrder.order_no,
              challan_no: formData.invoice_no,
              dispatch_date: formData.dispatch_date,
              item_name: dispatchedItems[0]?.item_name || 'Items',
              bags_dispatched: dispatchedItems.reduce((sum, item) => sum + parseFloat(item.new_dispatch), 0),
              transporter_name: transporter?.name || 'N/A',
              vehicle_no: 'N/A', // Can be added to form if needed
              lr_no: formData.lr_no || 'N/A'
            };

            await axios.post(`${API_URL}/whatsapp/send-dispatch`, {
              phoneNumber: selectedOrder.customer_mobile,
              dispatchData: whatsappData
            });
            
            showToast('WhatsApp notification sent to customer', 'success');
          } catch (whatsappError) {
            console.error('WhatsApp notification failed:', whatsappError);
            // Don't fail the dispatch if WhatsApp fails
          }
        }
        
        // Reset form
        setFormData({
          order_id: '',
          customer_name: '',
          dispatch_date: new Date().toISOString().split('T')[0],
          transporter_id: '',
          lr_no: '',
          lr_date: '',
          invoice_no: '',
          invoice_date: '',
          lr_copy: null,
        });
        setSelectedOrder(null);
        setOrderItems([]);
        setDispatchItems([]);
        
        // Refresh pending orders
        fetchData();
      }
    } catch (error) {
      showToast(error.message || `Failed to ${isEditMode ? 'update' : 'create'} dispatch`, 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isViewMode ? 'View Dispatch Details' : (isEditMode ? 'Edit Dispatch Details' : 'Dispatch Details')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isViewMode 
            ? 'View dispatch information and dispatched items'
            : (isEditMode 
              ? 'Update dispatch header information (invoice, LR details)' 
              : 'Add dispatch details for customer order. Partial order dispatch allowed until order item is fulfilled.')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order No {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                {(isEditMode || isViewMode) ? (
                  <input
                    type="text"
                    value={selectedOrder?.order_no || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <>
                    <select
                      name="order_id"
                      value={formData.order_id}
                      onChange={handleOrderChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.order_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Pending Order</option>
                      {orders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.order_no} - {order.customer_name}
                        </option>
                      ))}
                    </select>
                    {errors.order_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.order_id}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Dropdown from Pending Order List (Note No 1)
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Auto populated as per order details</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch Date {!isViewMode && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  name="dispatch_date"
                  value={formData.dispatch_date}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${
                    errors.dispatch_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dispatch_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.dispatch_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          {selectedOrder && (
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
              <h2 className="text-lg font-semibold mb-4">
                {isViewMode ? 'Dispatched Items' : (isEditMode ? 'Edit Dispatched Items' : 'Order Items')}
              </h2>
              
              {errors.items && (
                <p className="text-red-500 text-sm mb-4">{errors.items}</p>
              )}

              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                      Sr No
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                      Item
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                      QTY Ordered
                    </th>
                    {(isEditMode || isViewMode) && (
                      <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                        Other Dispatches
                      </th>
                    )}
                    {!isEditMode && !isViewMode && (
                      <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                        QTY Dispatched
                      </th>
                    )}
                    {!isViewMode && (
                      <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                        {isEditMode ? 'Available QTY' : 'Balance QTY'}
                      </th>
                    )}
                    <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                      {isViewMode ? 'Dispatched QTY' : (isEditMode ? 'New Dispatch QTY' : 'New Dispatch QTY')} {!isViewMode && <span className="text-red-500">*</span>}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        {item.item_name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                        {item.quantity_ordered.toFixed(3)}
                      </td>
                      {(isEditMode || isViewMode) && (
                        <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                          {(item.other_dispatches || 0).toFixed(3)}
                        </td>
                      )}
                      {!isEditMode && !isViewMode && (
                        <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                          {item.quantity_dispatched.toFixed(3)}
                        </td>
                      )}
                      {!isViewMode && (
                        <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-orange-600">
                          {item.balance_quantity.toFixed(3)}
                        </td>
                      )}
                      <td className="border border-gray-300 px-4 py-2">
                        {isViewMode ? (
                          <span className="text-sm text-right block font-semibold text-blue-600">
                            {parseFloat(item.new_dispatch).toFixed(3)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.new_dispatch}
                            onChange={(e) => handleDispatchQuantityChange(item.id, e.target.value)}
                            placeholder="0.000"
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isEditMode && !isViewMode && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Auto populate all items and ordered qty from order details. 
                    All partial qty dispatched earlier should be shown here. Qty Order Less Partial Dispatched shows the balance quantity.
                  </p>
                </div>
              )}
              {isEditMode && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>Note:</strong> You can update dispatch quantities and header information. Changes will update the order balance accordingly.
                  </p>
                </div>
              )}
              {isViewMode && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> This is a read-only view of the dispatch record. Use the Edit button to make changes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dispatch Details */}
          {selectedOrder && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Dispatch Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transporter Name
                  </label>
                  <select
                    name="transporter_id"
                    value={formData.transporter_id}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select Transporter</option>
                    {transporters.map(transporter => (
                      <option key={transporter.id} value={transporter.id}>
                        {transporter.transporter_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">As per Transporter Master</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LR No
                  </label>
                  <input
                    type="text"
                    name="lr_no"
                    value={formData.lr_no}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    placeholder="Enter LR number"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LR Date
                  </label>
                  <input
                    type="date"
                    name="lr_date"
                    value={formData.lr_date}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice No {!isViewMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="invoice_no"
                    value={formData.invoice_no}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    placeholder="Enter invoice number"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${
                      errors.invoice_no ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.invoice_no && (
                    <p className="text-red-500 text-sm mt-1">{errors.invoice_no}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date {!isViewMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    name="invoice_date"
                    value={formData.invoice_date}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${
                      errors.invoice_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.invoice_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.invoice_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload LR Copy
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="lr-upload"
                    />
                    <label
                      htmlFor="lr-upload"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Upload size={18} />
                      {formData.lr_copy ? formData.lr_copy.name : 'Choose File'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedOrder && !isViewMode && (
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    order_id: '',
                    customer_name: '',
                    dispatch_date: new Date().toISOString().split('T')[0],
                    transporter_id: '',
                    lr_no: '',
                    lr_date: '',
                    invoice_no: '',
                    invoice_date: '',
                    lr_copy: null,
                  });
                  setSelectedOrder(null);
                  setOrderItems([]);
                  setDispatchItems([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Save size={18} />
                Save Dispatch
              </button>
            </div>
          )}
        </form>
      )}

      {/* Note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-900">
          <strong>Note 1:</strong> Pending order means Item Ordered Less Item Dispatched. If customer placed three items 
          and dispatched qty is less than ordered item, then this will be a pending order. Further we need to check this 
          for each item order. When all item orders are dispatched, then this order will be marked as completed. Multiple 
          entries shall be allowed and stored separately.
        </p>
      </div>
    </div>
  );
};

export default DispatchDetails;
