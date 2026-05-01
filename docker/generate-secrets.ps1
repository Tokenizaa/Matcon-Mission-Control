# Script para gerar chaves seguras para o Matcon Chatwoot + n8n
# Execute: .\generate-secrets.ps1

# Gerar SECRET_KEY_BASE (64 caracteres hexadecimais)
$secretKeyBase = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# Gerar senha PostgreSQL Chatwoot (32 caracteres)
$postgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Gerar senha Redis (32 caracteres)
$redisPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Gerar API Key Baileys (64 caracteres)
$baileysApiKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# Gerar senha PostgreSQL n8n (32 caracteres)
$n8nPostgresPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Gerar N8N Encryption Key (32 caracteres)
$n8nEncryptionKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Gerar Supabase JWT Secret (mínimo 32 caracteres)
$supabaseJwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})

# Gerar Supabase DB Password (32 caracteres)
$supabaseDbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Atualizar arquivo .env
$envContent = @"
# ==========================================
# Matcon Chatwoot + n8n - Variáveis de Ambiente
# ==========================================

# Chatwoot Frontend URL
MATCON_FRONTEND_URL=http://localhost:3001

# Chatwoot PostgreSQL
MATCON_POSTGRES_DB=matcon_chatwoot_production
MATCON_POSTGRES_USER=matcon_chatwoot_user
MATCON_POSTGRES_PASSWORD=$postgresPassword

# Chatwoot Secret Key Base
MATCON_SECRET_KEY_BASE=$secretKeyBase

# Redis
MATCON_REDIS_PASSWORD=$redisPassword

# Baileys Provider (WhatsApp)
MATCON_BAILEYS_CLIENT_NAME=matcon_whatsapp
MATCON_BAILEYS_API_KEY=$baileysApiKey

# Log Levels
MATCON_LOG_LEVEL=info
MATCON_BAILEYS_LOG_LEVEL=error

# n8n Configuration
MATCON_N8N_HOST=localhost
MATCON_N8N_URL=http://localhost:5679
MATCON_N8N_ENCRYPTION_KEY=$n8nEncryptionKey
MATCON_N8N_POSTGRES_PASSWORD=$n8nPostgresPassword

# Supabase Configuration
SUPABASE_DB_PASSWORD=$supabaseDbPassword
SUPABASE_JWT_SECRET=$supabaseJwtSecret
SUPABASE_SITE_URL=http://localhost:3000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24ifQ.test
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.test
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8

Write-Host "✓ Chaves geradas com sucesso!" -ForegroundColor Green
Write-Host "✓ Arquivo .env atualizado" -ForegroundColor Green
Write-Host ""
Write-Host "Chaves geradas:" -ForegroundColor Yellow
Write-Host "  SECRET_KEY_BASE: $secretKeyBase"
Write-Host "  POSTGRES_PASSWORD: $postgresPassword"
Write-Host "  REDIS_PASSWORD: $redisPassword"
Write-Host "  BAILEYS_API_KEY: $baileysApiKey"
Write-Host "  N8N_POSTGRES_PASSWORD: $n8nPostgresPassword"
Write-Host "  N8N_ENCRYPTION_KEY: $n8nEncryptionKey"
Write-Host "  SUPABASE_DB_PASSWORD: $supabaseDbPassword"
Write-Host "  SUPABASE_JWT_SECRET: $supabaseJwtSecret"
Write-Host ""
Write-Host "⚠️  Guarde estas chaves em local seguro!" -ForegroundColor Red
