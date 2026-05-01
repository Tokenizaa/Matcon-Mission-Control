# Script de inicialização rápida do Matcon Chatwoot + n8n
# Execute: .\start.ps1

Write-Host "🚀 Iniciando Matcon Chatwoot + n8n..." -ForegroundColor Cyan

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado. Gerando chaves..." -ForegroundColor Yellow
    .\generate-secrets.ps1
}

# Iniciar containers
Write-Host "📦 Iniciando containers Docker..." -ForegroundColor Cyan
docker-compose up -d

# Aguardar serviços ficarem healthy
Write-Host "⏳ Aguardando serviços ficarem saudáveis..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Verificar status
Write-Host ""
Write-Host "📊 Status dos serviços:" -ForegroundColor Green
docker-compose ps

Write-Host ""
Write-Host "✅ Instalação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Acesse os serviços:" -ForegroundColor Cyan
Write-Host "  Chatwoot:  http://localhost:3001" -ForegroundColor White
Write-Host "  n8n:       http://localhost:5679" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para ver logs: docker-compose logs -f" -ForegroundColor Gray
