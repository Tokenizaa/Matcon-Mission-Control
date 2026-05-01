# Script de inicializacao do Supabase Docker
# Execute: .supabase-start.ps1

Write-Host "Iniciando Supabase Docker..." -ForegroundColor Cyan

# Verificar se .env existe
if (-not (Test-Path ".\supabase\.env")) {
    Write-Host "Arquivo .env nao encontrado. Criando..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path ".\supabase"
    
    $envContent = @"
# Supabase Docker Configuration

# PostgreSQL
POSTGRES_PASSWORD=matcon_supabase_postgres_secure_2026

# JWT Secret (use at least 32 characters)
JWT_SECRET=matcon_supabase_jwt_secret_key_change_me_please_generate_new

# API Keys (default keys for local development)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
"@
    
    $envContent | Out-File -FilePath ".\supabase\.env" -Encoding utf8
    Write-Host "Arquivo .env criado" -ForegroundColor Green
}

# Substituir senhas no docker-compose
$envFile = Get-Content ".\supabase\.env" | ConvertFrom-StringData
$postgresPassword = $envFile.POSTGRES_PASSWORD
$jwtSecret = $envFile.JWT_SECRET

Write-Host "Atualizando docker-compose com senhas..." -ForegroundColor Cyan
$composeFile = Get-Content "supabase-docker-compose.yml"
$composeFile = $composeFile -replace "your-super-secret-and-long-postgres-password", $postgresPassword
$composeFile = $composeFile -replace "your-super-secret-jwt-token-with-at-least-32-characters-long", $jwtSecret
$composeFile | Out-File "supabase-docker-compose.yml" -Encoding utf8

# Iniciar containers
Write-Host "Iniciando containers Docker..." -ForegroundColor Cyan
docker-compose -f supabase-docker-compose.yml up -d

# Aguardar serviços ficarem healthy
Write-Host "Aguardando serviços ficarem saudaveis..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Verificar status
Write-Host ""
Write-Host "Status dos servicos:" -ForegroundColor Green
docker-compose -f supabase-docker-compose.yml ps

Write-Host ""
Write-Host "Supabase iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Acesse os servicos:" -ForegroundColor Cyan
Write-Host "  Supabase Studio:  http://localhost:3002" -ForegroundColor White
Write-Host "  API Gateway:      http://localhost:8000" -ForegroundColor White
Write-Host "  PostgreSQL:       localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Credenciais:" -ForegroundColor Yellow
Write-Host "  URL:       http://localhost:8000" -ForegroundColor White
Write-Host "  Anon Key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs: docker-compose -f supabase-docker-compose.yml logs -f" -ForegroundColor Gray
