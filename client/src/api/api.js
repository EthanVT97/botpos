import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products
export const getProducts = () => api.get('/products', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() } // Cache busting
});
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const searchProducts = (query) => api.get(`/products/search/${query}`);

// Categories
export const getCategories = () => api.get('/categories', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Customers
export const getCustomers = () => api.get('/customers', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const searchCustomers = (query) => api.get(`/customers/search/${query}`);

// Orders
export const getOrders = () => api.get('/orders', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Inventory
export const getInventoryMovements = () => api.get('/inventory/movements', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const addInventoryMovement = (data) => api.post('/inventory/movements', data);
export const getLowStock = () => api.get('/inventory/low-stock', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});

// Sales & Reports
export const getSalesSummary = (params) => api.get('/sales/summary', { params });
export const getTopProducts = (limit) => api.get('/sales/top-products', { params: { limit } });
export const getDailySales = (date) => api.get('/reports/daily-sales', { params: { date } });
export const getMonthlySales = (month) => api.get('/reports/monthly-sales', { params: { month } });
export const getProductPerformance = (params) => api.get('/reports/product-performance', { params });

// Bot Configuration
export const getBotConfig = () => api.get('/bots/config');
export const setupTelegramBot = (data) => api.post('/bots/telegram/setup', data);
export const setupViberBot = (data) => api.post('/bots/viber/setup', data);
export const setupMessengerBot = (data) => api.post('/bots/messenger/setup', data);
export const testBotToken = (platform, token) => api.post(`/bots/test/${platform}`, { token });
export const getWebhookStatus = () => api.get('/bots/webhook/status');
export const deleteWebhook = (platform) => api.delete(`/bots/${platform}/webhook`);

// Chat
export const getChatSessions = () => api.get('/chat/sessions', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const getChatMessages = (customerId) => api.get(`/chat/messages/${customerId}`, { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const sendChatMessage = (data) => api.post('/chat/send', data);
export const markMessagesRead = (customerId) => api.post(`/chat/mark-read/${customerId}`);
export const getUnreadCount = () => api.get('/chat/unread-count', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const closeChatSession = (customerId) => api.post(`/chat/sessions/${customerId}/close`);

// UOM (Unit of Measure)
export const getUOMs = () => api.get('/uom', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const getUOM = (id) => api.get(`/uom/${id}`);
export const createUOM = (data) => api.post('/uom', data);
export const updateUOM = (id, data) => api.put(`/uom/${id}`, data);
export const deleteUOM = (id) => api.delete(`/uom/${id}`);
export const getProductUOMs = (productId) => api.get(`/uom/product/${productId}`);
export const addProductUOM = (data) => api.post('/uom/product', data);
export const updateProductUOM = (id, data) => api.put(`/uom/product/${id}`, data);
export const deleteProductUOM = (id) => api.delete(`/uom/product/${id}`);
export const getUOMConversions = () => api.get('/uom/conversions');
export const addUOMConversion = (data) => api.post('/uom/conversions', data);
export const convertUOMQuantity = (data) => api.post('/uom/convert', data);

// Stores
export const getStores = () => api.get('/stores', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const getStore = (id) => api.get(`/stores/${id}`);
export const createStore = (data) => api.post('/stores', data);
export const updateStore = (id, data) => api.put(`/stores/${id}`, data);
export const deleteStore = (id) => api.delete(`/stores/${id}`);
export const getStoreInventory = (storeId) => api.get(`/stores/${storeId}/inventory`, { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});

// Store Transfers
export const getStoreTransfers = () => api.get('/store-transfers', { 
  headers: { 'Cache-Control': 'no-cache' },
  params: { _t: Date.now() }
});
export const getStoreTransfer = (id) => api.get(`/store-transfers/${id}`);
export const createStoreTransfer = (data) => api.post('/store-transfers', data);
export const approveStoreTransfer = (id) => api.post(`/store-transfers/${id}/approve`);
export const completeStoreTransfer = (id) => api.post(`/store-transfers/${id}/complete`);
export const cancelStoreTransfer = (id) => api.post(`/store-transfers/${id}/cancel`);

// Selling Price
export const bulkUpdatePrices = (data) => api.post('/selling-price/bulk-update', data);
export const updateSellingPrice = (id, data) => api.put(`/selling-price/update/${id}`, data);
export const getPriceHistory = (productId) => api.get(`/selling-price/history/${productId}`);
export const exportPrices = (format = 'excel') => api.get('/selling-price/export', { 
  params: { format },
  responseType: 'blob' 
});
export const importPrices = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/selling-price/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const downloadImportTemplate = () => api.get('/selling-price/import-template', { 
  responseType: 'blob' 
});

export default api;
