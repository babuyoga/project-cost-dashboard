# Docker Deployment Guide

Complete guide to build, push, and deploy the Cost Dashboard using Docker.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Docker Hub](https://hub.docker.com/) account (free tier works)
- Git installed
- Logged in: `docker login` (should print "Login Succeeded")

---

## 1. Clone & Configure

```bash
# Clone the repository
git clone <your-repo-url> cost-dashboard
cd cost-dashboard

# Create your environment file from the template
cp .env.example .env
```

Edit `.env` with your values:

```env
# --- Backend: Database (SQL Server) ---
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host          # e.g. 10.0.1.50 or sql-server.company.com
DB_NAME=your_db_name
DB_DRIVER=ODBC Driver 18 for SQL Server

# --- Backend: Mode ---
# Set to true to use built-in XLSX dummy data (no database required)
TEST_MODE=false

# --- Backend: LLM API (optional — enables AI chat feature) ---
LLM_API_URL=https://your-llm-api.com/v1/generate
LLM_API_KEY=your_api_key_here

# --- Frontend: Admin Credentials ---
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### Environment Variables Reference

| Variable         | Required | Service  | Description                                                 |
| ---------------- | -------- | -------- | ----------------------------------------------------------- |
| `DB_USER`        | Yes\*    | Backend  | SQL Server username                                         |
| `DB_PASSWORD`    | Yes\*    | Backend  | SQL Server password                                         |
| `DB_HOST`        | Yes\*    | Backend  | SQL Server host/IP                                          |
| `DB_NAME`        | Yes\*    | Backend  | SQL Server database name                                    |
| `DB_DRIVER`      | No       | Backend  | ODBC driver name (default: `ODBC Driver 18 for SQL Server`) |
| `TEST_MODE`      | No       | Backend  | Set to `true` to use dummy XLSX data instead of a database  |
| `LLM_API_URL`    | No       | Backend  | External LLM API endpoint for AI chat                       |
| `LLM_API_KEY`    | No       | Backend  | Bearer token for the LLM API                                |
| `ADMIN_USERNAME` | Yes      | Frontend | Admin login username                                        |
| `ADMIN_PASSWORD` | Yes      | Frontend | Admin login password                                        |

> \*Not required if `TEST_MODE=true`

> **Note:** `API_URL` is set automatically inside Docker (`http://backend:8000`) — you don't need to configure it.

---

## 2. Build Docker Images

Replace `yourdockerhubusername` with your actual Docker Hub username throughout:

```bash
# Build both images using docker compose
docker compose build

# Or build them individually with custom tags
docker build -t yourdockerhubusername/cost-dashboard-backend:latest ./backend-api
docker build -t yourdockerhubusername/cost-dashboard-frontend:latest ./nextjs-frontend
```

> **First build** takes ~5 minutes (ODBC driver install + npm install). Subsequent builds are cached.

### Verify the images were created

```bash
docker images | grep cost-dashboard
```

Expected output:

```
yourdockerhubusername/cost-dashboard-backend    latest   abc123   1 minute ago   850MB
yourdockerhubusername/cost-dashboard-frontend   latest   def456   1 minute ago   250MB
```

---

## 3. Test Locally

```bash
# Start both containers
docker compose up -d

# Check they're running
docker ps

# Test backend health
curl http://localhost:8000/health
# → {"status":"healthy"}

# Open the dashboard
open http://localhost:3000

# View logs if something isn't working
docker logs dashboard-backend
docker logs dashboard-frontend

# Stop everything
docker compose down
```

---

## 4. Push to Docker Hub

```bash
# Tag the images (if you built with docker compose, they need tagging)
docker tag cost-dashboard-backend yourdockerhubusername/cost-dashboard-backend:latest
docker tag cost-dashboard-frontend yourdockerhubusername/cost-dashboard-frontend:latest

# Push both images
docker push yourdockerhubusername/cost-dashboard-backend:latest
docker push yourdockerhubusername/cost-dashboard-frontend:latest
```

### Version tagging (recommended)

```bash
# Also tag with a version number
docker tag yourdockerhubusername/cost-dashboard-backend:latest yourdockerhubusername/cost-dashboard-backend:1.0.0
docker tag yourdockerhubusername/cost-dashboard-frontend:latest yourdockerhubusername/cost-dashboard-frontend:1.0.0

docker push yourdockerhubusername/cost-dashboard-backend:1.0.0
docker push yourdockerhubusername/cost-dashboard-frontend:1.0.0
```

---

## 5. Pull & Run on Any Machine

On a fresh machine that has Docker installed:

### Step 1: Pull the images

```bash
docker pull yourdockerhubusername/cost-dashboard-backend:latest
docker pull yourdockerhubusername/cost-dashboard-frontend:latest
```

### Step 2: Create the environment file

```bash
cat > .env << 'EOF'
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_DRIVER=ODBC Driver 18 for SQL Server
TEST_MODE=false
LLM_API_URL=
LLM_API_KEY=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
EOF
```

### Step 3: Create a docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
services:
  frontend:
    image: yourdockerhubusername/cost-dashboard-frontend:latest
    container_name: dashboard-frontend
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      - API_URL=http://backend:8000
      - SQLITE_DB_PATH=/app/data/cost-dashboard.db
    volumes:
      - frontend_data:/app/data
    depends_on:
      - backend
    networks:
      - dashboard-network
    restart: always

  backend:
    image: yourdockerhubusername/cost-dashboard-backend:latest
    container_name: dashboard-backend
    env_file: .env
    networks:
      - dashboard-network
    restart: always

networks:
  dashboard-network:
    driver: bridge

volumes:
  frontend_data:
EOF
```

### Step 4: Run

```bash
docker compose up -d
```

The dashboard is now running at **http://localhost:3000**.

---

## Quick Reference

| Action                      | Command                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| Build images                | `docker compose build`                                            |
| Start containers            | `docker compose up -d`                                            |
| Stop containers             | `docker compose down`                                             |
| View backend logs           | `docker logs -f dashboard-backend`                                |
| View frontend logs          | `docker logs -f dashboard-frontend`                               |
| Rebuild after code changes  | `docker compose up --build -d`                                    |
| Push images                 | `docker push yourdockerhubusername/cost-dashboard-backend:latest` |
| Pull images                 | `docker pull yourdockerhubusername/cost-dashboard-backend:latest` |
| Check running containers    | `docker ps`                                                       |
| Enter backend shell         | `docker exec -it dashboard-backend bash`                          |
| Check env vars in container | `docker exec dashboard-backend env \| grep DB_`                   |

---

## Architecture

```
┌──────────────────────────┐
│    Browser (:3000)       │
└──────────┬───────────────┘
           │
    ┌──────▼──────────────────┐
    │  Frontend Container     │
    │  (Next.js / Node 20)    │
    │  Port: 3000             │
    │  SQLite: /app/data/     │
    └──────┬──────────────────┘
           │ API_URL=http://backend:8000
    ┌──────▼──────────────────┐
    │  Backend Container      │
    │  (FastAPI / Python 3.12)│
    │  Port: 8000 (internal)  │
    │  ODBC → SQL Server      │
    └──────┬──────────────────┘
           │
    ┌──────▼──────────────────┐
    │  SQL Server Database    │
    │  (external, your host)  │
    └─────────────────────────┘
```

> The backend port (8000) is **not exposed** to the host — only the frontend container can reach it via the Docker network. Only port 3000 is exposed to the outside.

---

## Troubleshooting

| Issue                               | Check                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| "Connection refused" on port 3000   | `docker ps` — is the frontend container running?                                            |
| Backend can't reach database        | Verify `DB_HOST` is reachable from inside Docker. Use the host IP, not `localhost`.         |
| "ODBC Driver not found"             | The Dockerfile installs `msodbcsql18`. Set `DB_DRIVER=ODBC Driver 18 for SQL Server`.       |
| AI chat says "not configured"       | Set `LLM_API_URL` and `LLM_API_KEY` in `.env` and restart: `docker compose restart backend` |
| Changes to `.env` not taking effect | Run `docker compose down && docker compose up -d` (env is read at container start)          |
| Need to rebuild after code changes  | `docker compose up --build -d`                                                              |
