# Plano de Implementação: Autenticação, Admin e Links Individuais

## 1. Alterações no Banco de Dados (Schema)
O schema Drizzle precisa ser atualizado para suportar senhas e links públicos:
- **Tabela `users`**:
  - Adicionar campo `password` (varchar 255) para armazenar hash bcrypt.
  - Tornar `openId` opcional ou removê-lo (já que não usaremos OAuth manual). Vamos mantê-lo nullable por segurança.
  - Adicionar campo `publicToken` (varchar 64) único para o link de acompanhamento do cliente.
- **Nova Tabela (Opcional)**: Talvez vincular o `publicToken` diretamente ao `saleRecords` seja melhor, já que o processo é por carro/venda. Vamos adicionar `publicToken` na tabela `saleRecords`!

## 2. Backend (Servidor)
- **Autenticação**:
  - Substituir OAuth manual por login com usuário/senha em `server/_core/sdk.ts` e `server/routers/users.ts` (ou criar `server/routers/auth.ts`).
  - Adicionar bcrypt (ou biblioteca similar) para hash de senhas.
  - Criar endpoint tRPC para login: recebe email/senha, valida e gera JWT usando o método existente `sdk.createSessionToken()`.
  - Criar usuário admin inicial no startup caso não exista.
- **Admin**:
  - Atualizar `adminRouter` para permitir criar novos usuários (vendedores, financeiro, etc) definindo senhas.
- **Links Individuais**:
  - Adicionar rota tRPC pública (ou endpoint Express) para buscar o status de uma venda baseada no `publicToken`.
  - Gerar `publicToken` automaticamente ao criar um `saleRecord`.

## 3. Frontend (Cliente)
- **Tela de Login**:
  - Remover `startLogin()` do OAuth.
  - Criar formulário de login na `Home.tsx` com campos de Email e Senha.
- **Painel Admin**:
  - Atualizar `AdminPage.tsx` para incluir um botão "Criar Usuário" com modal para definir Nome, Email, Senha e Papel.
- **Página de Acompanhamento (Cliente)**:
  - Criar nova rota no `App.tsx`: `/processo/:token`.
  - Criar página `ProcessoPage.tsx` que busca os dados pelo token e exibe o status atual do carro de forma amigável para o cliente final.
- **Geração de Links**:
  - Na tela do Vendedor (`VendedorPage.tsx`), adicionar um botão para copiar o link do processo do cliente.

## Passos de Execução
1. Atualizar dependências: instalar `bcryptjs` e `@types/bcryptjs`.
2. Modificar `drizzle/schema.ts` e gerar migration.
3. Criar lógica de hash e login no backend.
4. Criar UI de login.
5. Criar UI de gestão de usuários (Admin).
6. Implementar a lógica do link público no backend e frontend.
