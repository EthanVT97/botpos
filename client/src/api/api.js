import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const searchProducts = (query) => api.get(`/products/search/${query}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Customers
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
export const searchCustomers = (query) => api.get(`/customers/search/${query}`);

// Orders
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Inventory
export const getInventoryMovements = () => api.get('/inventory/movements');
export const addInventoryMovement = (data) => api.post('/inventory/movements', data);
export const getLowStock = () => api.get('/inventory/low-stock');

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
export const getChatSessions = () => api.get('/chat/sessions');
export const getChatMessages = (customerId) => api.get(`/chat/messages/${customerId}`);
export const sendChatMessage = (data) => api.post('/chat/send', data);
export const markMessagesRead = (customerId) => api.post(`/chat/mark-read/${customerId}`);
export const getUnreadCount = () => api.get('/chat/unread-count');
export const closeChatSession = (customerId) => api.post(`/chat/sessions/${customerId}/close`);

// UOM (Unit of Measure)
export const getUOMs = () => api.get('/uom');
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

export default api;
