export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'manager' | 'admin';
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  user: User;
  accessToken: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images: string[];
  owner_id: number;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_email?: string;
}

export interface PaginatedResponse<T> {
  page: number;
  per: number;
  total: number;
  items?: T[];
  users?: User[];
  logs?: AuditLog[];
  listings?: Listing[];
}

export interface UploadResponse {
  urls: string[];
}

export interface ApiError {
  error: string;
  details?: string[];
}