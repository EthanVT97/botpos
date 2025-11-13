import React, { useState, useEffect } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api/api';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'productname', headerName: 'Product Name', width: 150 },
  { field: 'productmyanname', headerName: 'Product Myanmar Name', width: 200 },
  { field: 'category', headerName: 'Category', width: 150 },
  { field: 'price', headerName: 'Price', type: 'number', width: 150 },
  { field: 'stock', headerName: 'Stock Quantity', type: 'number', width: 120 },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    renderCell: (params) => {
      return (
        <Stack direction="row" spacing={1}>
          <IconButton aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Stack>
      );
    },
  },
];

const rows = [
  { id: 1, productname: "Coffee", productmyanname: 'Snow', category: 'Category One', price: 35000, stock: 10 },
  { id: 2, productname: "Tea Mix", productmyanname: 'Snow', category: 'Category One', price: 35000, stock: 10 },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', name_mm: '', description: '', price: '', cost: '',
    category_id: '', sku: '', barcode: '', stock_quantity: '', image_url: ''
  });
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '', name_mm: '', description: '', price: '', cost: '',
        category_id: '', sku: '', barcode: '', stock_quantity: '', image_url: ''
      });
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.name_mm && p.name_mm.includes(searchTerm)) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Products / ကုန်ပစ္စည်းများ</h1>
        <p className="page-subtitle">Manage your product inventory</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            {/* <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              className="input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            /> */}
          </div>
          <Button variant="contained" onClick={() => { setShowModal(true); setEditingProduct(null); }} startIcon={<AddIcon />}>
            Add Product
          </Button>
        </div>
        <DataGrid
          rows={rows}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          pagination
        />
        {/* <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Myanmar Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.name_mm}</td>
                <td>{product.categories?.name}</td>
                <td>{product.price} Ks</td>
                <td>
                  <span className={`badge ${product.stock_quantity <= 10 ? 'badge-warning' : 'badge-success'}`}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '8px', padding: '6px 12px' }} onClick={() => handleEdit(product)}>
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(product.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table> */}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Myanmar Name</label>
                <input className="input" value={formData.name_mm} onChange={(e) => setFormData({ ...formData, name_mm: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="input" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input type="number" className="input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost</label>
                  <input type="number" className="input" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="input" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input type="number" className="input" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
