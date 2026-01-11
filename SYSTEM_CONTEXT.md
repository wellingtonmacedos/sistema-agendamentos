# Contexto do Sistema: Sistema de Agendamentos (SaaS para Salões de Beleza)

## 1. Visão Geral
Este é um sistema completo de gestão para salões de beleza e barbearias, desenvolvido na stack MERN (MongoDB, Express, React, Node.js). O sistema opera em um modelo multi-inquilino (multi-tenant), onde cada usuário admin pertence a um "Salão" (SalonId).

O sistema possui duas interfaces principais:
1.  **Painel Administrativo (Web):** Onde o administrador gerencia agenda, profissionais, serviços, produtos, configurações e visualiza relatórios.
2.  **Interface de Chat (Cliente):** Uma interface simplificada que simula um chat (estilo WhatsApp) para que o cliente final realize agendamentos de forma interativa.

## 2. Tech Stack

### Backend
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** MongoDB (com Mongoose ODM)
-   **Autenticação:** JWT (JSON Web Tokens)
-   **Uploads:** Multer (armazenamento local em `/public/uploads`)
-   **Outros:** `cors`, `dotenv`, `bcryptjs`.

### Frontend
-   **Framework:** React (Vite)
-   **Estilização:** Tailwind CSS
-   **HTTP Client:** Axios
-   **Calendário:** React Big Calendar
-   **Ícones:** Lucide React
-   **Gerenciamento de Estado:** React Hooks (useState, useEffect, Context API implícito).

## 3. Estrutura de Diretórios (Resumida)

```
/
├── public/                 # Arquivos estáticos e uploads
├── src/                    # Backend Source
│   ├── config/             # Configurações (DB, Multer, etc.)
│   ├── controllers/        # Lógica de negócios
│   │   ├── adminController.js       # Gestão geral (CRUDs) e Relatórios
│   │   ├── appointmentController.js # Lógica de agendamentos
│   │   ├── authController.js        # Login/Registro
│   │   └── ...
│   ├── models/             # Schemas Mongoose
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços auxiliares
│   └── server.js           # Ponto de entrada do servidor
│
├── frontend/               # Frontend Source (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/      # Componentes do Painel (Agenda, Reports, etc.)
│   │   │   └── ...
│   │   ├── App.jsx         # Componente raiz e rotas
│   │   └── main.jsx        # Entry point
│   └── ...
```

## 4. Modelagem de Dados (MongoDB)

Principais coleções e seus relacionamentos:

*   **Salon:** Representa o estabelecimento. Contém configurações de tema, nome e ID.
*   **User:** Administradores do sistema. Vinculados a um `salonId`.
*   **Professional:** Funcionários que prestam serviços. Vinculados a `salonId`.
*   **Service:** Serviços oferecidos (ex: Corte, Barba). Possui preço, duração e imagem.
*   **Product:** Produtos para venda ou uso interno (ex: Shampoo). Possui `stock`, `price`, `cost`.
*   **Appointment:** O agendamento em si.
    *   Campos chave: `salonId`, `professionalId`, `services` (array), `customerName`, `customerPhone`, `startTime`, `endTime`, `status` (scheduled, completed, cancelled), `finalPrice`.
    *   **Products (Sub-documento):** Lista de produtos usados/vendidos no atendimento (`productId`, `quantity`, `price`).
*   **Schedule/Block:** Definição de horários disponíveis e bloqueios de agenda.

## 5. Funcionalidades Chave e Lógica de Negócios

### Agenda (Frontend: `Agenda.jsx`)
-   Visualização mensal/semanal/diária.
-   Criação de agendamentos com verificação de conflito de horário.
-   Suporte a recorrência (semanal, quinzenal, etc.).
-   **Finalização de Atendimento:**
    -   Ao finalizar, o admin confirma o valor.
    -   Pode adicionar **Produtos** ao atendimento.
    -   **Feature Recente:** O preço do produto é carregado do cadastro, mas pode ser **editado** manualmente no momento da venda.
    -   O estoque do produto é debitado automaticamente.
    -   O valor do produto é somado ao total do serviço.

### Relatórios (Backend: `adminController.js`)
-   Gera estatísticas baseadas em agendamentos com status `completed`.
-   Métricas: Faturamento Total, Ticket Médio, Total de Atendimentos.
-   Breakdown: Faturamento por Serviço, por Profissional e por Produto.

### Interface de Chat
-   Gera um link público para o salão.
-   O cliente navega por um fluxo conversacional para escolher serviço, profissional e horário.

## 6. Estado Atual e Atualizações Recentes
-   **Imagens:** O sistema serve imagens estáticas de uploads via Express.
-   **Produtos:** Foi implementada recentemente a funcionalidade de editar o preço do produto no modal de finalização (`Agenda.jsx`), permitindo flexibilidade na cobrança.
-   **Estoque:** O backend valida se há estoque suficiente antes de finalizar o atendimento.
-   **Correções:** Scripts de teste (`test_finish_api.js`) foram criados para validar o fluxo completo de vendas e relatórios sem depender da interface visual.

## 7. Comandos Úteis
-   Backend: `npm start` (na raiz) - Roda na porta 3000.
-   Frontend: `npm run dev` (em /frontend) - Roda na porta 5173.
