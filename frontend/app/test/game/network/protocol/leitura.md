# Packet-Handler.ts

Ele é o funcionario da esteira que faz a classificacao se conhece determinado produto ou não.

[ PacketHandler ] 

➔ "Conheço o OpCode 0x00?"
├── 🟢 SIM: Chama parseServerData() (Consome os dados internos)
└── 🔴 NÃO: Manda para o DevTools (Fica em "Não Tratados" até você criar o parser)

# packet-reader-base.ts

O packet-reader-base.ts é o canivete suíço ou a ferramenta de precisão do seu funcionário da esteira (PacketHandler).

Se o PacketHandler é o operador que recebe a caixa lacrada, o PacketReaderBase é a ferramenta que abre a caixa e tira cada item lá de dentro, um por um, na ordem exata e convertendo para o tipo correto.
🧰 O que ele faz na prática?

Quando um pacote chega da rede, ele é apenas uma sequência bruta de números/bytes (Uint8Array), algo como:

[0, 10, 0, 0, 0, 1, 100, 0, ...]

O PacketReaderBase encapsula esse array de bytes e mantém uma agulha/ponteiro chamada index (que começa na posição 0). Toda vez que você chama um método dele, ele lê os bytes daquela posição e avançar a agulha automaticamente.