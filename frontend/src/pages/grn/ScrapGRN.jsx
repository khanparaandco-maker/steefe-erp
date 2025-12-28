import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Upload, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showToast } from '../../utils/helpers';
import { API_BASE_URL } from '../../utils/constants';

const ScrapGRN = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterialItems, setRawMaterialItems] = useState([]);
  const [companyState, setCompanyState] = useState('');
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    vehicle_no: '',
    packing_forwarding: 0,
  });
  
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  
  const [files, setFiles] = useState({
    invoice_copy: [],
    weight_bridge: [],
    materials_photos: [],
    other_documents: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, itemsRes, settingsRes] = await Promise.all([
        apiService.getSuppliers(),
        fetch(`${API_BASE_URL}/api/scrap-grn/items/raw-materials`).then(r => r.json()),
        apiService.getSettings()
      ]);
      
      setSuppliers(suppliersRes.data || []);
      setRawMaterialItems(itemsRes.data || []);
      setCompanyState(settingsRes.state || '');
    } catch (error) {
      showToast(error.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddRow = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      item_id: '',
      quantity: '',
      rate: '',
      amount: 0,
      gst_rate: 0,
      gst_amount: 0
    }]);
  };

  const handleRemoveRow = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // If item is selected, populate GST rate
        if (field === 'item_id' && value) {
          const selectedItem = rawMaterialItems.find(i => i.id === parseInt(value));
          if (selectedItem) {
            updated.gst_rate = selectedItem.gst_rate || 0;
          }
        }
        
        // Calculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updated.quantity) || 0;
          const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(updated.rate) || 0;
          updated.amount = qty * rate;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const handleFileChange = (fileType, e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...newFiles]
    }));
  };

  const handleRemoveFile = (fileType, index) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const packingForwarding = parseFloat(formData.packing_forwarding) || 0;
    
    // Calculate GST on each item
    let totalItemGst = 0;
    items.forEach(item => {
      const itemAmount = parseFloat(item.amount) || 0;
      const gstRate = parseFloat(item.gst_rate) || 0;
      const itemGst = (itemAmount * gstRate) / 100;
      totalItemGst += itemGst;
    });
    
    // Calculate GST on packing & forwarding (18% fixed)
    const packingGst = (packingForwarding * 18) / 100;
    
    const totalGst = totalItemGst + packingGst;
    const totalAmount = itemsTotal + packingForwarding;
    
    // Check if supplier state is different from company state
    const supplier = suppliers.find(s => s.id === parseInt(formData.supplier_id));
    const supplierState = supplier?.state?.trim().toLowerCase() || '';
    const companyStateLower = companyState?.trim().toLowerCase() || '';
    const isIGST = supplier && supplierState !== companyStateLower;
    
    return {
      itemsTotal,
      packingForwarding,
      totalAmount,
      cgst: isIGST ? 0 : totalGst / 2,
      sgst: isIGST ? 0 : totalGst / 2,
      igst: isIGST ? totalGst : 0,
      invoiceTotal: totalAmount + totalGst
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }
    if (!formData.invoice_no) {
      newErrors.invoice_no = 'Invoice number is required';
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }
    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    
    items.forEach((item, index) => {
      if (!item.item_id) {
        newErrors[`item_${index}`] = 'Item is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`quantity_${index}`] = 'Valid quantity is required';
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        newErrors[`rate_${index}`] = 'Valid rate is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const totals = calculateTotals();
      const formDataToSend = new FormData();
      
      // Append basic fields
      formDataToSend.append('supplier_id', formData.supplier_id);
      formDataToSend.append('invoice_no', formData.invoice_no);
      formDataToSend.append('invoice_date', formData.invoice_date);
      formDataToSend.append('vehicle_no', formData.vehicle_no || '');
      formDataToSend.append('packing_forwarding', totals.packingForwarding);
      formDataToSend.append('total_amount', totals.totalAmount);
      formDataToSend.append('cgst', totals.cgst);
      formDataToSend.append('sgst', totals.sgst);
      formDataToSend.append('igst', totals.igst);
      formDataToSend.append('invoice_total', totals.invoiceTotal);
      
      // Append items
      const itemsData = items.map(item => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount),
        gst_rate: parseFloat(item.gst_rate) || 0,
        gst_amount: (parseFloat(item.amount) * (parseFloat(item.gst_rate) || 0)) / 100
      }));
      formDataToSend.append('items', JSON.stringify(itemsData));
      
      // Append files
      Object.entries(files).forEach(([fileType, fileList]) => {
        fileList.forEach(file => {
          formDataToSend.append(fileType, file);
        });
      });
      
      const response = await fetch(`${API_BASE_URL}/api/scrap-grn`, {
        method: 'POST',
        body: formDataToSend
      });
      
      const result = await response.json();
      
      console.log('Response:', response.status, result);
      
      if (response.ok && result.success) {
        showToast('Scrap GRN created successfully', 'success');
        navigate('/grn/scrap-list');
      } else {
        showToast(result.message || 'Failed to create Scrap GRN', 'error');
      }
    } catch (error) {
      console.error('Error creating Scrap GRN:', error);
      showToast(error.message || 'Failed to create Scrap GRN', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplier_id));
  const supplierState = selectedSupplier?.state?.trim().toLowerCase() || '';
  const companyStateLower = companyState?.trim().toLowerCase() || '';
  const isIGST = selectedSupplier && supplierState !== companyStateLower;

  if (loading && suppliers.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Scrap GRN</h1>
        <p className="text-sm text-gray-500 mt-1">Goods Receipt Note for Scrap/Raw Materials</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">GRN Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="text-red-500 text-sm mt-1">{errors.supplier_id}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Dropdown from Supplier Master</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoice_no"
                value={formData.invoice_no}
                onChange={handleInputChange}
                placeholder="Enter invoice number"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoice_no ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.invoice_no && (
                <p className="text-red-500 text-sm mt-1">{errors.invoice_no}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoice_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.invoice_date && (
                <p className="text-red-500 text-sm mt-1">{errors.invoice_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle No
              </label>
              <input
                type="text"
                name="vehicle_no"
                value={formData.vehicle_no}
                onChange={handleInputChange}
                placeholder="Enter vehicle number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Items</h2>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Raw
            </button>
          </div>

          {errors.items && (
            <p className="text-red-500 text-sm mb-4">{errors.items}</p>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    Sr No
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    Item <span className="text-red-500">*</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    UOM
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    Qty <span className="text-red-500">*</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    Rate <span className="text-red-500">*</span>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const selectedItem = rawMaterialItems.find(i => i.id === parseInt(item.item_id));
                  return (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <select
                          value={item.item_id}
                          onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            errors[`item_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Item</option>
                          {rawMaterialItems.map(rawItem => (
                            <option key={rawItem.id} value={rawItem.id}>
                              {rawItem.item_name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Only items with category as Raw Materials
                        </p>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {selectedItem?.uom || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="number"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          placeholder="0.000"
                          className={`w-full px-2 py-1 border rounded text-sm text-right ${
                            errors[`quantity_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-2 py-1 border rounded text-sm text-right ${
                            errors[`rate_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">
                        ₹{(item.amount || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      No items added. Click "Add Raw" to add items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals and GST Calculation */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Totals & GST Calculation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Items Total:</span>
                <span className="text-sm font-semibold">₹{totals.itemsTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <label className="text-sm font-medium text-gray-700">Packing & Forwarding:</label>
                <input
                  type="number"
                  step="0.01"
                  name="packing_forwarding"
                  value={formData.packing_forwarding}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                />
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-bold text-gray-900">Total (A):</span>
                <span className="text-sm font-bold">₹{totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Debug info */}
              {selectedSupplier && (
                <div className="text-xs text-gray-500 py-1 border-b">
                  <div>Supplier: {selectedSupplier.supplier_name}</div>
                  <div>Supplier State: "{selectedSupplier.state}" (raw: {supplierState})</div>
                  <div>Company State: "{companyState}" (raw: {companyStateLower})</div>
                  <div>Is IGST: {isIGST ? 'Yes (Different States)' : 'No (Same State)'}</div>
                </div>
              )}
              
              {isIGST ? (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-gray-700">IGST (D):</span>
                  <span className="text-sm font-semibold">₹{totals.igst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">CGST (B):</span>
                    <span className="text-sm font-semibold">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">SGST (C):</span>
                    <span className="text-sm font-semibold">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded">
                <span className="text-base font-bold text-gray-900">Invoice Total:</span>
                <span className="text-base font-bold text-blue-600">
                  ₹{totals.invoiceTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> If Supplier State is other than Company State, Then IGST otherwise CGST and SGST.
              GST calculated as: Item GST Rate × Item Amount + Packing & Forwarding × 18%
            </p>
          </div>
        </div>

        {/* File Uploads */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries({
              invoice_copy: 'Invoice Copy',
              weight_bridge: 'Weight Bridge',
              materials_photos: 'Materials Photographs',
              other_documents: 'Other Documents'
            }).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => handleFileChange(key, e)}
                    className="hidden"
                    id={`upload-${key}`}
                  />
                  <label
                    htmlFor={`upload-${key}`}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload size={18} />
                    Choose Files
                  </label>
                </div>
                <p className="text-xs text-gray-500">Multiple files allowed</p>
                
                {files[key].length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files[key].map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(key, index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/grn/scrap-list')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save GRN'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScrapGRN;
