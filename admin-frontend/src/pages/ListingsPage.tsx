import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  IconButton,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Edit, Delete, Download } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/admin';
import { Listing } from '../types/api';

const ListingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isManager } = useAuth();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    location: '',
  });

  useEffect(() => {
    loadListings();
  }, [page, pageSize, search]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getListings({
        page: page + 1,
        per: pageSize,
        q: search || undefined,
      });
      setListings(response.items || []);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing: Listing) => {
    setSelectedListing(listing);
    setEditForm({
      title: listing.title,
      description: listing.description || '',
      price: listing.price,
      category: listing.category || '',
      location: listing.location || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateListing = async () => {
    if (!selectedListing) return;
    
    try {
      await adminService.updateListing(selectedListing.id, editForm);
      setListings(listings.map(l => 
        l.id === selectedListing.id 
          ? { ...l, ...editForm }
          : l
      ));
      setEditDialogOpen(false);
      setSelectedListing(null);
    } catch (err: any) {
      setError(err.error || 'Failed to update listing');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('listings.deleteListing'))) return;
    
    try {
      await adminService.deleteListing(id);
      setListings(listings.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.error || 'Failed to delete listing');
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminService.exportListings();
      const csvContent = convertToCSV(response.listings);
      downloadCSV(csvContent, 'listings.csv');
    } catch (err: any) {
      setError(err.error || 'Failed to export listings');
    }
  };

  const convertToCSV = (data: Listing[]) => {
    const headers = ['ID', 'Title', 'Description', 'Price', 'Category', 'Location', 'Created At'];
    const rows = data.map(item => [
      item.id,
      `"${item.title}"`,
      `"${item.description || ''}"`,
      item.price,
      `"${item.category || ''}"`,
      `"${item.location || ''}"`,
      new Date(item.created_at).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: t('listings.listingTitle'), width: 250 },
    { field: 'price', headerName: t('listings.price'), width: 120, valueFormatter: (value) => `$${value}` },
    { field: 'category', headerName: t('listings.category'), width: 150 },
    { field: 'location', headerName: t('listings.location'), width: 150 },
    {
      field: 'created_at',
      headerName: t('listings.createdAt'),
      width: 180,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => handleEdit(params.row)}
            disabled={!isManager}
            size="small"
          >
            <Edit />
          </IconButton>
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            disabled={!isManager}
            size="small"
            color="error"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('listings.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={!isManager}
          >
            {t('listings.exportListings')}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={listings}
          columns={columns}
          paginationModel={{ page, pageSize }}
          rowCount={total}
          paginationMode="server"
          onPaginationModelChange={(newModel) => {
            setPage(newModel.page);
            setPageSize(newModel.pageSize);
          }}
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('listings.updateListing')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('listings.listingTitle')}
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('listings.description')}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label={t('listings.price')}
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
              fullWidth
            />
            <TextField
              label={t('listings.category')}
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('listings.location')}
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUpdateListing} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListingsPage;