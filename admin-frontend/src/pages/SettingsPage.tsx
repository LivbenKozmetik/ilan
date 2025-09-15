import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.theme')}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              color="primary"
            />
          }
          label={isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.language')}
        </Typography>
        <FormControl fullWidth>
          <InputLabel>{t('settings.language')}</InputLabel>
          <Select
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            label={t('settings.language')}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="tr">Türkçe</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            <strong>Frontend Version:</strong> 1.0.0
          </Typography>
          <Typography variant="body2">
            <strong>Build Date:</strong> {new Date().toLocaleDateString()}
          </Typography>
          <Typography variant="body2">
            <strong>Environment:</strong> {import.meta.env.MODE}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;