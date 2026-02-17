-- Conectar a paas_db antes de ejecutar
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS paas_core;

-- 1. ENUMS
CREATE TYPE paas_core.user_role AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE paas_core.project_status AS ENUM ('DRAFT', 'WAITING_USER_CONFIRMATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DEPLOYING', 'DEPLOYED', 'FAILED', 'TERMINATING', 'TERMINATED');
CREATE TYPE paas_core.user_action_type AS ENUM ('ENABLE_USER', 'DISABLE_USER', 'UPDATE_QUOTA', 'UPDATE_PROFILE', 'LOGICAL_DELETE');
CREATE TYPE paas_core.project_action_type AS ENUM ('CREATE', 'APPROVE', 'REJECT', 'DEPLOY_START', 'DEPLOY_SUCCESS', 'DEPLOY_FAILED', 'REDEPLOY', 'REDEPLOY_START', 'REDEPLOY_SUCCESS', 'REDEPLOY_FAILED', 'TERMINATE', 'DELETE');
CREATE TYPE paas_core.app_architecture AS ENUM ('DB_STANDALONE', 'BACKEND_STANDALONE', 'FRONTEND_STANDALONE', 'MONOLITH', 'BACKEND_DB', 'MONOLITH_DB', 'THREE_TIER');
CREATE TYPE paas_core.quota_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. TABLAS

-- Users
CREATE TABLE paas_core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50),
    email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role paas_core.user_role NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP,
    quota_cpu_limit DECIMAL(8,2) DEFAULT 2.0, -- Ejemplo default
    quota_memory_limit_mb INT DEFAULT 2048,   -- Ejemplo default 2GB
    quota_storage_limit_mb INT DEFAULT 5120,  -- Ejemplo default 5GB
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Partial Indexes para Unicidad (Solo si no está borrado)
CREATE UNIQUE INDEX idx_users_email_active ON paas_core.users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_code_active ON paas_core.users(code) WHERE deleted_at IS NULL;

-- Quota Requests
CREATE TABLE paas_core.quota_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES paas_core.users(id),
    quota_cpu_request DECIMAL(8,2),
    quota_memory_request_mb INT,
    quota_storage_request_mb INT,
    justification TEXT NOT NULL,
    status paas_core.quota_status DEFAULT 'PENDING',
    admin_response TEXT,
    reviewed_by_user_id UUID REFERENCES paas_core.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Projects
CREATE TABLE paas_core.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES paas_core.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    namespace_name VARCHAR(255) NOT NULL UNIQUE, -- Globalmente único en K8s
    architecture paas_core.app_architecture NOT NULL,
    docker_compose_content TEXT,
    generated_manifests JSONB,
    req_cpu DECIMAL(8,2) DEFAULT 0,
    req_memory_mb INT DEFAULT 0,
    req_storage_mb INT DEFAULT 0,
    status paas_core.project_status DEFAULT 'DRAFT',
    access_urls JSONB,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Partial Index Project Name per User
CREATE UNIQUE INDEX idx_projects_name_user ON paas_core.projects(user_id, name) WHERE deleted_at IS NULL;

-- Audit Logs (User)
CREATE TABLE paas_core.user_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    affected_user_id UUID REFERENCES paas_core.users(id),
    performed_by_user_id UUID REFERENCES paas_core.users(id),
    action paas_core.user_action_type NOT NULL,
    details TEXT,
    previous_state JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs (Project)
CREATE TABLE paas_core.project_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id UUID REFERENCES paas_core.projects(id),
    previous_status paas_core.project_status,
    new_status paas_core.project_status,
    changed_by_user_id UUID REFERENCES paas_core.users(id),
    action paas_core.project_action_type NOT NULL,
    reason TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
