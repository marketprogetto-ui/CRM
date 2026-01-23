# Documentação do Sistema Progetto CRM

Este documento detalha os aspectos técnicos e operacionais do Progetto CRM, uma plataforma avançada para gestão de oportunidades de vendas e entregas.

---

## 1. Documentação Técnica

### 1.1. Arquitetura e Tecnologias
O sistema foi desenvolvido seguindo as melhores práticas de aplicações modernas na web:
- **Framework**: Next.js 15 (App Router) com TypeScript para tipagem estática e segurança.
- **Estilização**: Tailwind CSS para um design responsivo, moderno e premium.
- **Componentes UI**: shadcn/ui (baseado em Radix UI) para componentes acessíveis e consistentes.
- **Backend as a Service (BaaS)**: Supabase para Autenticação, Banco de Dados PostgreSQL e Row-Level Security (RLS).
- **Gerenciamento de Estado**: Hooks do React (`useState`, `useEffect`, `useMemo`) e formulários com `react-hook-form` + `zod`.

### 1.2. Segurança e Controle de Acesso
- **Autenticação**: Gerenciada pelo Supabase Auth, incluindo suporte a Multi-Fator (MFA/2FA) e confirmação de e-mail.
- **RBAC (Role-Based Access Control)**:
    - **Admin**: Acesso total, gerenciamento de usuários, visualização de logs de auditoria e exclusão de oportunidades/atividades.
    - **User**: Operação padrão (criação e edição), sem permissão para excluir registros críticos ou acessar áreas administrativas.
- **Inatividade**: Logout automático implementado após 15 minutos de inatividade do usuário para proteção de dados.
- **RLS (Row-Level Security)**: Políticas implementadas diretamente no PostgreSQL garantindo que usuários só acessem dados autorizados.

### 1.3. Modelo de Dados (Schema Principal)
- `profiles`: Dados estendidos dos usuários (nome completo, cargo, papel).
- `pipelines`: Definição dos fluxos (ex: Comercial, Entrega).
- `stages`: Etapas de cada pipeline com probabilidade de conversão.
- `opportunities`: Registros principais de vendas/projetos, contendo dados de Briefing (JSONB) e Medição (JSONB).
- `activities`: Tarefas vinculadas a oportunidades.
- `audit_logs`: Tabela de auditoria populada automaticamente por triggers do banco de dados em operações de `INSERT`, `UPDATE` e `DELETE`.

---

## 2. Documentação Operacional (Manual do Usuário)

### 2.1. Primeiro Acesso e Segurança
1. **Login**: Acesse com e-mail e senha. Se for o primeiro acesso, é necessário confirmar o e-mail enviado pelo sistema.
2. **2FA (Opcional, Recomendado)**: No menu de Perfil, você pode configurar a autenticação em duas etapas usando aplicativos como Google Authenticator.
3. **Sessão**: O sistema irá deslogar automaticamente se não houver interação (mouse, teclado, scroll) por 15 minutos.

### 2.2. Gestão de Pipelines (Kanban)
- **Visualização**: O sistema divide as oportunidades em dois grandes fluxos: **Comercial** (Vendas) e **Entrega** (Execução).
- **Mover Oportunidades**: Arraste e solte os cartões entre as colunas para atualizar a etapa do processo.
- **Buscar**: Utilize a barra de busca para filtrar oportunidades por título ou cliente em tempo real.

### 2.3. Detalhes da Oportunidade
Ao clicar em uma oportunidade, você tem acesso às seguintes abas:
- **Resumo**: Visão geral dos valores, prioridades e estágio atual.
- **Briefing**: Formulário completo para coletar necessidades de estilo, automação e restrições do cliente.
- **Medição**: Ficha técnica detalhada para registro de vãos, janelas e observações de instalação (crucial para o time de entrega).
- **Atividades**: Lista de tarefas pendentes e concluídas para aquela oportunidade específica.
- **Ações (Botão)**: Menu para alterar dados mestres ou excluir o registro (se você for administrador).

### 2.4. Atividades Globais
Acesse o menu "Atividades" na barra lateral para ter uma visão consolidada de todos os seus compromissos, divididos entre pendentes, concluídos e especificamente os que estão **atrasados** (em vermelho).

### 2.5. Administração (Apenas Admins)
- **Gestão de Usuários**: Convite de novos membros para a equipe e controle de quem tem acesso ao sistema.
- **Auditoria**: Tela técnica que registra **quem** alterou **o quê** e **quando**. Essencial para rastreabilidade de mudanças em valores ou status de projetos.

---

## 3. Guia de Deploy e Manutenção
- **Build**: `npm run build` realiza a compilação otimizada.
- **Ambiente**: As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` devem estar configuradas no ambiente de produção (Vercel).
- **Deploy**: Realizado automaticamente via integração com o GitHub no branch `main`.
