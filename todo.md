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
