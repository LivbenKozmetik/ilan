import api, { handleApiError } from './api';
import type { User, Listing, AuditLog, PaginatedResponse, UploadResponse } from '../types/api';

export const adminService = {
  // User management
  async getUsers(params: { 
    page?: number; 
    per?: number; 
    search?: string; 
  } = {}): Promise<PaginatedResponse<User>> {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateUserRole(userId: number, role: string): Promise<User> {
    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Listing management
  async getListings(params: {
    page?: number;
    per?: number;
    category?: string;
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  } = {}): Promise<PaginatedResponse<Listing>> {
    try {
      const response = await api.get('/listings', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateListing(id: number, listing: Partial<Listing>): Promise<Listing> {
    try {
      const response = await api.put(`/admin/listings/${id}`, listing);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async deleteListing(id: number): Promise<void> {
    try {
      await api.delete(`/admin/listings/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async bulkDeleteListings(ids: number[]): Promise<{ deleted: number; listings: any[] }> {
    try {
      const response = await api.post('/admin/listings/bulk-delete', { ids });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async exportListings(): Promise<{ listings: Listing[] }> {
    try {
      const response = await api.get('/admin/listings/export');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Audit logs
  async getAuditLogs(params: {
    page?: number;
    per?: number;
    action?: string;
    entityType?: string;
  } = {}): Promise<PaginatedResponse<AuditLog>> {
    try {
      const response = await api.get('/admin/audit', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // File upload
  async uploadFiles(files: File[]): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};