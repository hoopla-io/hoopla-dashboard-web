export interface PaginationParams {
  page?: number;
  limit?: number;
}

export type SortOrder = "asc" | "desc";

export interface SortParams {
  sort?: string;
  order?: SortOrder;
}

export interface Meta {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Meta | null;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: Meta | null;
}
