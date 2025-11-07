import { describe, it, expect } from 'vitest';
import type {
  DataSource,
  Query,
  QueryResult,
  Job,
  Dashboard,
  RedashClientConfig,
} from '../src/types';

describe('Type Definitions', () => {
  describe('DataSource Type', () => {
    it('should accept valid DataSource object', () => {
      const dataSource: DataSource = {
        id: 1,
        name: 'PostgreSQL',
        type: 'pg',
        syntax: 'sql',
      };

      expect(dataSource.id).toBe(1);
      expect(dataSource.name).toBe('PostgreSQL');
      expect(dataSource.type).toBe('pg');
    });

    it('オプショナルフィールドなしでも有効', () => {
      const dataSource: DataSource = {
        id: 2,
        name: 'MySQL',
        type: 'mysql',
      };

      expect(dataSource.id).toBe(2);
      expect(dataSource.paused).toBeUndefined();
    });
  });

  describe('Query Type', () => {
    it('should accept valid Query object', () => {
      const query: Query = {
        id: 1,
        name: 'Test Query',
        query: 'SELECT * FROM users',
        data_source_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_archived: false,
        is_draft: false,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      expect(query.id).toBe(1);
      expect(query.name).toBe('Test Query');
      expect(query.is_archived).toBe(false);
    });
  });

  describe('QueryResult Type', () => {
    it('should accept valid QueryResult object', () => {
      const result: QueryResult = {
        id: 'result-1',
        query_hash: 'abc123',
        query: 'SELECT * FROM users',
        data: {
          columns: [
            { name: 'id', friendly_name: 'ID', type: 'integer' },
            { name: 'name', friendly_name: 'Name', type: 'string' },
          ],
          rows: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        },
        data_source_id: 1,
        runtime: 0.123,
        retrieved_at: '2024-01-01T00:00:00Z',
      };

      expect(result.id).toBe('result-1');
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.columns).toHaveLength(2);
    });
  });

  describe('Job Type', () => {
    it('should accept valid Job object (success)', () => {
      const job: Job = {
        id: 'job-1',
        status: 3, // success
        query_result_id: 'result-1',
        updated_at: 1234567890,
      };

      expect(job.id).toBe('job-1');
      expect(job.status).toBe(3);
      expect(job.query_result_id).toBe('result-1');
    });

    it('should accept valid Job object (failure)', () => {
      const job: Job = {
        id: 'job-2',
        status: 4, // failure
        error: 'Query timeout',
        updated_at: 1234567890,
      };

      expect(job.id).toBe('job-2');
      expect(job.status).toBe(4);
      expect(job.error).toBe('Query timeout');
    });
  });

  describe('Dashboard Type', () => {
    it('should accept valid Dashboard object', () => {
      const dashboard: Dashboard = {
        id: 1,
        name: 'Main Dashboard',
        slug: 'main-dashboard',
        user_id: 1,
        layout: '[]',
        dashboard_filters_enabled: false,
        is_archived: false,
        is_draft: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      expect(dashboard.id).toBe(1);
      expect(dashboard.name).toBe('Main Dashboard');
      expect(dashboard.is_archived).toBe(false);
    });
  });

  describe('RedashClientConfig Type', () => {
    it('should accept valid Config object', () => {
      const config: RedashClientConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.redash.example.com',
        timeout: 30000,
      };

      expect(config.apiKey).toBe('test-key');
      expect(config.timeout).toBe(30000);
    });

    it('should be valid without optional fields', () => {
      const config: RedashClientConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.redash.example.com',
      };

      expect(config.apiKey).toBe('test-key');
      expect(config.timeout).toBeUndefined();
    });
  });
});
