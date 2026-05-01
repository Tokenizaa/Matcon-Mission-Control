# Script para migrar dados do Supabase Cloud para o banco local
# Executa todas as migrations SQL no container supabase-db

$MigrationsPath = "..\supabase\migrations"
$ContainerName = "supabase-db"

Write-Host "Aplicando migrations no banco local..." -ForegroundColor Yellow

# Verificar se o container está rodando
$containerCheck = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if ($containerCheck -ne $ContainerName) {
    Write-Host "Container $ContainerName não está rodando. Iniciando..." -ForegroundColor Red
    docker-compose up -d supabase-db
    Start-Sleep -Seconds 5
}

# Listar e ordenar arquivos de migration
$migrations = Get-ChildItem -Path $MigrationsPath -Filter "*.sql" | Sort-Object Name

foreach ($migration in $migrations) {
    Write-Host "Aplicando: $($migration.Name)" -ForegroundColor Cyan
    
    # Copiar arquivo para dentro do container e executar
    docker cp $migration.FullName "${ContainerName}:/tmp/migration.sql"
    docker exec $ContainerName psql -U postgres -d postgres -f /tmp/migration.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ OK" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Falhou" -ForegroundColor Red
    }
}

Write-Host "`nMigrations aplicadas!" -ForegroundColor Green
Write-Host "Banco local: localhost:5436" -ForegroundColor Yellow
