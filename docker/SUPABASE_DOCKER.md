# Supabase Docker - Instalação Local

Instalação completa do Supabase em Docker para desenvolvimento local do projeto Matcon.

## 📋 Serviços Incluídos

- **PostgreSQL 15** - Banco de dados principal
- **Supabase Studio** - Interface web de administração
- **Kong** - API Gateway
- **PostgREST** - REST API para o banco
- **GoTrue (Auth)** - Autenticação
- **Realtime** - WebSockets em tempo real
- **Storage** - Armazenamento de arquivos
- **Edge Runtime** - Execução de Supabase Functions

## 🚀 Instalação Rápida

### 1. Iniciar o Supabase

```powershell
cd docker
.\supabase-start.ps1
```

Este script:
- Cria o arquivo `.env` se não existir
- Atualiza o docker-compose com as senhas
- Inicia todos os containers
- Mostra o status dos serviços

### 2. Acessar o Supabase Studio

Abra no navegador: http://localhost:3002

### 3. Parar o Supabase

```powershell
.\supabase-stop.ps1
```

## 🌐 Portas Utilizadas

| Serviço | Porta Host | URL |
|---------|-------------|-----|
| Supabase Studio | 3002 | http://localhost:3002 |
| Kong API Gateway | 8000 | http://localhost:8000 |
| Kong HTTPS | 8443 | https://localhost:8443 |
| PostgreSQL | 5432 | localhost:5432 |
| Auth (GoTrue) | 9999 | http://localhost:9999 |
| Realtime | 4000 | http://localhost:4000 |
| Storage | 5000 | http://localhost:5000 |
| Functions | 9000 | http://localhost:9000 |

## 🔑 Credenciais Padrão

### URL do Supabase
```
http://localhost:8000
```

### API Keys
```
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### PostgreSQL
```
Host: localhost
Port: 5432
User: postgres
Password: (definido em supabase/.env)
Database: postgres
```

## 📝 Configuração do Projeto

### Atualizar .env do Projeto

Para usar o Supabase local no projeto Matcon, atualize o `.env` na raiz:

```bash
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_PROJECT_ID=local
```

### Aplicar Migrations

Via Supabase Studio:
1. Acesse http://localhost:3002
2. SQL Editor
3. Cole o conteúdo das migrations:
   - `supabase/migrations/20260429234723_3ff8afb2-1adb-4e6d-9414-6bbdab0a70f4.sql`
   - `supabase/migrations/20260430200000_chatwoot_integration.sql`
4. Execute

Ou via psql:
```powershell
psql -h localhost -U postgres -d postgres -f supabase/migrations/20260429234723_3ff8afb2-1adb-4e6d-9414-6bbdab0a70f4.sql
psql -h localhost -U postgres -d postgres -f supabase/migrations/20260430200000_chatwoot_integration.sql
```

## 📊 Comandos Úteis

### Ver status dos containers
```powershell
docker-compose -f supabase-docker-compose.yml ps
```

### Ver logs
```powershell
# Todos os serviços
docker-compose -f supabase-docker-compose.yml logs -f

# Serviço específico
docker-compose -f supabase-docker-compose.yml logs -f db
docker-compose -f supabase-docker-compose.yml logs -f studio
docker-compose -f supabase-docker-compose.yml logs -f auth
```

### Reiniciar serviços
```powershell
docker-compose -f supabase-docker-compose.yml restart
```

### Acessar PostgreSQL
```powershell
docker exec -it supabase-db psql -U postgres
```

### Backup do banco
```powershell
docker exec supabase-db pg_dump -U postgres postgres > backup.sql
```

### Restaurar banco
```powershell
docker exec -i supabase-db psql -U postgres postgres < backup.sql
```

## 🔧 Supabase Functions

### Deploy de Functions

As functions estão em `supabase/functions/`. Para usar com o Docker local:

1. O volume já está montado no container `supabase-functions`
2. As functions são carregadas automaticamente do diretório `supabase/functions/`
3. Acesse via: http://localhost:9000/functions/v1/nome-da-function

### Exemplo: Chatwoot Webhook

```bash
# A function já está configurada em supabase/functions/chatwoot-webhook/
# Acesse: http://localhost:9000/functions/v1/chatwoot-webhook
```

## 🐛 Troubleshooting

### Containers não iniciam
```powershell
# Ver logs
docker-compose -f supabase-docker-compose.yml logs

# Recriar containers
docker-compose -f supabase-docker-compose.yml down
docker-compose -f supabase-docker-compose.yml up -d --force-recreate
```

### Portas já em uso
Edite `supabase-docker-compose.yml` e altere as portas mapeadas.

### Conexão com PostgreSQL falha
```powershell
# Verificar se o container está rodando
docker ps | grep supabase-db

# Ver logs do PostgreSQL
docker logs supabase-db
```

### Supabase Studio não acessível
```powershell
# Ver logs do Studio
docker logs supabase-studio

# Verificar se a porta está correta
netstat -ano | findstr :3002
```

## 🔄 Alternar entre Local e Cloud

### Usar Supabase Local
```bash
# .env do projeto
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Usar Supabase Cloud
```bash
# .env do projeto
VITE_SUPABASE_URL=https://huxwyutnodhpnsdhmsbx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_u027hoakMyTgSgHyqb_4Fw_YgA-d2s7
```

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Supabase Docker](https://github.com/supabase/supabase/tree/master/docker)

## ⚠️ Notas Importantes

- Esta instalação é para **desenvolvimento local**
- Não use estas credenciais em produção
- As senhas estão em `supabase/.env` - não commit no versionamento
- Os dados persistem nos volumes Docker
- Para limpar tudo: `docker-compose -f supabase-docker-compose.yml down -v`
