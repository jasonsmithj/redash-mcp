# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of Redash MCP Server
- Data source management tools
- Query execution tools
- Docker support with multi-platform images
- Comprehensive test suite with 94% coverage
- GitHub Actions CI/CD pipeline
- Docker Hub publishing workflow

### Features

- `list_data_sources`: List all available data sources
- `get_data_source`: Get details about a specific data source
- `execute_query_and_wait`: Execute SQL queries and wait for results
- `list_queries`: List all queries in Redash

### Technical

- TypeScript 5.7+ with strict mode
- Vite 6.x for building
- Vitest 3.x for testing
- ESLint 9.x with flat config
- Prettier 3.x for formatting
- pnpm 9.x as package manager
- Node.js 22+ support

## [1.0.0] - TBD

Initial public release.
