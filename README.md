# Redash MCP Server

[![CI](https://github.com/jasonsmithj/redash-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/jasonsmithj/redash-mcp/actions/workflows/ci.yml)
[![Docker Hub](https://img.shields.io/docker/v/jasonsmithj/redash-mcp?label=docker&logo=docker)](https://hub.docker.com/r/jasonsmithj/redash-mcp)
[![Docker Pulls](https://img.shields.io/docker/pulls/jasonsmithj/redash-mcp)](https://hub.docker.com/r/jasonsmithj/redash-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Redash that provides query execution, data source management, and more through a standardized interface.

<a href="https://glama.ai/mcp/servers/@jasonsmithj/redash-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@jasonsmithj/redash-mcp/badge" alt="Redash Server MCP server" />
</a>

## ✨ Features

- 🔍 **Query Execution**: Execute SQL queries and retrieve results
- 📊 **Data Source Management**: List and inspect data sources
- 🔐 **Secure**: API key-based authentication
- 🐳 **Docker Support**: Easy deployment with Docker
- ✅ **Fully Tested**: Comprehensive test coverage with TDD approach
- 🚀 **Modern Stack**: Built with TypeScript, Vite, and latest tooling

## 📋 Requirements

- **Node.js**: >= 22.0.0
- **pnpm**: >= 9.0.0
- **Redash Instance**: With API access
- **Docker** (optional): For containerized deployment

## 🚀 Quick Start

### Using npx (Recommended)

1. Clone the repository:

```bash
git clone https://github.com/jasonsmithj/redash-mcp.git
cd redash-mcp
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm build
```

4. Link globally:

```bash
pnpm link
```

5. Configure your MCP client (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "redash": {
      "command": "npx",
      "args": ["redash-mcp"],
      "env": {
        "REDASH_API_KEY": "your_api_key_here",
        "REDASH_BASE_URL": "https://redash.example.com"
      }
    }
  }
}
```

### Using Docker Hub (Recommended)

1. Pull the latest image from Docker Hub:

```bash
docker pull jasonsmithj/redash-mcp:latest
```

2. Run with Docker:

```bash
docker run -i --rm \
  -e REDASH_API_KEY=your_api_key \
  -e REDASH_BASE_URL=https://redash.example.com \
  jasonsmithj/redash-mcp:latest
```

3. Or use Docker Compose:

```bash
# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start the service
docker compose up
```

4. Configure your MCP client:

```json
{
  "mcpServers": {
    "redash": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "REDASH_API_KEY",
        "-e",
        "REDASH_BASE_URL",
        "jasonsmithj/redash-mcp:latest"
      ],
      "env": {
        "REDASH_API_KEY": "your_api_key_here",
        "REDASH_BASE_URL": "https://redash.example.com"
      }
    }
  }
}
```

### Building from Source

If you prefer to build from source:

```bash
docker build -t redash-mcp:local .
```

## 🔧 Configuration

### Environment Variables

| Variable             | Required | Default | Description                        |
| -------------------- | -------- | ------- | ---------------------------------- |
| `REDASH_API_KEY`     | ✅       | -       | Your Redash API key                |
| `REDASH_BASE_URL`    | ✅       | -       | Redash instance URL                |
| `REDASH_API_TIMEOUT` | ❌       | 30000   | API request timeout (milliseconds) |

### Getting Your Redash API Key

1. Log in to your Redash instance
2. Click on your profile icon → "Edit Profile"
3. Copy your API key from the "API Key" section

## 🛠 Available Tools

### 1. `list_data_sources`

List all available data sources in Redash.

**Parameters**: None

**Example**:

```
List all data sources
```

### 2. `get_data_source`

Get details about a specific data source.

**Parameters**:

- `data_source_id` (number): The ID of the data source

**Example**:

```
Get details for data source 1
```

### 3. `execute_query_and_wait`

Execute a SQL query and wait for the result.

**Parameters**:

- `query` (string): The SQL query to execute
- `data_source_id` (number): The ID of the data source
- `max_age` (number, optional): Maximum age of cached results in seconds

**Example**:

```
Execute query "SELECT * FROM users LIMIT 10" on data source 1
```

### 4. `list_queries`

List all queries in Redash.

**Parameters**:

- `page` (number, optional): Page number (default: 1)
- `page_size` (number, optional): Results per page (default: 25)

**Example**:

```
List all queries
```

## 🧪 Development

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format code
pnpm format

# Run all checks (CI equivalent)
pnpm ci
```

### Testing with act

Test GitHub Actions locally using `act`:

```bash
# List available workflows
act -l

# Run CI workflow
act push

# Run specific job
act -j quality
```

### Project Structure

```
redash-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── redash-client.ts      # Redash API client
│   ├── types.ts              # Type definitions
│   └── tools/                # MCP tools
│       ├── datasource.ts     # Data source tools
│       └── query.ts          # Query execution tools
├── tests/                    # Test files
├── scripts/                  # Build scripts
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
├── Dockerfile                # Docker configuration
├── compose.yaml              # Docker Compose configuration
└── package.json
```

## 📦 Scripts

- `pnpm dev`: Watch mode for development
- `pnpm build`: Build for production
- `pnpm test`: Run tests
- `pnpm test:coverage`: Run tests with coverage report
- `pnpm lint`: Lint code
- `pnpm format`: Format code
- `pnpm ci`: Run all quality checks

## 🏗 Tech Stack

- **Runtime**: Node.js 22+ with ES Modules
- **Language**: TypeScript 5.7+ (strict mode)
- **Build Tool**: Vite 6.x
- **Package Manager**: pnpm 9.x
- **Testing**: Vitest 3.x with coverage
- **Linting**: ESLint 9.x (Flat Config)
- **Formatting**: Prettier 3.x
- **MCP SDK**: @modelcontextprotocol/sdk 1.x

## 📦 Docker Images

Pre-built Docker images are available on Docker Hub:

- **Latest stable**: `jasonsmithj/redash-mcp:latest`
- **Specific version**: `jasonsmithj/redash-mcp:v1.0.0`
- **Major version**: `jasonsmithj/redash-mcp:1`

### Supported Platforms

Multi-architecture images are automatically built for both platforms:

- **`linux/amd64`** (x86_64) - Intel/AMD CPUs
  - Windows PCs
  - Intel-based Macs
  - Traditional Linux servers
- **`linux/arm64`** (ARM64) - ARM CPUs
  - **Apple Silicon Macs (M1/M2/M3/M4)**
  - ARM-based Linux servers
  - Raspberry Pi 4+ (64-bit)

Docker will automatically pull the correct image for your platform!

## 🚀 Releasing

To release a new version:

1. Update version in `package.json`
2. Commit changes: `git commit -am "chore: bump version to vX.Y.Z"`
3. Create and push tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. GitHub Actions will automatically build and push to Docker Hub

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run quality checks: `pnpm ci`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TDD (Test-Driven Development) approach
- Write tests before implementation
- Maintain test coverage above 85%
- Use conventional commits
- Add JSDoc comments for public APIs
- All code comments should be in English

### Setting up GitHub Secrets for CD

To enable automated Docker Hub publishing, add the following secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token

For enhanced security, use a Docker Hub access token instead of your password:

1. Log in to [Docker Hub](https://hub.docker.com)
2. Go to **Account Settings** → **Security** → **New Access Token**
3. Generate a token with "Read, Write, Delete" permissions
4. Use this token as `DOCKER_PASSWORD`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/jasonsmithj/redash-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jasonsmithj/redash-mcp/discussions)

---

Made with ❤️ by the Redash MCP community