import React, { useState, useEffect } from 'react';
import { getProducts, bulkUpdatePrices, updateSellingPrice, exportPrices } from '../api/api';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/Button';
import { ArrowBigDown, ArrowBigUp, Calculator } from 'lucide-react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
    GridRowModes,
    DataGrid,
    GridToolbarContainer,
    GridActionsCellItem,
    GridRowEditStopReasons,
} from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

function EditToolbar(props) {
    return (
        <div></div>
    );
}
const SellingPrice = () => {
    const [products, setProducts] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [selectedFormula, setSelectedFormula] = useState('plus');
    const [percentage, setPercentage] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    const formula = [
        { value: 'plus', label: 'Plus (+)' },
        { value: 'minus', label: 'Minus (-)' },
    ];

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await getProducts();
            setProducts(res.data.data);
        } catch (error) {
            console.error('Error loading products:', error);
            showSnackbar('Error loading products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };
    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        //const editedRow = rows.find((row) => row.id === id);
        // if (editedRow.isNew) {
        //     setRows(rows.filter((row) => row.id !== id));
        // }
    };

    const processRowUpdate = async (newRow) => {
        try {
            // Update price in backend
            await updateSellingPrice(newRow.id, { price: newRow.price });
            
            // Update local state
            const updatedRow = { ...newRow, isNew: false };
            setProducts(products.map((row) => (row.id === newRow.id ? updatedRow : row)));
            
            showSnackbar('Price updated successfully');
            return updatedRow;
        } catch (error) {
            console.error('Error updating price:', error);
            showSnackbar('Error updating price', 'error');
            throw error;
        }
    };

    const handleBulkUpdate = async () => {
        if (!percentage || parseFloat(percentage) === 0) {
            showSnackbar('Please enter a valid percentage', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await bulkUpdatePrices({
                formula: selectedFormula,
                percentage: parseFloat(percentage),
                productIds: [] // Empty array means update all products
            });

            showSnackbar(`Successfully updated ${response.data.data.length} products`);
            loadProducts(); // Reload to show updated prices
        } catch (error) {
            console.error('Error bulk updating:', error);
            showSnackbar('Error updating prices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await exportPrices();
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `selling-prices-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            showSnackbar('Prices exported successfully');
        } catch (error) {
            console.error('Error exporting:', error);
            showSnackbar('Error exporting prices', 'error');
        }
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const columns = [
        {
            field: 'category',
            headerName: 'Category',
            width: 180,
            editable: false,
            valueGetter: (value, row) => row.categories?.name || 'N/A'
        },
        { 
            field: 'name', 
            headerName: 'Product Name', 
            width: 250, 
            editable: false 
        },
        {
            field: 'cost',
            headerName: 'Cost',
            width: 120,
            editable: false,
            valueFormatter: (value) => value ? `${value} Ks` : 'N/A'
        },
        {
            field: 'price',
            headerName: 'Selling Price',
            width: 150,
            editable: true,
            type: 'number',
            valueFormatter: (value) => `${value} Ks`
        },
        {
            field: 'margin',
            headerName: 'Margin %',
            width: 120,
            editable: false,
            valueGetter: (value, row) => {
                if (row.cost && row.price) {
                    const margin = ((row.price - row.cost) / row.cost * 100).toFixed(2);
                    return `${margin}%`;
                }
                return 'N/A';
            }
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon />}
                            label="Save"
                            sx={{
                                color: 'primary.main',
                            }}
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon />}
                            label="Cancel"
                            className="textPrimary"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />
                ];
            },
        },
    ];
    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">SellingPrice /  ရောင်းဈေး</h1>
                <p className="page-subtitle">The price for which something actually sells</p>
            </div>
            <div className="card">
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Bulk Price Update</h3>
                    <Stack spacing={2} direction="row" alignItems="flex-start">
                        <TextField
                            select
                            label="Formula"
                            value={selectedFormula}
                            onChange={(e) => setSelectedFormula(e.target.value)}
                            helperText="Select calculation method"
                            size="small"
                            sx={{ minWidth: 150 }}
                        >
                            {formula.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <FormControl variant="outlined" size="small">
                            <OutlinedInput
                                type="number"
                                value={percentage}
                                onChange={(e) => setPercentage(e.target.value)}
                                endAdornment={<InputAdornment position="end">%</InputAdornment>}
                                placeholder="0"
                                sx={{ minWidth: 150 }}
                            />
                            <FormHelperText>Enter percentage</FormHelperText>
                        </FormControl>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleBulkUpdate}
                            disabled={loading || !percentage}
                            style={{ marginTop: '0' }}
                        >
                            <Calculator size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Apply to All
                        </button>
                    </Stack>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        💡 Tip: Click on a price cell to edit individual product prices
                    </p>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleExport}
                        disabled={loading}
                    >
                        <ArrowBigDown size={18} style={{ marginRight: '8px', display: 'inline' }} />
                        Export CSV
                    </button>
                </div>
                <DataGrid
                    rows={products}
                    columns={columns}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={handleRowModesModelChange}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    loading={loading}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 25 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    sx={{
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                        },
                        '& .MuiDataGrid-cell:focus-within': {
                            outline: '2px solid #6366f1',
                        },
                    }}
                />
            </div>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default SellingPrice;
