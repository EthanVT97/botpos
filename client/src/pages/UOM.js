import React, { useState, useEffect } from 'react';
import { getUOMs, createUOM, updateUOM, deleteUOM, getUOMConversions, addUOMConversion } from '../api/api';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Select from 'react-select';

const UOM = () => {
  const [uoms, setUOMs] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [editingUOM, setEditingUOM] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_mm: '',
    description: ''
  });
  const [conversionData, setConversionData] = useState({
    from_uom_id: '',
    to_uom_id: '',
    conversion_factor: ''
  });

  useEffect(() => {
    loadUOMs();
    loadConversions();
  }, []);

  const loadUOMs = async () => {
    try {
      const res = await getUOMs();
      setUOMs(res.data?.data || []);
    } catch (error) {
      console.error('Error loading UOMs:', error);
      alert('Failed to load UOMs: ' + (error.response?.data?.error || error.message));
    }
  };

  const loadConversions = async () => {
    try {
      const res = await getUOMConversions();
      setConversions(res.data?.data || []);
    } catch (error) {
      console.error('Error loading conversions:', error);
      alert('Failed to load conversions: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUOM) {
        await updateUOM(editingUOM.id, formData);
        alert('UOM updated successfully! ✅');
      } else {
        await createUOM(formData);
        alert('UOM created successfully! ✅');
      }
      setShowModal(false);
      setEditingUOM(null);
      setFormData({ code: '', name: '', name_mm: '', description: '' });
      
      // Force reload with delay
      setTimeout(() => {
        loadUOMs();
      }, 500);
    } catch (error) {
      console.error('Error saving UOM:', error);
      alert('Failed to save UOM: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    try {
      await addUOMConversion(conversionData);
      setShowConversionModal(false);
      setConversionData({ from_uom_id: '', to_uom_id: '', conversion_factor: '' });
      await loadConversions();
    } catch (error) {
      console.error('Error saving conversion:', error);
      alert('Failed to save conversion: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (uom) => {
    setEditingUOM(uom);
    setFormData(uom);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this UOM?')) {
      try {
        await deleteUOM(id);
        loadUOMs();
      } catch (error) {
        console.error('Error deleting UOM:', error);
        alert('Error: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const uomColumns = [
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'name_mm', headerName: 'Myanmar Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => handleEdit(params.row)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const conversionColumns = [
    { 
      field: 'from_uom', 
      headerName: 'From UOM', 
      width: 200,
      valueGetter: (value, row) => row.from_uom?.name || ''
    },
    { 
      field: 'to_uom', 
      headerName: 'To UOM', 
      width: 200,
      valueGetter: (value, row) => row.to_uom?.name || ''
    },
    { 
      field: 'conversion_factor', 
      headerName: 'Conversion Factor', 
      width: 200,
      type: 'number'
    },
    { 
      field: 'formula', 
      headerName: 'Formula', 
      width: 300,
      valueGetter: (value, row) => {
        const from = row.from_uom?.name || '';
        const to = row.to_uom?.name || '';
        const factor = row.conversion_factor || 0;
        return `1 ${from} = ${factor} ${to}`;
      }
    },
  ];

  const uomOptions = uoms.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Unit of Measure / တိုင်းတာမှုယူနစ်</h1>
        <p className="page-subtitle">Manage units and conversions</p>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="UOM List" />
          <Tab label="Conversions" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>Unit of Measure</h2>
            <Button 
              variant="contained" 
              onClick={() => { 
                setShowModal(true); 
                setEditingUOM(null);
                setFormData({ code: '', name: '', name_mm: '', description: '' });
              }} 
              startIcon={<AddIcon />}
            >
              Add UOM
            </Button>
          </div>
          <DataGrid
            rows={uoms}
            columns={uomColumns}
            slots={{ toolbar: GridToolbar }}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            autoHeight
          />
        </div>
      )}

      {tabValue === 1 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2>UOM Conversions</h2>
            <Button 
              variant="contained" 
              onClick={() => setShowConversionModal(true)} 
              startIcon={<AddIcon />}
            >
              Add Conversion
            </Button>
          </div>
          <DataGrid
            rows={conversions}
            columns={conversionColumns}
            slots={{ toolbar: GridToolbar }}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            autoHeight
          />
        </div>
      )}

      {/* UOM Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUOM ? 'Edit UOM' : 'Add UOM'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input 
                  className="input" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                  required 
                  placeholder="e.g., PCS, BOX, KG"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input 
                  className="input" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                  placeholder="e.g., Pieces, Box, Kilogram"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Myanmar Name</label>
                <input 
                  className="input" 
                  value={formData.name_mm} 
                  onChange={(e) => setFormData({ ...formData, name_mm: e.target.value })} 
                  placeholder="e.g., ခု, ဘူး, ကီလိုဂရမ်"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="input" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conversion Modal */}
      {showConversionModal && (
        <div className="modal-overlay" onClick={() => setShowConversionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add UOM Conversion</h2>
            </div>
            <form onSubmit={handleConversionSubmit}>
              <div className="form-group">
                <label className="form-label">From UOM *</label>
                <Select
                  options={uomOptions}
                  onChange={(option) => setConversionData({ ...conversionData, from_uom_id: option.value })}
                  placeholder="Select UOM"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">To UOM *</label>
                <Select
                  options={uomOptions}
                  onChange={(option) => setConversionData({ ...conversionData, to_uom_id: option.value })}
                  placeholder="Select UOM"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Conversion Factor *</label>
                <input 
                  type="number" 
                  step="0.0001"
                  className="input" 
                  value={conversionData.conversion_factor} 
                  onChange={(e) => setConversionData({ ...conversionData, conversion_factor: e.target.value })} 
                  required 
                  placeholder="e.g., 12 (1 dozen = 12 pieces)"
                />
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  Example: If 1 Box = 12 Pieces, enter 12
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConversionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UOM;
