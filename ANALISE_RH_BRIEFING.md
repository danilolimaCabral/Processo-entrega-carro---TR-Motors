# Análise do Briefing de RH — TR Motors Hub

## 1. Situação Atual do Sistema

O sistema TR Motors Hub já possui os seguintes módulos funcionais em produção:

- **Autenticação** com login local (4 usuários de teste ativos)
- **Dashboard** com visão geral e fluxo de processos
- **Vendas** (propostas e clientes)
- **Estoque** (veículos)
- **Financeiro** (despesas, contas a pagar/receber)
- **Despachante** (documentos e cartório)
- **EAD** (cursos e videoaulas com certificados)
- **RH** (controle de funcionários, uniformes, NF)
- **Despesas** (com OCR de nota fiscal)
- **Aprovações** (fluxo de aprovação de documentos)
- **Painel Admin** (liberação de módulos por usuário/role)

## 2. Análise do Briefing de RH

O briefing solicita 5 módulos principais e 6 módulos futuros. Abaixo está o mapeamento entre o que já existe e o que precisa ser construído:

### 2.1 Módulos do Briefing vs Sistema Atual

| Módulo do Briefing | Status no Sistema | Ação Necessária |
|---|---|---|
| **Onboarding com videoaulas** | Parcialmente existe (EAD) | Expandir EAD com trilhas por cargo, quizzes e progresso automático |
| **Controle de uniforme** | Parcialmente existe (RH) | Criar tela dedicada de uniformes com histórico e alertas |
| **Checklist de saída (desligamento)** | Não existe | Criar novo módulo com checklist multi-setorial |
| **Documentos do colaborador (pasta digital)** | Não existe | Criar prontuário digital com upload, categorias e alertas de validade |
| **CRM de candidatos por vaga** | Não existe | Criar funil de recrutamento com banco de talentos |
| **Ponto/frequência e férias** | Não existe | Roadmap - fase 2 |
| **Avaliação de desempenho** | Não existe | Roadmap - fase 2 |
| **Comunicados internos** | Não existe | Roadmap - fase 2 |
| **Indicadores de RH (dashboard)** | Parcialmente existe | Expandir dashboard com métricas de RH |
| **Pesquisa de clima** | Não existe | Roadmap - fase 3 |
| **Gestão de benefícios** | Não existe | Roadmap - fase 3 |

### 2.2 Arquitetura Recomendada

O briefing enfatiza três princípios arquitetônicos:

1. **Modularidade**: Cada módulo deve ser um bloco separado ligado a um cadastro central de funcionário/candidato
2. **Permissões por módulo e perfil**: RH vê tudo; Gestor vê só sua equipe; Financeiro vê custo; Colaborador vê só seus dados
3. **Log de auditoria**: Registrar quem alterou o quê e quando

O sistema atual já atende parcialmente esses princípios:
- Já tem permissões por role (admin, rh, vendedor, financeiro)
- Já tem painel admin para liberar módulos
- Falta implementar log de auditoria e permissões mais granulares (gestor vê só sua equipe)

## 3. Plano de Implementação

### Fase 1 — Módulos Essenciais (Prioridade Alta)

#### 3.1 Onboarding com Videoaulas (Expandir EAD)
- Adicionar campo `trilha` (Vendas, Administrativo, Recepção) aos cursos
- Atribuir trilha automaticamente ao contratar funcionário
- Marcar progresso automático (vídeo assistido/pendente)
- Adicionar quiz ao final de cada vídeo
- Notificar RH quando funcionário concluir trilha
- Histórico de treinamento por funcionário

#### 3.2 Controle de Uniforme
- Cadastro de itens (tipo, tamanho, quantidade, data de entrega)
- Histórico de entregas e reposições
- Alerta de pendência (sem uniforme ou não devolvido no desligamento)
- Relatório de custo por período

#### 3.3 Checklist de Saída (Desligamento)
- Checklist multi-setorial disparado pelo RH
- Itens: remover grupos WhatsApp, revogar acessos, devolver uniforme, devolver equipamentos, bloquear crachá, acertar documentos
- Cada item tem responsável (RH, TI, Financeiro, Gestor)
- Pendente até ser marcado como feito com data e responsável

#### 3.4 Documentos do Colaborador (Pasta Digital)
- Upload de documentos por categoria (contrato, CNH, comprovante, recibos, exames)
- Alertas de validade (CNH vencendo, exame periódico vencendo)
- Controle de acesso restrito (mais sensível que o resto do sistema)

#### 3.5 CRM de Candidatos por Vaga
- Funil: Inscrito → Triagem → Entrevista → Aprovado/Reprovado → Contratado
- Formulário de inscrição próprio
- Anotações de entrevista, nota, pretensão salarial
- Banco de talentos (histórico de não aprovados)
- Converter candidato aprovado em colaborador com 1 clique

### Fase 2 — Módulos Complementares (Roadmap)

- Ponto/frequência e férias
- Avaliação de desempenho trimestral
- Comunicados internos / quadro de avisos digital
- Dashboard de indicadores de RH (turnover, tempo de contratação, pendências)

### Fase 3 — Módulos Avançados (Roadmap)

- Pesquisa de clima/satisfação
- Gestão de benefícios (PJ e valores fixos)

## 4. Requisitos Técnicos

### 4.1 Banco de Dados — Novas Tabelas Necessárias

| Tabela | Descrição |
|---|---|
| `uniforms` | Itens de uniforme por funcionário |
| `uniform_deliveries` | Histórico de entregas e devoluções |
| `exit_checklists` | Checklists de desligamento |
| `exit_checklist_items` | Itens do checklist com responsável e status |
| `employee_documents` | Documentos do colaborador (pasta digital) |
| `document_categories` | Categorias de documentos |
| `job_vacancies` | Vagas abertas |
| `candidates` | Candidatos por vaga |
| `candidate_stages` | Estágios do funil de recrutamento |
| `learning_paths` | Trilhas de onboarding por cargo |
| `learning_path_courses` | Cursos associados a cada trilha |
| `quizzes` | Quizzes por curso |
| `quiz_questions` | Perguntas do quiz |
| `quiz_answers` | Respostas dos funcionários |
| `audit_logs` | Log de auditoria (quem alterou o quê) |

### 4.2 Permissões Granulares

| Perfil | Acesso |
|---|---|
| Admin/Diretoria | Tudo |
| RH | Tudo relacionado a RH |
| Gestor/Supervisor | Só sua equipe |
| Financeiro | Custo de uniforme, documentos de pagamento |
| Colaborador | Só seus próprios dados |

### 4.3 Notificações

- E-mail ou WhatsApp para pendências (uniforme não entregue, documento vencendo, checklist incompleto)
- Integração com WhatsApp já existe no sistema (módulo despachante)

### 4.4 Mobile/Responsivo

- O sistema já é responsivo (React + Vite)
- O app mobile (Expo) já existe e pode receber os novos módulos

## 5. Alinhamento com Sistema Existente

O briefing menciona que o sistema faz parte de um conjunto maior (8-10 sistemas) e recomenda:

> "Vale alinhar desde já um padrão visual e técnico comum (login único, mesma paleta, mesma estrutura de permissões) para que os sistemas conversem entre si no futuro."

O TR Motors Hub já atende a isso:
- Login único já implementado
- Paleta TR Motors (vermelho, preto, branco) já aplicada
- Estrutura de permissões por role já funcionando
- Sidebar modular que mostra/oculta módulos conforme liberação do admin
- App mobile sincroniza módulos com o painel web

## 6. Conclusão

O sistema TR Motors Hub já tem a base arquitetural necessária para receber os novos módulos de RH. O trabalho principal consiste em:

1. **Expandir o EAD** com trilhas, quizzes e progresso automático
2. **Criar 4 novos módulos**: Uniforme, Checklist de Saída, Pasta Digital e CRM de Candidatos
3. **Adicionar log de auditoria** global
4. **Refinar permissões** para gestor (acesso limitado à equipe)
5. **Criar 15 novas tabelas** no banco de dados

A arquitetura modular existente permite que cada novo módulo seja plugado sem refazer o sistema, atendendo ao requisito principal do briefing.
