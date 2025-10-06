import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Edit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/admin';
import { User } from '../types/api';

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, search]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUsers({
        page: page + 1,
        per: pageSize,
        search: search || undefined,
      });
      setUsers(response.users || []);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await adminService.updateUserRole(selectedUser.id, newRole);
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: newRole as any }
          : u
      ));
      setRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.error || 'Failed to update user role');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'user': return 'default';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'email', headerName: t('users.email'), width: 250 },
    { field: 'name', headerName: t('users.name'), width: 200 },
    {
      field: 'role',
      headerName: t('users.role'),
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.role}
          color={getRoleColor(params.row.role)}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: t('users.createdAt'),
      width: 180,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleRoleChange(params.row)}
          disabled={!isAdmin}
          size="small"
        >
          <Edit />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('users.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label={t('users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
        />
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
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

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>{t('users.changeRole')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>{t('users.role')}</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label={t('users.role')}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleRoleUpdate} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;