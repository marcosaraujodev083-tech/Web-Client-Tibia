### 🏷️ Enums (O Dicionário de Códigos da Fábrica)
* **Papel:** Mapeamento de Constantes Numéricas.
* Traduz números puros usados na rede (ex: `0`, `1`, `2`) em nomes humanos legíveis (`CreatureType.PLAYER`, `Direction.NORTH`).
* Economiza espaço de banda enviando apenas bytes numéricos pelo WebSocket enquanto mantém o código limpo, seguro e autocompletável no TypeScript.

### 🏷️ OpCodes (O Catálogo de Tipos de Mensagem)
* **Papel:** Identificador Único de Comando de Rede.
* Define o protocolo de comunicação de entrada (`SERVER_OPCODES`) e saída (`CLIENT_OPCODES`).
* Fica localizado no primeiro byte de cada pacote binário, permitindo que o `PacketHandler` direcione o buffer para a função/parser de leitura correta.