import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import { adminService } from '../services/admin';
import { AuditLog } from '../types/api';

const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [page, pageSize, actionFilter, entityTypeFilter]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAuditLogs({
        page: page + 1,
        per: pageSize,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
      });
      setLogs(response.logs || []);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'success';
    if (action.includes('UPDATE')) return 'warning';
    if (action.includes('DELETE')) return 'error';
    if (action.includes('LOGIN')) return 'info';
    return 'default';
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  const columns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: t('audit.createdAt'),
      width: 180,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: 'action',
      headerName: t('audit.action'),
      width: 200,
      renderCell: (params) => (
        <Chip
          label={params.row.action}
          color={getActionColor(params.row.action)}
          size="small"
        />
      ),
    },
    { field: 'user_email', headerName: t('audit.user'), width: 200 },
    { field: 'entity_type', headerName: t('audit.entityType'), width: 150 },
    { field: 'entity_id', headerName: t('audit.entityId'), width: 120 },
    { field: 'ip_address', headerName: t('audit.ipAddress'), width: 150 },
    {
      field: 'details',
      headerName: t('audit.details'),
      width: 300,
      renderCell: (params) => (
        <Box
          sx={{
            whiteSpace: 'pre-wrap',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            maxHeight: 100,
            overflow: 'auto',
          }}
        >
          {formatDetails(params.row.details)}
        </Box>
      ),
    },
  ];

  const actionOptions = [
    'USER_REGISTER',
    'USER_LOGIN',
    'USER_ROLE_CHANGE',
    'LISTING_CREATE',
    'LISTING_UPDATE',
    'LISTING_DELETE',
    'LISTING_BULK_DELETE',
    'LISTING_EXPORT',
    'FILES_UPLOAD',
  ];

  const entityTypeOptions = [
    'user',
    'listing',
    'file',
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('audit.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('audit.action')}</InputLabel>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              label={t('audit.action')}
            >
              <MenuItem value="">
                <em>All Actions</em>
              </MenuItem>
              {actionOptions.map((action) => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('audit.entityType')}</InputLabel>
            <Select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              label={t('audit.entityType')}
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {entityTypeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={logs}
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
          getRowHeight={() => 'auto'}
          sx={{
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default AuditPage;