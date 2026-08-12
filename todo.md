# TR Motors — Controle de Entrega: TODO

## Banco de Dados
- [x] Estender enum `role` do users para incluir `vendedor`, `financeiro`, `administrativo`
- [x] Criar tabela `sale_records` com campos: id, placa, status, sellerId, createdAt, updatedAt, rejectionReason, rejectedBy
- [x] Criar tabela `sale_documents` com campos: id, saleRecordId, documentType, fileKey, fileUrl, originalName, uploadedAt
- [x] Gerar migration SQL e aplicar via webdev_execute_sql

## Backend (tRPC Routers)
- [x] Criar router `sales` com procedures: create, listMine, listForFinanceiro, listForAdministrativo, getById
- [x] Criar endpoint REST `/api/upload-document` para receber PDF e salvar no S3
- [x] Criar procedures `approveFinanceiro` e `approveAdministrativo`
- [x] Criar procedures `rejectFinanceiro` e `rejectAdministrativo` com motivo obrigatório
- [x] Criar middlewares de autorização por papel (vendedorProcedure, financeiroProcedure, administrativoProcedure)
- [x] Corrigir upsertUser para não sobrescrever role customizado no banco

## Frontend
- [x] Configurar tema visual elegante (paleta slate + âmbar dourado) no index.css
- [x] Criar layout com sidebar escura, logo TR Motors e navegação por papel
- [x] Tela de login para usuários não autenticados
- [x] Tela de "Perfil não configurado" para usuários sem papel atribuído
- [x] Tela do Vendedor: formulário de novo registro (placa + 2 PDFs com drag-drop)
- [x] Tela do Vendedor: listagem dos seus registros com status e motivo de reprovação
- [x] Tela do Financeiro: listagem de registros "Aguardando Financeiro"
- [x] Tela do Financeiro: modal de detalhe com PDFs + botões Aprovar/Reprovar
- [x] Tela do Administrativo: listagem de registros "Aguardando Administrativo"
- [x] Tela do Administrativo: modal de detalhe com PDFs + botões Liberar/Reprovar
- [x] Componente StatusBadge com labels exatos e cores por estado
- [x] Modal de reprovação com campo de motivo obrigatório e validação
- [x] Componente DocumentList com visualização e download de PDFs

## Testes
- [x] 18 testes unitários cobrindo fluxo completo de aprovação e controle de acesso por papel
- [x] Testes de autorização: vendedor não acessa financeiro, financeiro não acessa administrativo, etc.

## Novas funcionalidades (em desenvolvimento)
- [x] Tela de administração: listar usuários e atribuir papéis via interface
- [x] Tela de administração: visualizar e editar dados de usuários
- [x] Vendedor: reenviar documentos para registros reprovados (reset para Aguardando Financeiro)
- [x] Validação: impedir reenvio se não houver documentos anexados
- [x] Projeto exportado para GitHub (repositório privado)

## Backlog (próximas versões)
- [ ] Filtros e busca na listagem de registros
- [ ] Histórico de ações por registro (audit trail)
- [ ] Notificações para o vendedor quando o status muda
- [ ] Campos adicionais no registro de venda (modelo, ano, valor, cliente)
- [ ] Exportação de relatórios
- [ ] Paginação nas listagens

## Correção de publicação do RH
- [x] Publicar no Railway a Pasta Digital por colaborador e o menu de RH simplificado

## Correções do RH
- [x] Corrigir o erro ao cadastrar funcionário

## Configurações administrativas
- [x] Adicionar acesso a Departamentos em Configurações
- [x] Adicionar acesso a Cargos em Configurações

## Ficha do colaborador
- [x] Abrir ficha detalhada ao clicar em um funcionário
- [x] Exibir dados pessoais, uniformes e documentação vinculada na ficha

## Automação de usuários e permissões
- [x] Criar automaticamente um usuário vinculado ao cadastrar funcionário
- [x] Restringir alteração de funcionários e acessos ao perfil de RH

## Acessos por perfil
- [ ] Configurar Danilo como vendedor com acesso apenas aos módulos de vendas
- [x] Aplicar módulos permitidos de forma consistente para gerente e demais perfis
- [x] Filtrar no sistema os módulos exibidos e retornados conforme o perfil do usuário

## Documentação digital do colaborador
- [x] Permitir o upload e armazenamento de arquivos na documentação do colaborador
- [x] Remover a necessidade de informar link manual para anexar documentos

## Correções de RH e Configurações
- [x] Restaurar o botão de cadastrar funcionário para o perfil de RH
- [x] Corrigir a visibilidade do botão de criar funcionário reportada em produção
- [x] Restaurar Configurações no menu exclusivo do perfil administrador
- [x] Modernizar a ficha do colaborador com campos pendentes em vermelho e preenchidos em verde
- [x] Corrigir rótulos e nomes cortados nos cartões da ficha do colaborador
- [x] Corrigir a perda de usuários cadastrados após alterações e novos deploys
- [x] Mover Departamentos e Cargos para Configurações exclusivas do administrador
- [x] Centralizar Auditoria, Usuários e liberação de módulos em Configurações exclusivas do administrador
- [ ] Criar fluxo mensal de nota fiscal para colaborador PJ com envio na ficha e conferência do Financeiro
- [ ] Permitir perfil principal com módulos adicionais por usuário, como Vendedor + EAD
- [x] Publicar em uma única atualização as correções prioritárias de RH e Configurações
