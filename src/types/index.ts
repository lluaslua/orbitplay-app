export * from './auth';
export * from './game';
export * from './test';
export * from './player';
export * from './report';
export * from './community';
export * from './access';

/** Envelope usado por toda a camada mock - espelha o formato previsto da API real. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  fields?: Record<string, string>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
