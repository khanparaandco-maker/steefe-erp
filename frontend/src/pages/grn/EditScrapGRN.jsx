import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, Trash2, Upload, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { API_BASE_URL } from '../../utils/constants';

const EditScrapGRN = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterialItems, setRawMaterialItems] = useState([]);
  const [companyState, setCompanyState] = useState('');
  const [grnNo, setGrnNo] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_no: '',
    invoice_date: '',
    vehicle_no: '',
    packing_forwarding: 0,
  });
  
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  
  const [existingFiles, setExistingFiles] = useState([]);
  const [files, setFiles] = useState({
    invoice_copy: [],
    weight_bridge: [],
    materials_photos: [],
    other_documents: []
  });

  useEffect(() => {
    if (id) {
      fetchInitialData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch data sequentially for reliability
      const suppliersRes = await apiService.getSuppliers();
      const itemsRes = await fetch(`${API_BASE_URL}/api/scrap-grn/items/raw-materials`).then(r => r.json());
      const settingsRes = await apiService.getSettings();
      const grnRes = await apiService.getScrapGRN(id);
      
      console.log('=== FETCH RESPONSES ===');
      console.log('Suppliers Response:', suppliersRes);
      console.log('Items Response:', itemsRes);
      console.log('Settings Response:', settingsRes);
      console.log('GRN Response:', grnRes);
      
      // Set suppliers
      if (suppliersRes && suppliersRes.data) {
        setSuppliers(suppliersRes.data);
        console.log('Suppliers set:', suppliersRes.data.length);
      }
      
      // Set raw materials
      if (itemsRes && itemsRes.data) {
        setRawMaterialItems(itemsRes.data);
        console.log('Items set:', itemsRes.data.length);
      }
      
      // Set company state
      if (settingsRes && settingsRes.state) {
        setCompanyState(settingsRes.state);
        console.log('Company state set:', settingsRes.state);
      }
      
      // Set GRN data
      if (grnRes && grnRes.data) {
        const grnData = grnRes.data;
        console.log('=== GRN DATA ===', grnData);
        
        setGrnNo(grnData.grn_no || '');
        
        setFormData({
          supplier_id: String(grnData.supplier_id || ''),
          invoice_no: grnData.invoice_no || '',
          invoice_date: grnData.invoice_date ? grnData.invoice_date.split('T')[0] : '',
          vehicle_no: grnData.vehicle_no || '',
          packing_forwarding: parseFloat(grnData.packing_forwarding) || 0,
        });
        
        if (grnData.items && grnData.items.length > 0) {
          const mappedItems = grnData.items.map((item, index) => ({
            id: item.id || Date.now() + index,
            item_id: String(item.item_id || ''),
            quantity: String(item.quantity || ''),
            rate: String(item.rate || ''),
            amount: parseFloat(item.amount) || 0,
            gst_rate: parseFloat(item.gst_rate) || 0,
            gst_amount: parseFloat(item.gst_amount) || 0
          }));
          setItems(mappedItems);
          console.log('Items set:', mappedItems.length, mappedItems);
        }
        
        if (grnData.uploads) {
          setExistingFiles(grnData.uploads);
          console.log('Files set:', grnData.uploads.length);
        }
        
        setDataLoaded(true);
        console.log('=== DATA LOAD COMPLETE ===');
      }
    } catch (error) {
      console.error('=== ERROR ===', error);
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

  const handleFileChange = (fileType, selectedFiles) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: Array.from(selectedFiles)
    }));
  };

  const handleRemoveFile = (fileType, index) => {
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  };

  const handleRemoveExistingFile = async (uploadId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await apiService.deleteScrapGRNUpload(id, uploadId);
        setExistingFiles(prev => prev.filter(f => f.id !== uploadId));
        showToast('File deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete file', 'error');
      }
    }
  };

  const calculateTotals = () => {
    const packingForwarding = parseFloat(formData.packing_forwarding) || 0;
    
    let itemsTotal = 0;
    let totalItemGst = 0;
    
    items.forEach(item => {
      const itemAmount = parseFloat(item.amount) || 0;
      const gstRate = parseFloat(item.gst_rate) || 0;
      itemsTotal += itemAmount;
      const itemGst = (itemAmount * gstRate) / 100;
      totalItemGst += itemGst;
    });
    
    const packingGst = (packingForwarding * 18) / 100;
    const totalGst = totalItemGst + packingGst;
    const totalAmount = itemsTotal + packingForwarding;
    
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
    
    if (!formData.supplier_id) newErrors.supplier_id = 'Supplier is required';
    if (!formData.invoice_no) newErrors.invoice_no = 'Invoice number is required';
    if (!formData.invoice_date) newErrors.invoice_date = 'Invoice date is required';
    if (items.length === 0) newErrors.items = 'At least one item is required';
    
    items.forEach((item, index) => {
      if (!item.item_id) newErrors[`item_${index}`] = 'Item is required';
      if (!item.quantity || parseFloat(item.quantity) <= 0) newErrors[`quantity_${index}`] = 'Valid quantity is required';
      if (!item.rate || parseFloat(item.rate) <= 0) newErrors[`rate_${index}`] = 'Valid rate is required';
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
      
      const itemsData = items.map(item => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount),
        gst_rate: parseFloat(item.gst_rate) || 0,
        gst_amount: (parseFloat(item.amount) * (parseFloat(item.gst_rate) || 0)) / 100
      }));
      formDataToSend.append('items', JSON.stringify(itemsData));
      
      Object.entries(files).forEach(([fileType, fileList]) => {
        fileList.forEach(file => {
          formDataToSend.append(fileType, file);
        });
      });
      
      const response = await fetch(`${API_BASE_URL}/api/scrap-grn/${id}`, {
        method: 'PUT',
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showToast('Scrap GRN updated successfully', 'success');
        navigate('/grn/scrap-list');
      } else {
        showToast(result.message || 'Failed to update Scrap GRN', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Failed to update Scrap GRN', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const totals = calculateTotals();
  const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplier_id));
  const supplierState = selectedSupplier?.state?.trim().toLowerCase() || '';
  const companyStateLower = companyState?.trim().toLowerCase() || '';
  const isIGST = selectedSupplier && supplierState !== companyStateLower;

  if (loading || !dataLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Scrap GRN</h1>
          <p className="text-sm text-gray-500 mt-1">Update Goods Receipt Note for Scrap/Raw Materials</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">GRN Number</p>
          <p className="text-xl font-bold text-blue-600">{grnNo}</p>
        </div>
      </div>

      {/* Debug Info - Remove after testing */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm font-semibold">Debug Info:</p>
        <p className="text-xs">Suppliers: {suppliers.length}</p>
        <p className="text-xs">Items: {items.length}</p>
        <p className="text-xs">Supplier ID: {formData.supplier_id}</p>
        <p className="text-xs">Invoice No: {formData.invoice_no}</p>
        <p className="text-xs">Invoice Date: {formData.invoice_date}</p>
        <p className="text-xs">Data Loaded: {dataLoaded ? 'Yes' : 'No'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_name} - {supplier.state}
                  </option>
                ))}
              </select>
              {errors.supplier_id && <p className="text-red-500 text-xs mt-1">{errors.supplier_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoice_no"
                value={formData.invoice_no}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.invoice_no ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter invoice number"
              />
              {errors.invoice_no && <p className="text-red-500 text-xs mt-1">{errors.invoice_no}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.invoice_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.invoice_date && <p className="text-red-500 text-xs mt-1">{errors.invoice_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle No
              </label>
              <input
                type="text"
                name="vehicle_no"
                value={formData.vehicle_no}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter vehicle number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Packing & Forwarding
              </label>
              <input
                type="number"
                name="packing_forwarding"
                value={formData.packing_forwarding}
                onChange={handleInputChange}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">GST @ 18% will be applied</p>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Items</h2>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Item
            </button>
          </div>

          {errors.items && <p className="text-red-500 text-sm mb-3">{errors.items}</p>}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Item Name</th>
                  <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                  <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Rate</th>
                  <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">Amount</th>
                  <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">GST%</th>
                  <th className="border border-gray-200 p-2 text-left text-sm font-medium text-gray-700">GST Amt</th>
                  <th className="border border-gray-200 p-2 text-center text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-200 p-2">
                      <select
                        value={item.item_id}
                        onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                        className={`w-full p-1 border rounded ${
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
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        step="0.01"
                        className={`w-full p-1 border rounded ${
                          errors[`quantity_${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                        step="0.01"
                        className={`w-full p-1 border rounded ${
                          errors[`rate_${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={item.amount.toFixed(2)}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={item.gst_rate}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-200 p-2">
                      <input
                        type="text"
                        value={((item.amount * item.gst_rate) / 100).toFixed(2)}
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded bg-gray-50"
                      />
                    </td>
                    <td className="border border-gray-200 p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
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

        {/* Totals Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Total:</span>
                <span className="font-semibold">₹{totals.itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Packing & Forwarding:</span>
                <span className="font-semibold">₹{totals.packingForwarding.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">₹{totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              {isIGST ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">IGST:</span>
                  <span className="font-semibold">₹{totals.igst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CGST:</span>
                    <span className="font-semibold">₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST:</span>
                    <span className="font-semibold">₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-800">Invoice Total:</span>
                <span className="text-lg font-bold text-blue-600">₹{totals.invoiceTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Files */}
        {existingFiles.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Existing Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{file.file_type.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{file.file_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload New Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['invoice_copy', 'weight_bridge', 'materials_photos', 'other_documents'].map(fileType => (
              <div key={fileType}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {fileType.replace(/_/g, ' ').toUpperCase()}
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500">
                      <Upload size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-600">Choose Files</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(fileType, e.target.files)}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                  </label>
                </div>
                {files[fileType].length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files[fileType].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(fileType, index)}
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            disabled={loading}
          >
            <Save size={20} />
            {loading ? 'Updating...' : 'Update GRN'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditScrapGRN;
