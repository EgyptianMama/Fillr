# RepoLens - Deployment

## 1. Deployment Target

RepoLens is deployed to **Oracle Cloud Always Free** to keep running costs at zero.

| Resource | Spec | Cost |
|---|---|---|
| Compute | VM.Standard.A1.Flex — 4 ARM OCPUs, 24 GB RAM | Free forever |
| Disk | 50 GB boot + 50 GB block volume | Free forever |
| Network | 10 TB/month outbound | Free forever |
| Domain | DuckDNS subdomain (e.g., `repolens.duckdns.org`) | Free forever |
| TLS | Let's Encrypt via Caddy (automatic) | Free forever |
| CI/CD | GitHub Actions (public repo) | Free forever |

## 2. Architecture

```text
Internet
   │
   ▼
┌──────────────────────────────────────────┐
│  Oracle Cloud ARM VM (4 OCPU, 24 GB)     │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Docker Compose                    │  │
│  │                                    │  │
│  │  Caddy (:80/:443) ──→ API (:8000) │  │
│  │                         │          │  │
│  │  Worker (poll loop) ────┤          │  │
│  │                         ▼          │  │
│  │                     Postgres       │  │
│  │                      (:5432)       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Ports open: 22, 80, 443                 │
└──────────────────────────────────────────┘
```

## 3. Prerequisites

- Oracle Cloud account (Always Free tier, requires credit card for verification, charges $0).
- GitHub repository (public, for free CI/CD).
- DuckDNS account (optional, for free subdomain).
- SSH key pair for VM access.

## 4. Oracle Cloud VM Setup

### 4.1 Create the Instance

1. Log in to Oracle Cloud Console.
2. Navigate to Compute → Instances → Create Instance.
3. Configure:
   - **Name:** repolens
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** VM.Standard.A1.Flex
   - **OCPU:** 4
   - **Memory:** 24 GB
   - **Boot volume:** 50 GB
   - **Network:** Create new VCN or use default, assign public IP
   - **SSH key:** Upload your public key
4. Click Create.

### 4.2 Open Firewall Ports

In the VCN Security List, add ingress rules:

| Source | Protocol | Dest Port | Description |
|---|---|---|---|
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |
| `0.0.0.0/0` | TCP | 22 | SSH (already open by default) |

Also open these ports in the VM's iptables:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 4.3 Install Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y docker.io docker-compose-v2 git
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

### 4.4 Set Up DuckDNS (Optional)

1. Go to https://www.duckdns.org and sign in.
2. Create a subdomain (e.g., `repolens`).
3. Point it to the VM's public IP address.

## 5. Application Deployment

### 5.1 Clone and Configure

```bash
git clone https://github.com/YOUR_USER/RepoLens.git /opt/repolens
cd /opt/repolens
cp .env.example .env
```

Edit `.env` with production values:

```bash
POSTGRES_PASSWORD=<generate_a_strong_password>
DATABASE_URL=postgresql+asyncpg://repolens:<password>@postgres:5432/repolens
DATABASE_URL_SYNC=postgresql+psycopg2://repolens:<password>@postgres:5432/repolens
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=<your_gemini_api_key>
DOMAIN=repolens.duckdns.org
```

### 5.2 Start Services

```bash
cd /opt/repolens
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec api alembic upgrade head
```

### 5.3 Verify

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check API health
curl http://localhost:8000/health

# Check HTTPS (after DNS propagation)
curl https://repolens.duckdns.org/health
```

## 6. Reverse Proxy — Caddy

Caddy is used instead of Nginx because it automatically provisions and renews Let's Encrypt TLS certificates with zero configuration.

**Caddyfile:**

```text
{$DOMAIN:localhost} {
    reverse_proxy api:8000
}
```

When `DOMAIN` is set to a real hostname (e.g., `repolens.duckdns.org`), Caddy will:
1. Automatically request a TLS certificate from Let's Encrypt.
2. Redirect HTTP to HTTPS.
3. Renew certificates before expiry.
4. Proxy all traffic to the FastAPI app on port 8000.

No manual Certbot setup or cron renewal is needed.

## 7. Systemd Auto-Start

Create `/etc/systemd/system/repolens.service`:

```ini
[Unit]
Description=RepoLens Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/repolens
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable repolens
```

After this, RepoLens will start automatically when the VM boots.

## 8. CI/CD — GitHub Actions

### 8.1 CI Pipeline

Runs on every push and pull request:
- Starts a Postgres service container.
- Installs dependencies.
- Runs Alembic migrations.
- Runs `pytest`.
- Runs `ruff check`.

### 8.2 Deploy Pipeline

Runs on push to `main`:
- SSHes into the Oracle Cloud VM.
- Pulls the latest code.
- Rebuilds Docker images.
- Restarts services.
- Runs migrations.

**Required GitHub Secrets:**

| Secret | Value |
|---|---|
| `VM_HOST` | Public IP of the Oracle Cloud VM |
| `SSH_PRIVATE_KEY` | SSH private key for the `ubuntu` user |

## 9. Backups

Daily Postgres backup via cron:

```bash
# /opt/repolens/scripts/backup.sh
#!/bin/bash
BACKUP_DIR="/opt/repolens/backups"
mkdir -p "$BACKUP_DIR"
docker compose -f /opt/repolens/docker-compose.prod.yml exec -T postgres \
    pg_dump -U repolens repolens | gzip > "$BACKUP_DIR/repolens_$(date +%Y%m%d).sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /opt/repolens/scripts/backup.sh
crontab -e
# Add: 0 3 * * * /opt/repolens/scripts/backup.sh
```

To restore:

```bash
gunzip -c backups/repolens_20260627.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T postgres psql -U repolens repolens
```

## 10. Updating the Application

```bash
cd /opt/repolens
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec api alembic upgrade head
```

Or let the GitHub Actions deploy workflow handle it automatically on merge to `main`.

## 11. Monitoring

Basic monitoring through Docker and application logs:

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View API logs only
docker compose -f docker-compose.prod.yml logs -f api

# View worker logs only
docker compose -f docker-compose.prod.yml logs -f worker

# Check container resource usage
docker stats
```

Application-level observability is provided through:
- Structured JSON logs with `repo_id`, `job_id`, `stage`, and `duration_ms`.
- Job progress visible through `GET /jobs/{job_id}`.
- Worker heartbeat via `updated_at` timestamp.
- Ingestion summary counts after each job completes.

## 12. Fallback Deployment (Render + Neon)

If Oracle Cloud is unavailable, the application can be deployed using:

| Component | Provider | Free Tier |
|---|---|---|
| API + Worker | Render (web service) | 1 free service (sleeps after 15 min inactivity) |
| Postgres | Neon | 0.5 GB storage, always free |

This requires merging the worker into the API process using FastAPI's lifespan event. The code supports this via a `MERGE_WORKER=true` environment variable.
