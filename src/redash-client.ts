/**
 * Redash API Client
 */

import type {
  RedashClientConfig,
  DataSource,
  Query,
  QueryResult,
  JobResponse,
  QueryExecutionRequest,
  QueryExecutionResponse,
  RedashApiError,
} from './types';

export class RedashClient {
  private readonly config: Required<RedashClientConfig>;

  constructor(config: RedashClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      timeout: config.timeout ?? 30000,
    };
  }

  /**
   * Create RedashClient from environment variables
   */
  static fromEnv(): RedashClient {
    const apiKey = process.env.REDASH_API_KEY;
    const baseUrl = process.env.REDASH_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error('REDASH_API_KEY and REDASH_BASE_URL environment variables are required');
    }

    const config: RedashClientConfig = {
      apiKey,
      baseUrl,
    };

    if (process.env.REDASH_API_TIMEOUT) {
      config.timeout = parseInt(process.env.REDASH_API_TIMEOUT, 10);
    }

    return new RedashClient(config);
  }

  /**
   * Make API request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Key ${this.config.apiKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        // Try to get response body for better error messages
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorBody = await response.json();
            errorMessage += ` - ${JSON.stringify(errorBody)}`;
          } else {
            const textBody = await response.text();
            if (textBody) {
              errorMessage += ` - ${textBody}`;
            }
          }
        } catch {
          // If we can't read the body, just use the status message
        }

        const error: RedashApiError = {
          message: errorMessage,
          status: response.status,
        };
        throw error;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * List all data sources
   */
  async listDataSources(): Promise<DataSource[]> {
    return this.request<DataSource[]>('/api/data_sources');
  }

  /**
   * Get specific data source
   */
  async getDataSource(id: number): Promise<DataSource> {
    return this.request<DataSource>(`/api/data_sources/${id}`);
  }

  /**
   * Execute a query
   */
  async executeQuery(request: QueryExecutionRequest): Promise<QueryExecutionResponse> {
    return this.request<QueryExecutionResponse>('/api/query_results', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<JobResponse> {
    return this.request<JobResponse>(`/api/jobs/${jobId}`);
  }

  /**
   * Get query result
   */
  async getQueryResult(resultId: string): Promise<QueryResult> {
    const response = await this.request<{ query_result: QueryResult }>(
      `/api/query_results/${resultId}`
    );
    return response.query_result;
  }

  /**
   * Execute query and wait for result
   */
  async executeQueryAndWait(
    request: QueryExecutionRequest,
    pollInterval = 1000,
    maxAttempts = 60
  ): Promise<QueryResult> {
    // Execute query
    const response = await this.executeQuery(request);
    
    // Check if we got a cached result directly
    if ('query_result' in response) {
      return (response as unknown as { query_result: QueryResult }).query_result;
    }
    
    // Otherwise, poll for job completion
    const { job } = response;
    if (!job) {
      throw new Error('Invalid response: neither job nor query_result found');
    }

    // Poll for completion
    let attempts = 0;
    while (attempts < maxAttempts) {
      const { job: currentJob } = await this.getJob(job.id);

      // Status: 3 = success
      if (currentJob.status === 3) {
        if (!currentJob.query_result_id) {
          throw new Error('Query completed but no result ID found');
        }
        return this.getQueryResult(currentJob.query_result_id);
      }

      // Status: 4 = failure
      if (currentJob.status === 4) {
        const error: RedashApiError = {
          message: currentJob.error ?? 'Query execution failed',
          job: currentJob,
        };
        throw error;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;
    }

    throw new Error(`Query execution timeout after ${maxAttempts} attempts`);
  }

  /**
   * List queries
   */
  async listQueries(page = 1, pageSize = 25): Promise<Query[]> {
    const response = await this.request<{ results: Query[] }>(
      `/api/queries?page=${page}&page_size=${pageSize}`
    );
    return response.results;
  }

  /**
   * Get specific query
   */
  async getQuery(id: number): Promise<Query> {
    return this.request<Query>(`/api/queries/${id}`);
  }
}
