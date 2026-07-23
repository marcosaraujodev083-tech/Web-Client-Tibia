import protobuf from 'protobufjs';
import fs from 'fs';
import path from 'path';

async function generateItemsJson() {
  console.log('🔄 1. Carregando a estrutura .proto...');

  // Caminhos ajustados para a raiz da pasta frontend/
  const protoPath = path.join(process.cwd(), 'proto/appearances.proto');
  const protobufBinaryPath = path.join(process.cwd(), 'assets-raw/appearances.protobuf');
  const outputPath = path.join(process.cwd(), 'public/data/items.json');

  // Verificações de segurança das pastas
  if (!fs.existsSync(protoPath)) {
    console.error(`❌ [ERRO] Não encontrei o arquivo .proto em: ${protoPath}`);
    console.log(`📌 Certifique-se de que a pasta 'proto/' está na raiz do frontend/ com o 'appearances.proto'.`);
    return;
  }

  if (!fs.existsSync(protobufBinaryPath)) {
    console.error(`❌ [ERRO] Não encontrei o arquivo binário em: ${protobufBinaryPath}`);
    console.log(`📌 Certifique-se de que a pasta 'assets-raw/' está na raiz do frontend/ com o 'appearances.protobuf'.`);
    return;
  }

  try {
    // 1. Carrega o esquema do Protobuf
    const root = await protobuf.load(protoPath);
    const Appearances = root.lookupType('protobuf.appearances.Appearances');

    console.log('📦 2. Lendo e decodificando o arquivo binário de aparências...');
    const buffer = fs.readFileSync(protobufBinaryPath);

    // 2. Decodifica o buffer usando a definição do .proto
    const message = Appearances.decode(buffer);
    const data = Appearances.toObject(message, { enums: String, longs: String }) as any;

    console.log('⚙️ 3. Processando e otimizando dados dos itens...');
    const itemsMap: Record<number, any> = {};

    // 3. Suporta os campos de lista do Protobuf ('object' ou 'appearance')
    const objectsList = data.object || data.appearance || data.objects || [];

    if (Array.isArray(objectsList)) {
      objectsList.forEach((item: any) => {
        const itemId = item.id;
        if (!itemId) return;

        const flags = item.flags || {};

        itemsMap[itemId] = {
          id: itemId,
          name: item.name || `Item ${itemId}`,
          isGround: !!flags.bank,            // É piso/chão
          isContainer: !!flags.container,    // É baú/mochila
          isStackable: !!flags.cumulative,   // É acumulável (ex: moedas)
          isUnpassable: !!flags.unpassable,  // Bloqueia passagem (ex: paredes)
          spriteId: item.frameGroup?.[0]?.spriteInfo?.spriteId?.[0] || 0,
        };
      });
    }

    // 4. Cria a pasta public/data caso não exista
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5. Salva o JSON final
    fs.writeFileSync(outputPath, JSON.stringify(itemsMap));
    console.log(`🎉 SUCESSO! ${Object.keys(itemsMap).length} aparências/itens processados e salvos em: public/data/items.json`);

  } catch (error) {
    console.error('💥 Exceção ao processar o Protobuf:', error);
  }
}

generateItemsJson();