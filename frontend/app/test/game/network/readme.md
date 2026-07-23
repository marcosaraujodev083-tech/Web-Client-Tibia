Analogia perfeita para entender o network e suas funções.

### 🚚 1. WebSocket (O Caminhão de Entregas)
* **Papel:** Transporte de Rede bruto.
* Descarrega dados binários (`ArrayBuffer`) contínuos vindos do servidor via conexão Socket sem interrupção.

### 📦 2. `NetworkManager` (A Esteira de Fatiamento)
* **Papel:** Fatiador de Stream.
* Recebe a fita de bytes bruta, lê o tamanho do pacote (`packetLength`) nos 2 primeiros bytes e **corta a stream em fatias isoladas** (`Uint8Array`) para cada pacote individual.

### 🧑‍💼 3. `PacketHandler` (O Funcionário Classificador)
* **Papel:** Roteador por OpCode.
* Inspeciona o primeiro byte da fatia (`OpCode`).
    * **OpCode Desconhecido:** Manda o pacote para a aba de *Não Tratados* no **DevTools**.
    * **OpCode Conhecido:** Executa o parser especialista correspondente (ex: `parseServerData`).

### 🔪 4. `PacketReaderBase` (O Estilete de Precisão)
* **Papel:** Leitor de Tipos Primitivos (Low-Level).
* Lida diretamente com o array de bytes. Corta os dados nas medidas exatas de 1, 2 ou 4 bytes (`readUInt8`, `readUInt16`, `readUInt32`) e avança a agulha de leitura (`index`) sequencialmente.

### 🔍 5. `PacketReader` (A Lupa Adaptada)
* **Papel:** Abstração de Estruturas do Jogo.
* Herda do `PacketReaderBase` e combina tipos básicos para traduzir estruturas do RPG (`readPosition`, `readOutfit`, `readEquipment`).

### 📜 6. Parsers Ex: `parseServerData` (O Manual da Caixa)
* **Papel:** Regra de Negócio/Desempacotamento.
* Instrução passo a passo de como ler um pacote específico (ex: `0x00`). Usa o `PacketReader` na sequência exata sem deixar nenhum byte sobrando no final do buffer.