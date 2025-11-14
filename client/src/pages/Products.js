import React, { useState, useEffect } from 'react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, getUOMs, getProductUOMs, addProductUOM, updateProductUOM, deleteProductUOM } from '../api/api';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import Select from 'react-select';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUOMs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showUOMModal, setShowUOMModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productUOMs, setProductUOMs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '', name_mm: '', description: '', price: '', cost: '',
    category_id: '', sku: '', barcode: '', stock_quantity: '', image_url: '', base_uom_id: ''
  });
  const [uomFormData, setUOMFormData] = useState({
    uom_id: '', is_base_uom: false, conversion_factor: 1, price: '', cost: '', barcode: ''
  });
  const [isClearable, setIsClearable] = useState(true);
  const [isSearchable, setIsSearchable] = useState(true);
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadUOMs();
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

  const loadUOMs = async () => {
    try {
      const res = await getUOMs();
      setUOMs(res.data.data || []);
    } catch (error) {
      console.error('Error loading UOMs:', error);
    }
  };

  const loadProductUOMs = async (productId) => {
    try {
      const res = await getProductUOMs(productId);
      setProductUOMs(res.data.data || []);
    } catch (error) {
      console.error('Error loading product UOMs:', error);
    }
  };

  const handleManageUOMs = (product) => {
    setSelectedProduct(product);
    loadProductUOMs(product.id);
    setShowUOMModal(true);
  };

  const handleAddProductUOM = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!uomFormData.uom_id) {
      alert('Please select a UOM');
      return;
    }
    
    if (!uomFormData.conversion_factor || uomFormData.conversion_factor <= 0) {
      alert('Please enter a valid conversion factor');
      return;
    }
    
    try {
      console.log('Adding product UOM:', {
        ...uomFormData,
        product_id: selectedProduct.id
      });
      
      const response = await addProductUOM({
        ...uomFormData,
        product_id: selectedProduct.id
      });
      
      console.log('UOM added successfully:', response);
      
      // Reload UOMs
      await loadProductUOMs(selectedProduct.id);
      
      // Reset form
      setUOMFormData({ uom_id: '', is_base_uom: false, conversion_factor: 1, price: '', cost: '', barcode: '' });
      
      // Show success message
      alert('UOM added successfully! ✅');
    } catch (error) {
      console.error('Error adding product UOM:', error);
      console.error('Error details:', error.response?.data);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteProductUOM = async (id) => {
    if (window.confirm('Remove this UOM from product?')) {
      try {
        await deleteProductUOM(id);
        loadProductUOMs(selectedProduct.id);
      } catch (error) {
        console.error('Error deleting product UOM:', error);
      }
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

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Product Name', width: 150 },
    { field: 'name_mm', headerName: 'Product Myanmar Name', width: 200 },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 150,
      valueGetter: (value, row) => row.categories?.name || ''
    },
    { field: 'price', headerName: 'Price', type: 'number', width: 120 },
    { field: 'stock_quantity', headerName: 'Stock', type: 'number', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => handleEdit(params.row)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleManageUOMs(params.row)} size="small" color="primary" title="Manage UOMs">
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>UOM</span>
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

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
          rows={filteredProducts}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          autoHeight
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Myanmar Name</label>
                  <input className="input" value={formData.name_mm} onChange={(e) => setFormData({ ...formData, name_mm: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <Select
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    value={categories.find(c => c.id === formData.category_id) ? { value: formData.category_id, label: categories.find(c => c.id === formData.category_id).name } : null}
                    onChange={(option) => setFormData({ ...formData, category_id: option?.value || '' })}
                    isClearable={isClearable}
                    isSearchable={isSearchable}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Base UOM</label>
                  <Select
                    options={uoms.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }))}
                    value={uoms.find(u => u.id === formData.base_uom_id) ? { value: formData.base_uom_id, label: uoms.find(u => u.id === formData.base_uom_id).name } : null}
                    onChange={(option) => setFormData({ ...formData, base_uom_id: option?.value || '' })}
                    isClearable={isClearable}
                    isSearchable={isSearchable}
                  />
                </div>
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

      {/* UOM Management Modal */}
      {showUOMModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowUOMModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage UOMs - {selectedProduct.name}</h2>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Add New UOM</h3>
              <form onSubmit={handleAddProductUOM}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
                  <div className="form-group">
                    <label className="form-label">UOM *</label>
                    <Select
                      options={uoms.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }))}
                      value={uoms.find(u => u.id === uomFormData.uom_id) ? { value: uomFormData.uom_id, label: uoms.find(u => u.id === uomFormData.uom_id).name } : null}
                      onChange={(option) => setUOMFormData({ ...uomFormData, uom_id: option?.value || '' })}
                      placeholder="Select UOM"
                      isClearable
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Factor *</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="input" 
                      value={uomFormData.conversion_factor} 
                      onChange={(e) => setUOMFormData({ ...uomFormData, conversion_factor: e.target.value })} 
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={uomFormData.price} 
                      onChange={(e) => setUOMFormData({ ...uomFormData, price: e.target.value })} 
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="small" 
                      fullWidth
                      disabled={!uomFormData.uom_id || !uomFormData.conversion_factor}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={uomFormData.is_base_uom} 
                      onChange={(e) => setUOMFormData({ ...uomFormData, is_base_uom: e.target.checked })} 
                    />
                    <span>Set as Base UOM (for stock tracking)</span>
                  </label>
                </div>
              </form>
            </div>

            <div>
              <h3 style={{ marginBottom: '10px' }}>Current UOMs ({productUOMs.length})</h3>
              {productUOMs.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>UOM</th>
                      <th>Base</th>
                      <th>Factor</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productUOMs.map((pu) => (
                      <tr key={pu.product_uom_id} style={{ background: pu.is_base_uom ? '#f0fdf4' : 'white' }}>
                        <td>
                          <strong>{pu.uom_name}</strong> ({pu.uom_code})
                          {pu.uom_name_mm && <div style={{ fontSize: '12px', color: '#666' }}>{pu.uom_name_mm}</div>}
                        </td>
                        <td>
                          {pu.is_base_uom && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Base</span>}
                        </td>
                        <td>{pu.conversion_factor}</td>
                        <td>{pu.price ? `${pu.price} Ks` : '-'}</td>
                        <td>{pu.cost ? `${pu.cost} Ks` : '-'}</td>
                        <td>
                          <IconButton onClick={() => handleDeleteProductUOM(pu.product_uom_id)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                    No UOMs configured yet
                  </p>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>
                    Add units above to enable multi-UOM selling
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setShowUOMModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
