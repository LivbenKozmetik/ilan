import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  People,
  ViewList,
  TrendingUp,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', minWidth: 200 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 1,
              p: 1,
              mr: 2,
              color: 'white',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color="primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.title')}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('dashboard.welcome')}, {user?.name || user?.email}!
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <StatCard
          title={t('dashboard.totalUsers')}
          value="156"
          icon={<People />}
          color="#2196f3"
        />
        <StatCard
          title={t('dashboard.totalListings')}
          value="1,234"
          icon={<ViewList />}
          color="#4caf50"
        />
        <StatCard
          title="Active Today"
          value="42"
          icon={<TrendingUp />}
          color="#ff9800"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: 2, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.recentActivity')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent activity will be displayed here...
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quick action buttons will be available here...
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPage;