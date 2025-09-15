import api, { setAccessToken, handleApiError } from './api';
import type { LoginRequest, LoginResponse, RefreshResponse, User } from '../types/api';

export const authService = {
  async login(credentials: LoginRequest): Promise<{ user: User; accessToken: string }> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      const { user, accessToken } = response.data;
      setAccessToken(accessToken);
      return { user, accessToken };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async refresh(): Promise<{ user: User; accessToken: string } | null> {
    try {
      const response = await api.post<RefreshResponse>('/auth/refresh');
      const { user, accessToken } = response.data;
      setAccessToken(accessToken);
      return { user, accessToken };
    } catch (error) {
      setAccessToken(null);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const refreshResult = await this.refresh();
      return refreshResult?.user || null;
    } catch (error) {
      return null;
    }
  },
};