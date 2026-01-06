
export interface Meta {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: Meta;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}
