# Ouve: 

0x20 (ServerData/Width/Height), 
0x49 (WRITE_CHUNK)

Escuta os opcodes do mapa e do servidor (0x20 Server Data e 0x49 Chunk Graphics), entregando o chunk parseado para o renderizador (PixiJS):