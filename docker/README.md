# Matcon Chatwoot + n8n - Instalação Exclusiva

Instalação Docker exclusiva do Chatwoot e n8n para o projeto Matcon, com bancos de dados dedicados e isolados da instalação existente.

## 📋 Estrutura

- **Chatwoot**: Sistema de atendimento ao cliente com integração WhatsApp (Baileys)
- **n8n**: Plataforma de automação de workflows
- **Bancos de Dados**: PostgreSQL dedicados para Chatwoot e n8n
- **Redis**: Cache dedicado para Chatwoot

## 🔧 Pré-requisitos

- Docker Desktop instalado e rodando
- PowerShell (Windows)

## 🚀 Instalação

### 1. Gerar Chaves Seguras

Execute o script para gerar chaves criptográficas seguras:

```powershell
cd docker
.\generate-secrets.ps1
```

Isso irá gerar e atualizar o arquivo `.env` com:
- SECRET_KEY_BASE (Chatwoot)
- Senhas dos bancos PostgreSQL
- Senha do Redis
- API Key do Baileys
- Chave de criptografia do n8n

### 2. Iniciar os Serviços

```powershell
docker-compose up -d
```

### 3. Verificar Status

```powershell
docker-compose ps
```

Todos os serviços devem aparecer como "healthy".

## 🌐 Portas Utilizadas

| Serviço | Porta Host | Porta Container | URL Local |
|---------|-------------|-----------------|-----------|
| Chatwoot Rails | 3001 | 3000 | http://localhost:3001 |
| n8n | 5679 | 5678 | http://localhost:5679 |
| PostgreSQL Chatwoot | 5434 | 5432 | localhost:5434 |
| PostgreSQL n8n | 5435 | 5432 | localhost:5435 |
| Redis | 6381 | 6379 | localhost:6381 |

## 📦 Containers

### Chatwoot
- **matcon-chatwoot-rails**: Aplicação web Rails
- **matcon-chatwoot-sidekiq**: Processador de jobs em background
- **matcon-baileys-api**: Integração WhatsApp

### n8n
- **matcon-n8n**: Plataforma de automação

### Infraestrutura
- **matcon-chatwoot-postgres**: PostgreSQL com pgvector para Chatwoot
- **matcon-n8n-postgres**: PostgreSQL dedicado para n8n
- **matcon-redis**: Redis para cache e filas

## 💾 Volumes Docker

Volumes persistentes criados automaticamente:
- `matcon_storage`: Arquivos do Chatwoot (uploads, etc)
- `matcon_postgres_data`: Dados do PostgreSQL Chatwoot
- `matcon_postgres_n8n_data`: Dados do PostgreSQL n8n
- `matcon_redis_data`: Dados do Redis
- `matcon_n8n_data`: Dados do n8n

## 🔒 Segurança

As senhas e chaves são geradas automaticamente pelo script `generate-secrets.ps1`. Mantenha o arquivo `.env` seguro e não o commit no versionamento.

## 📝 Comandos Úteis

### Iniciar serviços
```powershell
docker-compose up -d
```

### Parar serviços
```powershell
docker-compose down
```

### Reiniciar serviços
```powershell
docker-compose restart
```

### Ver logs
```powershell
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f matcon-rails
docker-compose logs -f matcon-sidekiq
docker-compose logs -f matcon-n8n
```

### Acessar banco PostgreSQL Chatwoot
```powershell
docker exec -it matcon-chatwoot-postgres psql -U matcon_chatwoot_user -d matcon_chatwoot_production
```

### Acessar banco PostgreSQL n8n
```powershell
docker exec -it matcon-n8n-postgres psql -U matcon_n8n_user -d matcon_n8n
```

### Acessar Redis
```powershell
docker exec -it matcon-redis redis-cli -a $env:MATCON_REDIS_PASSWORD
```

### Backup dos bancos
```powershell
# Backup Chatwoot
docker exec matcon-chatwoot-postgres pg_dump -U matcon_chatwoot_user matcon_chatwoot_production > backup_chatwoot.sql

# Backup n8n
docker exec matcon-n8n-postgres pg_dump -U matcon_n8n_user matcon_n8n > backup_n8n.sql
```

### Restaurar bancos
```powershell
# Restaurar Chatwoot
docker exec -i matcon-chatwoot-postgres psql -U matcon_chatwoot_user matcon_chatwoot_production < backup_chatwoot.sql

# Restaurar n8n
docker exec -i matcon-n8n-postgres psql -U matcon_n8n_user matcon_n8n < backup_n8n.sql
```

## 🔧 Configuração Inicial do Chatwoot

1. Acesse http://localhost:3001
2. Crie a conta de super administrador
3. Configure as integrações necessárias
4. Configure o canal WhatsApp via Baileys API

## 🔧 Configuração Inicial do n8n

1. Acesse http://localhost:5679
2. Crie a conta de administrador
3. Configure as credenciais necessárias
4. Crie seus workflows de automação

## 🐛 Troubleshooting

### Serviços não iniciam
```powershell
# Ver logs
docker-compose logs

# Recriar containers
docker-compose down
docker-compose up -d --force-recreate
```

### Problemas de permissão
```powershell
# No Windows, execute PowerShell como Administrador
```

### Portas já em uso
As portas foram configuradas para evitar conflitos com a instalação existente:
- Chatwoot: 3001 (existente usa 3000)
- n8n: 5679 (existente usa 5678)
- PostgreSQL Chatwoot: 5434 (existente usa 5432)
- PostgreSQL n8n: 5435 (existente usa 5433)
- Redis: 6381 (existente usa 6380)

Se ainda houver conflito, edite `docker-compose.yml` e altere as portas.

## 📊 Monitoramento

### Health checks
Todos os serviços possuem health checks configurados. Verifique com:
```powershell
docker-compose ps
```

### Uso de recursos
```powershell
docker stats
```

## 🔄 Atualização

Para atualizar as imagens:
```powershell
docker-compose pull
docker-compose up -d
```

## 🗑️ Remoção Completa

Para remover tudo (incluindo volumes):
```powershell
docker-compose down -v
```

⚠️ **Atenção**: Isso apagará todos os dados dos bancos de dados.

## 📚 Integração com o Projeto Matcon

Esta instalação pode ser integrada com o projeto Matcon Mission Control para:
- Automação de processos via n8n
- Atendimento ao cliente via Chatwoot
- Integração WhatsApp para notificações
- Workflows personalizados para o sistema SaaS

## 🔗 Links Úteis

- Chatwoot: https://www.chatwoot.com
- n8n: https://n8n.io
- Baileys: https://github.com/WhiskeySockets/Baileys
