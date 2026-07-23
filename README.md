# 🎮 Web Client Tibia (Next.js & Pixi.js)

> **💡 Nota sobre o Projeto:** Este é um **projeto pessoal desenvolvido exclusivamente para fins de diversão e experimentação tecnológica**. O objetivo é explorar as capacidades modernas da Web (Canvas 2D, WebGL/WebGPU e manipulação de protocolos binários) para criar um cliente web de Tibia adaptado com servidor próprio, rodando direto no navegador sem a necessidade de instalar executáveis pesados.

> ℹ️ *O client original já existia e funcionava em HTML/JavaScript puro. Esta versão é uma recriação completa utilizando tecnologias modernas, altamente customizáveis e com melhor suporte à manutenção.*

---

## 🛠️ Arquitetura & Fluxo Geral do Projeto

A criação de contas e o gerenciamento do banco de dados ocorrem em uma arquitetura híbrida:
* **Frontend $\leftrightarrow$ Supabase:** O fluxo de autenticação, registro e dados de contas/personagens roda via Supabase.
* **Frontend $\leftrightarrow$ Game Server:** A lógica do jogo em tempo real se comunica diretamente com o servidor via **WebSocket**, recebendo e enviando pacotes binários.
* Os pacotes de dados estão sendo mapeados e otimizados gradualmente. O objetivo principal é reformular toda a experiência do jogo através de uma arquitetura leve e fácil de manipular.

---

## 🚀 Tecnologias Utilizadas

* **Framework Web:** [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
* **Engine Gráfica:** [Pixi.js v8](https://pixijs.com/) (WebGPU / WebGL 2D de alta performance)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Banco de Dados & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Supabase Auth)
* **Protocolo Binário:** [Protobuf.js](https://github.com/protobufjs/protobuf.js) (Parsing do arquivo `appearances.protobuf`)
* **Estilização de UI:** [Tailwind CSS v4](https://tailwindcss.com/)

---

## 📊 Progresso e Avanços do Projeto

### 📦 Assets & Banco de Dados de Itens
- [x] **Pipeline de Pré-processamento:** Script automatizado em Node.js (`parse-assets.ts`) para decodificação do binário `appearances.protobuf`.
- [x] **Extração de Itens:** **33.034 aparências e itens** categorizados e exportados para `public/data/items.json`.
- [x] **Mapeamento de Sprites:** Estruturação das Sprite Sheets na pasta `public/assets/sprites/` integrada ao `catalog-content.json`.

### 🌐 Infraestrutura de Rede & WebSocket
- [x] **Conexão WebSocket Base:** Gateway/ponte ativo entre o navegador e o servidor.
- [x] **Buffer Parser:** Leitor binário customizado (`NetworkMessage`) com suporte a `uint8`, `uint16`, `uint32` e `string`.
- [x] **Opcodes de Comunicação:** Mapeamento inicial de pacotes de Login (`0x0A`), Movimentação (`0x6A`) e Chat (`0xAA`).

### 🛢️ Banco de Dados & Autenticação
- [x] **Migração para Supabase:** Modelagem do esquema de banco de dados no PostgreSQL via Supabase.
- [x] **Auth & Login Web:** Interface no Next.js para criação e autenticação de contas via Supabase Auth.
- [x] **Bridge de Bytes Account/Server:** Conversão dos dados de perfil e conta em pacotes binários para leitura no frontend.

### 🔄 Em Desenvolvimento
- [ ] **Sincronização do Mapa em Tempo Real:** Leitura do opcode `0x64` (*Map Description*) integrado ao Canvas do Pixi.js.
- [ ] **Viewport & Render Engine (Pixi.js):** Carregamento dinâmico do mapa em posições $X, Y, Z$.
- [ ] **Interface do Usuário (HUD):** Barras de vida, mana, inventário e canais de chat construídos em React.

---

## 🌐 Arquitetura de Rede, WebSocket & Opcodes

O cliente web se comunica diretamente com o servidor (protocolo 7.40 adaptado) através de uma camada de rede customizada sobre **WebSocket**, lidando com pacotes binários de baixa latência em tempo real.

### 🔌 Portas e Infraestrutura de Conexão
* **Proxy / Gateway WebSocket:** O navegador conecta-se via WebSocket (por padrão na porta `8080` ou `8888`), fazendo a ponte com o servidor de jogo TCP puro (portas `7172` Game e `7171` Login).
* **Network Stream:** Leitura e escrita contínua de pacotes binários no formato `ArrayBuffer` / `Uint8Array`.

### 📦 Protocolo, Opcodes e Decodificação de Bytes

1. **Header do Pacote:**
    * Leitura do tamanho do pacote (`uint16`) no início de cada mensagem de rede.
    * Validação de *Checksum* / *Adler32* para garantia de integridade dos dados.

2. **Opcodes de Entrada (Server $\rightarrow$ Client):**
    * **`0x0A` (Login Success):** Boas-vindas ao jogador e dados primários da sessão.
    * **`0x64` (Map Description):** Descrição completa do mapa ao redor do jogador ($18 \times 14$ tiles).
    * **`0x6D` (Tile Update):** Atualização dinâmica de um tile específico (itens no chão, alterações de mapa).
    * **`0x6A` (Creature Move):** Movimentação de jogadores e criaturas na tela.
    * **`0xAA` (Text Message / Speech):** Mapeamento do sistema de chat (Default, Trade, Guild, Private).

3. **Opcodes de Saída (Client $\rightarrow$ Server):**
    * **`0x64` (Move):** Comandos de andar (Norte, Sul, Leste, Oeste e Diagonais).
    * **`0x82` (Use Item):** Interação com objetos, poções e runas.
    * **`0x84` (Look):** Inspecionar itens e criaturas.
    * **`0x96` (Say/Chat):** Envio de mensagens para os canais de texto.

4. **Tratamento de Structs Complexas:**
    * Leitura de sequências binárias dinâmicas (`readString`, `readU16`, `readU32`, `readPosition`) para conversão das coordenadas $(X, Y, Z)$ em elementos visuais no **Pixi.js**.

---

## 🛢️ Engenharia de Banco de Dados, Autenticação & Supabase

A estrutura de dados e gerenciamento de contas foi modernizada e migrada para uma infraestrutura em nuvem no **Supabase (PostgreSQL)**.

### 🏗️ Fluxo de Comunicação

┌────────────────────┐
│ Frontend (Next.js) │
└─────────┬──────────┘
│
├── 1. Autenticação & Registro ──────► ┌──────────────────────────┐
│                                      │ Supabase (Auth + Postgres)│
├── 2. Requisição de Login (JWT/Bytes) ◄┴──────────────────────────┘
│
└── 3. Conexão de Jogo (WebSocket/Opcodes) ──► ┌──────────────────────────┐
│ Backend / Server Engine  │
└──────────────────────────┘

🛠️ Como Executar o Projeto Localmente
1. Instalar as dependências:
   Bash

npm install

2. Processar os Assets e Protobuf:

Caso precise atualizar o banco de itens items.json a partir do appearances.protobuf:
Bash

npm run parse:assets

3. Iniciar o ambiente de desenvolvimento:
   Bash

npm run dev

Acesse http://localhost:3000 no seu navegador.


Variaveis de ambiente ficam no .env

---

### 💬 Dúvidas, Sugestões ou Feedback?

Gostou do projeto ou tem alguma ideia incrível para somar? Toda contribuição e bate-papo técnico é super bem-vindo!

* 🌐 **LinkedIn:** [marcos-araujo-517201212](https://www.linkedin.com/in/marcos-araujo-517201212/)
* 📲 **WhatsApp:** [(11) 94029-2792](https://wa.me/5511940292792)
