/**
 * Redash API Type Definitions
 */

// ========================================
// Data Source Types
// ========================================

export interface DataSource {
  id: number;
  name: string;
  type: string;
  syntax?: string;
  paused?: boolean;
  pause_reason?: string;
  options?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface DataSourceList {
  count: number;
  page: number;
  page_size: number;
  results: DataSource[];
}

// ========================================
// Query Types
// ========================================

export interface Query {
  id: number;
  name: string;
  description?: string;
  query: string;
  data_source_id: number;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_draft: boolean;
  user: {
    id: number;
    name: string;
    email: string;
  };
  last_modified_by?: {
    id: number;
    name: string;
    email: string;
  };
  visualizations?: Visualization[];
  options?: Record<string, unknown>;
  version?: number;
  tags?: string[];
}

export interface QueryList {
  count: number;
  page: number;
  page_size: number;
  results: Query[];
}

// ========================================
// Query Execution Types
// ========================================

export interface QueryResult {
  id: string;
  query_hash: string;
  query: string;
  data: {
    columns: Array<{
      name: string;
      friendly_name: string;
      type: string;
    }>;
    rows: Array<Record<string, unknown>>;
  };
  data_source_id: number;
  runtime: number;
  retrieved_at: string;
}

export interface Job {
  id: string;
  status: 1 | 2 | 3 | 4; // 1: pending, 2: started, 3: success, 4: failure
  query_result_id?: string;
  error?: string;
  updated_at: number;
}

export interface JobResponse {
  job: Job;
}

export interface QueryExecutionRequest {
  query: string;
  data_source_id: number;
  max_age?: number;
  parameters?: Record<string, unknown>;
}

export interface QueryExecutionResponse {
  job: Job;
}

// ========================================
// Dashboard Types
// ========================================

export interface Dashboard {
  id: number;
  name: string;
  slug: string;
  user_id: number;
  layout: string;
  dashboard_filters_enabled: boolean;
  is_archived: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  widgets?: Widget[];
  tags?: string[];
}

export interface DashboardList {
  count: number;
  page: number;
  page_size: number;
  results: Dashboard[];
}

export interface Widget {
  id: number;
  width: number;
  options: {
    position: {
      col: number;
      row: number;
      sizeX: number;
      sizeY: number;
    };
  };
  dashboard_id: number;
  text?: string;
  visualization?: Visualization;
  created_at: string;
  updated_at: string;
}

// ========================================
// Visualization Types
// ========================================

export interface Visualization {
  id: number;
  type: string;
  name: string;
  description?: string;
  options: Record<string, unknown>;
  query: {
    id: number;
    name: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

// ========================================
// API Error Types
// ========================================

export interface RedashApiError {
  message: string;
  status?: number;
  job?: Job;
}

// ========================================
// Configuration Types
// ========================================

export interface RedashClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}
