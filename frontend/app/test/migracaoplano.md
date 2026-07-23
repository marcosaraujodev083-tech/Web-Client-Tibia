### Nova Estrutura Proposta (Feature-Based)

### Destaque: Tudo o que diz respeito a um domínio específico (Player, Inventário, Rede, Renderizador) fica reunido dentro da sua respetiva pasta em features/ ou game/.

src/ (ou app/)
├── game-area/                      # Rota principal Next.js (Clean)
│    ├── layout.tsx
│    └── page.tsx                   # Arquivo MÃE (Apenas imports e orquestração)
│
└── game/                           # Pasta Raiz das Features do Jogo
├── network/                   # Feature: Protocolos de Rede & WebSocket
│    ├── constants/
│    │    ├── opcodes.ts
│    │    └── enum.ts
│    ├── services/
│    │    └── network-manager.ts
│    └── protocol/
│         ├── packet-handler.ts
│         ├── packet-reader.ts
│         └── packet-reader-base.ts
│
├── player/                    # Feature: Entidade e Controle do Jogador
│    ├── models/
│    │    ├── player.ts
│    │    └── position.ts
│    ├── controllers/
│    │    └── input-manager.ts
│    └── components/
│         └── StatusHUD.tsx
│
├── inventory/                 # Feature: Sistema de Inventário
│    └── components/
│         └── Inventory.tsx
│
├── chat/                      # Feature: Sistema de Chat
│    └── components/
│         └── Chat.tsx
│
├── minimap/                   # Feature: Minimapa
│    └── components/
│         └── Minimap.tsx
│
├── renderer/                  # Feature: Motor Gráfico (PixiJS)
│    └── services/
│         └── game-application.ts
│
└── debug/                     # Feature: Ferramentas de Desenvolvimento
└── components/
└── DebugControls.tsx

### Passo a Passo da Migração
### Fase 1: Preparação das Pastas

    Criar a pasta central app/game/ (ou src/game/).

    Criar os subdiretórios das features: network/, player/, inventory/, chat/, minimap/, renderer/, e debug/.

### Fase 2: Movimentação dos Arquivos

    Rede (network/):

        Mover opcodes.ts e enum.ts para network/constants/.

        Mover network-manager.ts para network/services/.

        Mover packet-handler.ts, packet-reader.ts e packet-reader-base.ts para network/protocol/.

### Jogador (player/):

    Mover player.ts e position.ts para player/models/.

    Mover input-manager.ts para player/controllers/.

    Mover StatusHUD.tsx para player/components/.

### Demais Módulos UI:

    Mover Inventory.tsx para inventory/components/.

    Mover Chat.tsx para chat/components/.

    Mover Minimap.tsx para minimap/components/.

    Mover DebugControls.tsx para debug/components/.

### Renderizador (renderer/):

    Mover game-application.ts para renderer/services/.

### Fase 3: Atualização de Imports e Refatoração da Tela Mãe

    Ajustar os caminhos de importação (@/game/...) em todos os arquivos movidos.

    Limpar a página principal (app/game-area/page.tsx), garantindo que ela funcione apenas como ponto de orquestração dos componentes sem conter regras de negócio complexas.

    Remover a pasta antiga e temporária test/components/game-migration.

### fase 4. Benefícios Conquistados

   Isolamento de Responsabilidades: Alterar a UI do inventário não impacta o protocolo de rede nem o renderizador.

   Escalabilidade: Novas funcionalidades (ex: quest/, trade/, guild/) podem ser criadas isoladamente sem poluir a raiz.

   Leitura do Projeto: Qualquer desenvolvedor entenderá a estrutura do jogo imediatamente ao abrir a pasta game/.

### 🗺️ Visão Geral da Nova Estrutura (Plaintext)

Com base na sua imagem e no que você já construiu dentro de `test/components/game-migration`, `modals` e `renderer`, organizamos a arquitetura do projeto de forma **isolada por funcionalidade/domínio**:

```text
app/
 ├── game-area/                      # Rota e Layout Principal do Next.js
 │    ├── layout.tsx
 │    └── page.tsx                   # Arquivo MÃE (Apenas imports, sem lógica pesada)
 │
 └── game/                           # PASTA RAIZ DAS FEATURES DO JOGO
      ├── network/                   # Feature: Conectividade & WebSockets
      │    ├── constants/
      │    │    ├── opcodes.ts
      │    │    └── enum.ts
      │    ├── services/
      │    │    └── network-manager.ts
      │    └── protocol/
      │         ├── packet-handler.ts
      │         ├── packet-reader.ts
      │         └── packet-reader-base.ts
      │
      ├── player/                    # Feature: Jogador & Controles
      │    ├── models/
      │    │    ├── player.ts
      │    │    └── position.ts
      │    ├── controllers/
      │    │    └── input-manager.ts
      │    └── components/
      │         └── StatusHUD.tsx
      │
      ├── inventory/                 # Feature: Sistema de Inventário
      │    └── components/
      │         └── Inventory.tsx
      │
      ├── chat/                      # Feature: Comunicação / Chat
      │    └── components/
      │         └── Chat.tsx
      │
      ├── minimap/                   # Feature: Navegação / Minimapa
      │    └── components/
      │         └── Minimap.tsx
      │
      ├── renderer/                  # Feature: Renderização (PixiJS / WebGL)
      │    └── services/
      │         └── game-application.ts
      │
      └── debug/                     # Feature: Ferramentas de Teste
           └── components/
                └── DebugControls.tsx