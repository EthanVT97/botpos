import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/api';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { useDemoData } from '@mui/x-data-grid-generator';

function PaperComponent(props) {
  const nodeRef = React.useRef(null);
  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} ref={nodeRef} />
    </Draggable>
  );
}

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', name_mm: '', description: '' });
  const [deleteID, setDeleteID] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const columns = [
    { field: 'name', headerName: 'Category Name', width: 200 },
    { field: 'name_mm', headerName: 'Category Myanmar Name', width: 300 },
    { field: 'description', headerName: 'Description', width: 400 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        return (
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => handleEdit(params.row)} aria-label="edit" >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => { handleClickOpen(); handleDelete(params.id); }}
              aria-label="delete"
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        );
      },
    },
  ];
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false); // Set loading to false after fetching (success or error)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        alert('Category updated successfully! ✅');
      } else {
        await createCategory(formData);
        alert('Category created successfully! ✅');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', name_mm: '', description: '' });
      
      // Force reload with delay
      setTimeout(() => {
        loadCategories();
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setDeleteID(id);
  };
  const confrimDelete = () => {
    setLoading(true);
    try {
      deleteCategory(deleteID);
      loadCategories();
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false); // Set loading to false after fetching (success or error)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Categories / အမျိုးအစားများ</h1>
        <p className="page-subtitle">Manage product categories</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingCategory(null); }}>
            <Plus size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Add Category
          </button>
        </div>
        <DataGrid
          rows={categories}
          columns={columns}
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          pagination
        />
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
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
                <label className="form-label">Description</label>
                <textarea className="input" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setFormData({ name: '', name_mm: '', description: '' }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
          Delete?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to delete this record?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={confrimDelete}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Categories;
