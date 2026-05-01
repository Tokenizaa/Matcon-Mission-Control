# Script de parada do Matcon Chatwoot + n8n
# Execute: .\stop.ps1

Write-Host "🛑 Parando Matcon Chatwoot + n8n..." -ForegroundColor Cyan

docker-compose down

Write-Host "✅ Serviços parados!" -ForegroundColor Green
