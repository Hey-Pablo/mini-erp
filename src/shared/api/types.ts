// Tipos de paginação
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Tipos de busca
export interface SearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

// Tipos de resposta de auth
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
}