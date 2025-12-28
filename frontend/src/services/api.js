import axios from 'axios';

// Create axios instance with default config
// Use production URL on Render, localhost for development
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : '/api'; // Same domain in production

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message, status: error.response?.status });
  }
);

// API methods
export const apiService = {
  // Suppliers
  getSuppliers: () => api.get('/suppliers'),
  getSupplier: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (data) => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),

  // Categories
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  // UOM
  getUOMs: () => api.get('/uom'),
  getUOM: (id) => api.get(`/uom/${id}`),
  createUOM: (data) => api.post('/uom', data),
  updateUOM: (id, data) => api.put(`/uom/${id}`, data),
  deleteUOM: (id) => api.delete(`/uom/${id}`),

  // GST Rates
  getGSTRates: () => api.get('/gst-rates'),
  getGSTRate: (id) => api.get(`/gst-rates/${id}`),
  createGSTRate: (data) => api.post('/gst-rates', data),
  updateGSTRate: (id, data) => api.put(`/gst-rates/${id}`, data),
  deleteGSTRate: (id) => api.delete(`/gst-rates/${id}`),

  // Items
  getItems: () => api.get('/items'),
  getItem: (id) => api.get(`/items/${id}`),
  createItem: (data) => api.post('/items', data),
  updateItem: (id, data) => api.put(`/items/${id}`, data),
  deleteItem: (id) => api.delete(`/items/${id}`),

  // Transporters
  getTransporters: () => api.get('/transporters'),
  getTransporter: (id) => api.get(`/transporters/${id}`),
  createTransporter: (data) => api.post('/transporters', data),
  updateTransporter: (id, data) => api.put(`/transporters/${id}`, data),
  deleteTransporter: (id) => api.delete(`/transporters/${id}`),

  // Customers
  getCustomers: () => api.get('/customers'),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),

  // Orders
  getOrders: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/orders${queryString}`);
  },
  getOrder: (id) => api.get(`/orders/${id}`),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrder: (id, data) => api.put(`/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  getPendingOrders: () => api.get('/orders/status/pending'),

  // Dispatches
  getDispatches: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/dispatches${queryString}`);
  },
  getDispatch: (id) => api.get(`/dispatches/${id}`),
  createDispatch: (data) => api.post('/dispatches', data),
  updateDispatch: (id, data) => api.put(`/dispatches/${id}`, data),
  deleteDispatch: (id) => api.delete(`/dispatches/${id}`),
  getOrderDispatches: (orderId) => api.get(`/dispatches?order_id=${orderId}`),

  // Settings
  getSettings: () => api.get('/settings/company'),
  updateSettings: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (data[key] instanceof File) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return api.put('/settings/company', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Scrap GRN
  getScrapGRNs: (params) => {
    if (params) {
      // Filter out empty values
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/scrap-grn${queryString}`);
    }
    return api.get('/scrap-grn');
  },
  getScrapGRN: (id) => api.get(`/scrap-grn/${id}`),
  createScrapGRN: (data) => {
    // Create FormData for file upload support
    const formData = new FormData();
    
    // Add basic fields
    Object.keys(data).forEach(key => {
      if (key !== 'items' && key !== 'uploads' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // Add items as JSON
    if (data.items) {
      formData.append('items', JSON.stringify(data.items));
    }
    
    // Add file uploads
    if (data.uploads) {
      Object.keys(data.uploads).forEach(category => {
        const files = data.uploads[category];
        if (Array.isArray(files)) {
          files.forEach(file => {
            formData.append(category, file);
          });
        }
      });
    }
    
    return api.post('/scrap-grn', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateScrapGRN: (id, data) => {
    // Create FormData for file upload support
    const formData = new FormData();
    
    // Add basic fields
    Object.keys(data).forEach(key => {
      if (key !== 'items' && key !== 'uploads' && data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // Add items as JSON
    if (data.items) {
      formData.append('items', JSON.stringify(data.items));
    }
    
    // Add file uploads
    if (data.uploads) {
      Object.keys(data.uploads).forEach(category => {
        const files = data.uploads[category];
        if (Array.isArray(files)) {
          files.forEach(file => {
            formData.append(category, file);
          });
        }
      });
    }
    
    return api.put(`/scrap-grn/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteScrapGRN: (id) => api.delete(`/scrap-grn/${id}`),
  deleteScrapGRNUpload: (grnId, uploadId) => api.delete(`/scrap-grn/${grnId}/upload/${uploadId}`),
  getRawMaterialItems: () => api.get('/scrap-grn/items/raw-materials'),

  // Melting Processes
  getMeltingProcesses: (params) => {
    if (params) {
      // Filter out empty values
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/melting-processes${queryString}`);
    }
    return api.get('/melting-processes');
  },
  getMeltingProcess: (id) => api.get(`/melting-processes/${id}`),
  createMeltingProcess: (data) => api.post('/melting-processes', data),
  updateMeltingProcess: (id, data) => api.put(`/melting-processes/${id}`, data),
  deleteMeltingProcess: (id) => api.delete(`/melting-processes/${id}`),

  // Heat Treatment
  getHeatTreatments: (params) => {
    if (params) {
      // Filter out empty values
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/heat-treatment${queryString}`);
    }
    return api.get('/heat-treatment');
  },
  getHeatTreatment: (id) => api.get(`/heat-treatment/${id}`),
  createHeatTreatment: (data) => api.post('/heat-treatment', data),
  updateHeatTreatment: (id, data) => api.put(`/heat-treatment/${id}`, data),
  deleteHeatTreatment: (id) => api.delete(`/heat-treatment/${id}`),

  // Stock Reports
  getRawMaterialStock: (params) => {
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/stock-reports/raw-material${queryString}`);
    }
    return api.get('/stock-reports/raw-material');
  },
  getMaterialConsumption: (params) => {
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/stock-reports/consumption${queryString}`);
    }
    return api.get('/stock-reports/consumption');
  },
  getWIPStock: (params) => {
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/stock-reports/wip${queryString}`);
    }
    return api.get('/stock-reports/wip');
  },
  getProductionReport: (params) => {
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/stock-reports/production${queryString}`);
    }
    return api.get('/stock-reports/production');
  },
  getFinishedGoodsStock: (params) => {
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/stock-reports/finished-goods${queryString}`);
    }
    return api.get('/stock-reports/finished-goods');
  },
  getStockMovement: (params) => {
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      const queryString = Object.keys(filteredParams).length > 0 
        ? '?' + new URLSearchParams(filteredParams).toString() 
        : '';
      return api.get(`/stock-reports/movement${queryString}`);
    }
    return api.get('/stock-reports/movement');
  },

  // Company Settings
  getCompanySettings: () => api.get('/settings/company'),

  // User Management
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles/all'),
  getModules: () => api.get('/users/modules/all'),
  getUserPermissions: (userId) => api.get(`/users/${userId}/permissions`),
  updateUserPermissions: (userId, data) => api.put(`/users/${userId}/permissions`, data),
};

// Export both the axios instance and the apiService
export { api as axiosInstance };
export default apiService;
