# Integração Chatwoot com Matcon Mission Control

Documentação para configurar a integração entre Chatwoot e o projeto Matcon via webhooks.

## 📋 Visão Geral

A integração permite:
- Receber mensagens do Chatwoot no sistema Matcon
- Sincronizar contatos do Chatwoot com clientes do Matcon
- Rastrear conversas e mensagens no banco de dados
- Automatizar fluxos com base em eventos do Chatwoot

## 🗄️ Tabelas Criadas

### chatwoot_contacts
Armazena contatos sincronizados do Chatwoot, com link opcional para customers.

### chatwoot_conversations
Armazena conversas do Chatwoot com status e atribuições.

### chatwoot_messages
Armazena mensagens trocadas nas conversas.

## 🚀 Configuração do Webhook no Chatwoot

### 1. Acessar o Chatwoot
```
http://localhost:3001
```

### 2. Criar Super Administrador
- Primeiro acesso: criar conta de administrador
- Configurar as configurações básicas

### 3. Configurar Webhook

#### Passo 1: Acessar Configurações
- Navegue para: Settings → Integrations → Webhooks
- Clique em "Add Webhook"

#### Passo 2: Configurar o Webhook

**Webhook URL:**
```
https://lurenzhfsjvgixkyooxk.supabase.co/functions/v1/chatwoot-webhook
```

**Webhook Secret:** (opcional, para verificação de assinatura)
- Gere uma chave segura e anote
- Use para verificar a autenticidade dos webhooks

**Eventos a assinar:**
- ✅ message_created
- ✅ conversation_created
- ✅ contact_created
- ✅ conversation_status_changed

**Configurações adicionais:**
- Subscribe to all inboxes: ✅ (recomendado)
- Retry on failure: ✅ (recomendado)
- Verify signature: ❌ (desativado para desenvolvimento)

#### Passo 3: Testar o Webhook
- Após salvar, clique em "Send Test Event"
- Verifique os logs da Supabase Function:
  ```bash
  supabase functions logs chatwoot-webhook
  ```

## 🔧 Rodar a Migration no Supabase

### Aplicar a migration localmente:
```bash
supabase db push
```

Ou aplicar manualmente no dashboard do Supabase:
1. Acesse: https://supabase.com/dashboard/project/lurenzhfsjvgixkyooxk/database
2. SQL Editor
3. Cole o conteúdo de: `supabase/migrations/20260430200000_chatwoot_integration.sql`
4. Execute

## 🧪 Testar a Integração

### 1. Enviar uma mensagem no Chatwoot
- Abra uma conversa no Chatwoot
- Envie uma mensagem de teste

### 2. Verificar os dados no Supabase
```sql
-- Verificar contatos
SELECT * FROM chatwoot_contacts ORDER BY created_at DESC LIMIT 10;

-- Verificar conversas
SELECT * FROM chatwoot_conversations ORDER BY created_at DESC LIMIT 10;

-- Verificar mensagens
SELECT * FROM chatwoot_messages ORDER BY created_at DESC LIMIT 10;
```

### 3. Verificar logs da function
```bash
supabase functions logs chatwoot-webhook --tail
```

## 🔄 Eventos Suportados

### message_created
- **Quando**: Nova mensagem é criada
- **Ação**: Salva mensagem no banco, tenta vincular a cliente existente pelo telefone

### conversation_created
- **Quando**: Nova conversa é iniciada
- **Ação**: Salva conversa com status inicial

### contact_created
- **Quando**: Novo contato é adicionado
- **Ação**: Salva contato no banco

### conversation_status_changed
- **Quando**: Status da conversa muda (open, resolved, closed)
- **Ação**: Atualiza status da conversa

## 🔗 Vinculação Automática de Clientes

Quando uma mensagem é recebida de um contato, o sistema tenta vincular automaticamente a um cliente existente do Matcon:

1. Extrai o número de telefone do contato
2. Remove caracteres especiais
3. Busca em `customers.whatsapp` ou `customers.phone`
4. Se encontrado, vincula `chatwoot_contacts.customer_id`

## 📊 Consultas Úteis

### Conversas por status
```sql
SELECT status, COUNT(*) 
FROM chatwoot_conversations 
GROUP BY status;
```

### Mensagens por conversa
```sql
SELECT 
  cc.chatwoot_conversation_id,
  cc.status,
  COUNT(cm.id) as message_count
FROM chatwoot_conversations cc
LEFT JOIN chatwoot_messages cm ON cc.chatwoot_conversation_id = cm.chatwoot_conversation_id
GROUP BY cc.chatwoot_conversation_id, cc.status;
```

### Contatos vinculados a clientes
```sql
SELECT 
  cc.name,
  cc.phone_number,
  c.name as customer_name
FROM chatwoot_contacts cc
LEFT JOIN customers c ON cc.customer_id = c.id
WHERE cc.customer_id IS NOT NULL;
```

## 🐛 Troubleshooting

### Webhook não está recebendo eventos
1. Verifique se o webhook está ativo no Chatwoot
2. Verifique a URL está correta
3. Verifique os logs da Supabase Function
4. Teste com "Send Test Event"

### Erro de CORS
- A function já tem headers CORS configurados
- Se ainda houver erro, verifique as configurações do Chatwoot

### Contatos não vinculando a clientes
- Verifique se o telefone está formatado corretamente
- Verifique se o cliente existe no banco
- Verifique os logs para ver a tentativa de vinculação

### Migration falhou
- Verifique se você tem permissões no Supabase
- Execute cada CREATE TABLE separadamente para identificar o erro

## 🔒 Segurança

### Em Produção
- Implementar verificação de assinatura HMAC-SHA256
- Usar webhook secret para validar requisições
- Adicionar rate limiting
- Adicionar autenticação adicional se necessário

### Verificação de Assinatura (exemplo)
```typescript
import { crypto } from "https://deno.land/std/crypto/mod.ts";

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  
  return signature === expectedSignature;
}
```

## 📚 Recursos Adicionais

- [Documentação Chatwoot Webhooks](https://www.chatwoot.com/docs/product/channels/api/webhooks)
- [Documentação Supabase Functions](https://supabase.com/docs/guides/functions)
- [Dashboard Supabase](https://supabase.com/dashboard/project/lurenzhfsjvgixkyooxk)
