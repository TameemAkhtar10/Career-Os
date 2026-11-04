export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: FieldError[];
  stack?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

