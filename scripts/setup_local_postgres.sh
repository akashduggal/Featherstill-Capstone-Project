#!/usr/bin/env bash
# Simple idempotent installer + migrator for local Postgres on EC2.
# Edit DB_USER/DB_PASS/DB_NAME/REPO_DIR at top before running if desired.

set -euo pipefail

# Config — edit if needed
DB_USER="${DB_USER:-appuser}"
DB_PASS="${DB_PASS:-ChangeMeNow!}"
DB_NAME="${DB_NAME:-postgres}"
REPO_DIR="${REPO_DIR:-/home/ec2-user/Featherstill-Capstone-Project}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$REPO_DIR/backend/migrations}"
EXPORT_PG_PATH="/tmp/initial_db_setup_$(date +%F).log"

echo "[setup] Using REPO_DIR=${REPO_DIR}"
echo "[setup] This script will install Postgres, create DB/user, run migrations and enable service."
read -p "Proceed? (y/N) " yn
if [[ "${yn:-n}" != "y" && "${yn:-n}" != "Y" ]]; then
  echo "Aborted by user."
  exit 1
fi

# Detect distro
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID="${ID:-unknown}"
  OS_ID_LIKE="${ID_LIKE:-}"
else
  echo "Cannot detect OS. Exiting."
  exit 1
fi

install_postgres_amazon_linux() {
  echo "[setup] Installing Postgres (Amazon Linux 2) ..."
  sudo yum update -y
  sudo amazon-linux-extras enable postgresql13
  sudo yum clean metadata
  sudo yum install -y postgresql-server postgresql-contrib
  sudo /usr/bin/postgresql-setup --initdb
  sudo systemctl enable --now postgresql
}

install_postgres_ubuntu() {
  echo "[setup] Installing Postgres (Ubuntu/Debian) ..."
  sudo apt update
  sudo apt install -y postgresql postgresql-contrib
  sudo systemctl enable --now postgresql
}

# Install appropriate package
if [[ "$OS_ID" == "amzn" || "$OS_ID_LIKE" == *"rhel"* || "$OS_ID" == "amazon" ]]; then
  install_postgres_amazon_linux
elif [[ "$OS_ID" == "ubuntu" || "$OS_ID_LIKE" == *"debian"* ]]; then
  install_postgres_ubuntu
else
  echo "[setup] Unknown distro ($OS_ID). Attempting apt-get install (may fail)..."
  sudo apt update || true
  sudo apt install -y postgresql postgresql-contrib || {
    echo "Install failed. Please install Postgres manually for your distro."
    exit 1
  }
fi

# Ensure service started
sudo systemctl restart postgresql
sleep 2
sudo systemctl status postgresql --no-pager || true

# Create DB user and DB (idempotent)
echo "[setup] Creating DB user and database (if not existing)..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<-SQL >>"${EXPORT_PG_PATH}" 2>&1
-- create user if not exists
DO
\$do\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
   END IF;
END
\$do\$;

-- create database if not exists and grant owner
SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\gexec
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
SQL

echo "[setup] Created/verified DB user and DB. (log: ${EXPORT_PG_PATH})"

# Run migrations SQL files found in migrations dir in alphabetical order
if [ -d "${MIGRATIONS_DIR}" ]; then
  echo "[setup] Running SQL migrations from ${MIGRATIONS_DIR} ..."
  # iterate only *.sql files
  for f in $(ls "${MIGRATIONS_DIR}"/*.sql 2>/dev/null | sort); do
    echo "[setup] Applying ${f} ..."
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" -f "${f}" >>"${EXPORT_PG_PATH}" 2>&1 || {
      echo "[setup] Migration failed: ${f}. See ${EXPORT_PG_PATH} for details."
      exit 1
    }
  done
else
  echo "[setup] No migrations dir found at ${MIGRATIONS_DIR}; skipping migration step."
fi

# Create .env in backend if not present
ENV_FILE="${REPO_DIR}/backend/.env"
if [ -f "${ENV_FILE}" ]; then
  echo "[setup] .env already exists at ${ENV_FILE}, leaving unchanged."
else
  echo "[setup] Creating backend/.env with local DB credentials at ${ENV_FILE} ..."
  cat > "${ENV_FILE}" <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
# Optional SSL settings for local: keep unset or false
DB_REQUIRE_SSL=false
DB_SSL_STRICT=false
EOF
  echo "[setup] Created ${ENV_FILE} (edit if you need different credentials)."
fi

# Final checks
echo "[setup] Verifying table battery_readings exists (if migration created it)..."
sudo -u postgres psql -d "${DB_NAME}" -c "\d+ battery_readings" || echo "[setup] Table battery_readings not found (check migrations)."

echo "[setup] Done. Review ${EXPORT_PG_PATH} for detailed output. Restart your backend and test API POSTs."