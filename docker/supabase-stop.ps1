# Script de parada do Supabase Docker
# Execute: .\supabase-stop.ps1

Write-Host "🛑 Parando Supabase Docker..." -ForegroundColor Cyan

docker-compose -f supabase-docker-compose.yml down

Write-Host "✅ Serviços parados!" -ForegroundColor Green
