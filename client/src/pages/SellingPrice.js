import React, { useState, useEffect } from 'react';
import { getProducts, getUOMs } from '../api/api';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/Button';
import { Plus, ArrowBigDown, ArrowBigUp } from 'lucide-react';
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

function EditToolbar(props) {
    return (
        <div></div>
    );
}
const SellingPrice = () => {
    const [products, setProducts] = useState([]);
    const [rows, setRows] = useState();
    const [rowModesModel, setRowModesModel] = useState({});
    const formula = [
        {
            value: 'plus',
            label: 'Plus',
        },
        {
            value: 'minus',
            label: 'Minus',
        },
    ];
    useEffect(() => {
        loadProducts();
    }, []);
    const loadProducts = async () => {
        try {
            const res = await getProducts();
            setProducts(res.data.data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };
    console.log("product", products)
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

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
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
            valueGetter: (value, row) => row.categories?.name || ''
        },
        { field: 'name', headerName: 'Name', width: 200, editable: false },
        {
            field: 'base_uom_id',
            headerName: 'UOM',
            width: 220,
            editable: false,
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 180,
            editable: true,
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
                <Stack spacing={2} direction="row">
                    <TextField
                        id="outlined-select-currency"
                        select
                        defaultValue="plus"
                        helperText="Please select formula"
                        size="small"
                    >
                        {formula.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                        <OutlinedInput
                            id="outlined-adornment-weight"
                            endAdornment={<InputAdornment position="end">%</InputAdornment>}
                            aria-describedby="outlined-weight-helper-text"
                            inputProps={{
                                'aria-label': 'weight',
                            }}
                            size="small"
                        />
                        <FormHelperText id="outlined-weight-helper-text">Please type</FormHelperText>
                    </FormControl>
                    <button className="btn btn-primary">
                            <ArrowBigUp size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Import
                        </button>
                </Stack>
                
                <div style={{ display: 'flex', justifyContent: 'end', marginBottom: '20px' }}>
                    <Stack spacing={1} direction="row">
                        <button className="btn btn-primary">
                            <ArrowBigUp size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Import
                        </button>
                        <button className="btn btn-primary">
                            <ArrowBigDown size={18} style={{ marginRight: '8px', display: 'inline' }} />
                            Export
                        </button>
                    </Stack>
                </div>
                <DataGrid
                    rows={products}
                    columns={columns}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={handleRowModesModelChange}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    slots={{
                        toolbar: EditToolbar,
                    }}
                    slotProps={{
                        toolbar: { setRows, setRowModesModel },
                    }}
                />
            </div>
        </div>
    );
};

export default SellingPrice;
