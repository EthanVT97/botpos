import React, { useState, useEffect, useRef } from 'react';
import { getProducts, bulkUpdatePrices, updateSellingPrice, exportPrices, importPrices, downloadImportTemplate, getPriceHistory } from '../api/api';
import { Calculator, Upload, Download, FileSpreadsheet, ArrowBigDown } from 'lucide-react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import {
    GridRowModes,
    DataGrid,
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const SellingPrice = () => {
    const [products, setProducts] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [selectedFormula, setSelectedFormula] = useState('plus');
    const [percentage, setPercentage] = useState('');
    const [fixedAmount, setFixedAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [selectedRows, setSelectedRows] = useState([]);
    const [historyDialog, setHistoryDialog] = useState({ open: false, productId: null, data: null });
    const [importDialog, setImportDialog] = useState({ open: false, file: null });
    const fileInputRef = useRef(null);
    
    const formula = [
        { value: 'plus', label: 'Plus (+) %', requiresPercentage: true },
        { value: 'minus', label: 'Minus (-) %', requiresPercentage: true },
        { value: 'margin', label: 'Set Margin %', requiresPercentage: true },
        { value: 'fixed_add', label: 'Add Fixed Amount', requiresFixed: true },
        { value: 'fixed_subtract', label: 'Subtract Fixed Amount', requiresFixed: true },
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
    };

    const processRowUpdate = async (newRow) => {
        try {
            await updateSellingPrice(newRow.id, { price: newRow.price });
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
        const selectedFormulaDef = formula.find(f => f.value === selectedFormula);
        
        if (selectedFormulaDef?.requiresPercentage && (!percentage || parseFloat(percentage) === 0)) {
            showSnackbar('Please enter a valid percentage', 'warning');
            return;
        }

        if (selectedFormulaDef?.requiresFixed && (!fixedAmount || parseFloat(fixedAmount) === 0)) {
            showSnackbar('Please enter a valid fixed amount', 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                formula: selectedFormula,
                productIds: selectedRows.length > 0 ? selectedRows : []
            };

            if (selectedFormulaDef?.requiresPercentage) {
                payload.percentage = parseFloat(percentage);
            }

            if (selectedFormulaDef?.requiresFixed) {
                payload.fixedAmount = parseFloat(fixedAmount);
            }

            const response = await bulkUpdatePrices(payload);
            showSnackbar(`Successfully updated ${response.data.data.length} products`);
            setSelectedRows([]);
            loadProducts();
        } catch (error) {
            console.error('Error bulk updating:', error);
            showSnackbar(error.response?.data?.error || 'Error updating prices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format = 'excel') => {
        try {
            const response = await exportPrices(format);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = format === 'csv' ? 'csv' : 'xlsx';
            link.setAttribute('download', `selling-prices-${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSnackbar(`Prices exported successfully as ${extension.toUpperCase()}`);
        } catch (error) {
            console.error('Error exporting:', error);
            showSnackbar('Error exporting prices', 'error');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await downloadImportTemplate();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'price-import-template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            showSnackbar('Template downloaded successfully');
        } catch (error) {
            console.error('Error downloading template:', error);
            showSnackbar('Error downloading template', 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImportDialog({ open: true, file });
        }
    };

    const handleImportConfirm = async () => {
        if (!importDialog.file) return;

        setLoading(true);
        try {
            const response = await importPrices(importDialog.file);
            showSnackbar(response.data.message);
            setImportDialog({ open: false, file: null });
            loadProducts();
        } catch (error) {
            console.error('Error importing:', error);
            showSnackbar(error.response?.data?.error || 'Error importing prices', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (productId) => {
        try {
            const response = await getPriceHistory(productId);
            setHistoryDialog({ open: true, productId, data: response.data.data });
        } catch (error) {
            console.error('Error loading history:', error);
            showSnackbar('Error loading price history', 'error');
        }
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const selectedFormulaDef = formula.find(f => f.value === selectedFormula);

    const columns = [
        {
            field: 'category',
            headerName: 'Category',
            width: 150,
            editable: false,
            valueGetter: (value, row) => row.categories?.name || 'N/A'
        },
        { 
            field: 'name', 
            headerName: 'Product Name', 
            width: 220, 
            editable: false 
        },
        {
            field: 'cost',
            headerName: 'Cost',
            width: 110,
            editable: false,
            valueFormatter: (value) => value ? `${value} Ks` : 'N/A'
        },
        {
            field: 'price',
            headerName: 'Selling Price',
            width: 130,
            editable: true,
            type: 'number',
            valueFormatter: (value) => `${value} Ks`
        },
        {
            field: 'margin',
            headerName: 'Margin %',
            width: 100,
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
            width: 120,
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon />}
                            label="Save"
                            sx={{ color: 'primary.main' }}
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon />}
                            label="Cancel"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<HistoryIcon />}
                        label="History"
                        onClick={() => handleViewHistory(id)}
                        color="inherit"
                    />
                ];
            },
        },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Selling Price / ရောင်းဈေး</h1>
                <p className="page-subtitle">Manage product selling prices with advanced formulas</p>
            </div>
            <div className="card">
                {/* Bulk Update Section */}
                <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                        🧮 Bulk Price Update
                        {selectedRows.length > 0 && (
                            <Chip 
                                label={`${selectedRows.length} selected`} 
                                size="small" 
                                color="primary" 
                                style={{ marginLeft: '10px' }}
                            />
                        )}
                    </h3>
                    <Stack spacing={2} direction="row" alignItems="flex-start" flexWrap="wrap">
                        <TextField
                            select
                            label="Formula"
                            value={selectedFormula}
                            onChange={(e) => {
                                setSelectedFormula(e.target.value);
                                setPercentage('');
                                setFixedAmount('');
                            }}
                            helperText="Select calculation method"
                            size="small"
                            sx={{ minWidth: 200 }}
                        >
                            {formula.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        
                        {selectedFormulaDef?.requiresPercentage && (
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
                        )}

                        {selectedFormulaDef?.requiresFixed && (
                            <FormControl variant="outlined" size="small">
                                <OutlinedInput
                                    type="number"
                                    value={fixedAmount}
                                    onChange={(e) => setFixedAmount(e.target.value)}
                                    endAdornment={<InputAdornment position="end">Ks</InputAdornment>}
                                    placeholder="0"
                                    sx={{ minWidth: 150 }}
                                />
                                <FormHelperText>Enter fixed amount</FormHelperText>
                            </FormControl>
                        )}
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={handleBulkUpdate}
                            disabled={loading || (!percentage && !fixedAmount)}
                            style={{ marginTop: '0' }}
                        >
                            <Calculator size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            {selectedRows.length > 0 ? 'Apply to Selected' : 'Apply to All'}
                        </button>
                    </Stack>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button 
                            className="btn btn-secondary" 
                            onClick={handleDownloadTemplate}
                            disabled={loading}
                        >
                            <FileSpreadsheet size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Download Template
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={handleImportClick}
                            disabled={loading}
                        >
                            <Upload size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Import Excel
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => handleExport('excel')}
                            disabled={loading}
                        >
                            <ArrowBigDown size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Export Excel
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => handleExport('csv')}
                            disabled={loading}
                        >
                            <ArrowBigDown size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Export CSV
                        </button>
                    </div>
                </div>

                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    💡 Tip: Select rows using checkboxes, double-click price to edit, click history icon to view changes
                </p>

                <DataGrid
                    rows={products}
                    columns={columns}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={handleRowModesModelChange}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    loading={loading}
                    checkboxSelection
                    onRowSelectionModelChange={(newSelection) => {
                        setSelectedRows(newSelection);
                    }}
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

            {/* Import Dialog */}
            <Dialog open={importDialog.open} onClose={() => setImportDialog({ open: false, file: null })}>
                <DialogTitle>Import Prices from Excel</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        File: {importDialog.file?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        This will update prices for all products in the file. Make sure the file contains:
                    </Typography>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                        <li>Product ID column</li>
                        <li>Selling Price (Ks) column</li>
                    </ul>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialog({ open: false, file: null })}>Cancel</Button>
                    <Button onClick={handleImportConfirm} variant="contained" disabled={loading}>
                        Import
                    </Button>
                </DialogActions>
            </Dialog>

            {/* History Dialog */}
            <Dialog 
                open={historyDialog.open} 
                onClose={() => setHistoryDialog({ open: false, productId: null, data: null })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Price History
                    {historyDialog.data?.product && (
                        <Typography variant="subtitle2" color="textSecondary">
                            {historyDialog.data.product.name} ({historyDialog.data.product.name_mm})
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    {historyDialog.data?.history && historyDialog.data.history.length > 0 ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Old Price</TableCell>
                                    <TableCell>New Price</TableCell>
                                    <TableCell>Change</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Formula</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyDialog.data.history.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {new Date(record.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{record.old_price} Ks</TableCell>
                                        <TableCell>{record.new_price} Ks</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={`${record.new_price - record.old_price > 0 ? '+' : ''}${record.new_price - record.old_price} Ks`}
                                                size="small"
                                                color={record.new_price - record.old_price > 0 ? 'success' : 'error'}
                                            />
                                        </TableCell>
                                        <TableCell>{record.change_type}</TableCell>
                                        <TableCell>{record.formula || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography>No price history available</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialog({ open: false, productId: null, data: null })}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

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
