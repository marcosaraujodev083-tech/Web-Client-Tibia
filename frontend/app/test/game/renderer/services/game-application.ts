import * as PIXI from 'pixi.js';

export class GameApplication {
    private app: PIXI.Application;

    // Camadas de renderização para empilhamento correto (Chão, Itens, Criaturas)
    private groundLayer: PIXI.Container;
    private objectLayer: PIXI.Container;
    private creatureLayer: PIXI.Container;

    // Tamanho padrão de cada quadrado (Tile) do Tibia
    public readonly TILE_SIZE = 32;

    // Variáveis que vão guardar a quantidade de colunas/linhas calculadas para a tela
    public visibleTilesX = 15;
    public visibleTilesY = 11;

    private isInitialized = false;

    // 🛡️ Flag e controle de visibilidade do mapa
    private isMapReady = false;

    private parentElement: HTMLDivElement;

    constructor(parentElement: HTMLDivElement) {
        this.parentElement = parentElement;
        this.app = new PIXI.Application();

        this.groundLayer = new PIXI.Container();
        this.objectLayer = new PIXI.Container();
        this.creatureLayer = new PIXI.Container();

        this.initPixi(parentElement);
    }

    private async initPixi(parentElement: HTMLDivElement) {
        // 📏 Mede o tamanho real disponível na tela dentro da Div do seu layout
        const rect = parentElement.getBoundingClientRect();

        // Garante valores mínimos para não calcular 0
        const width = rect.width || 800;
        const height = rect.height || 600;

        // Calcula quantos quadradinhos de 32x32 cabem na largura e altura
        this.visibleTilesX = Math.floor(width / this.TILE_SIZE);
        this.visibleTilesY = Math.floor(height / this.TILE_SIZE);

        // Define as dimensões exatas da área do Pixi baseada nos múltiplos de 32
        const finalWidth = this.visibleTilesX * this.TILE_SIZE;
        const finalHeight = this.visibleTilesY * this.TILE_SIZE;

        await this.app.init({
            width: finalWidth,
            height: finalHeight,
            backgroundColor: 0x000000, // Fundo preto puro durante o aguardo
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        // Previne vazamento caso o React tenha desmontado a tela durante o await
        if (!this.parentElement) return;

        // Injeta o canvas gerado pelo PixiJS dentro da Div do Next.js
        this.parentElement.appendChild(this.app.canvas);

        // Adiciona as camadas no Stage principal em ordem de profundidade
        this.app.stage.addChild(this.groundLayer);
        this.app.stage.addChild(this.objectLayer);
        this.app.stage.addChild(this.creatureLayer);

        // 🔒 OCULTA O STAGE ATÉ O MAPA ESTAR TOTALMENTE CARREGADO EM MEMÓRIA
        this.app.stage.visible = false;

        // Ativa o Ticker nativo do PixiJS (60 FPS na GPU)
        this.app.ticker.add((ticker) => this.gameTick(ticker.deltaTime));

        this.isInitialized = true;
        console.log(`[PixiJS] Inicializado! Aguardando dados do mapa (0x00)... Viewport: ${this.visibleTilesX}x${this.visibleTilesY} tiles.`);
    }

    private gameTick(delta: number): void {
        // ⛔ Se o mapa ainda não estiver pronto, ignora o loop de animação/renderização
        if (!this.isMapReady) return;

        // Loop executado a cada frame na placa de vídeo
    }

    private setupDebugGrid(): void {
        this.groundLayer.removeChildren(); // Limpa grid/chão antigo

        const grid = new PIXI.Graphics();

        for (let x = 0; x < this.visibleTilesX; x++) {
            for (let y = 0; y < this.visibleTilesY; y++) {
                grid.rect(
                    x * this.TILE_SIZE,
                    y * this.TILE_SIZE,
                    this.TILE_SIZE,
                    this.TILE_SIZE
                );
            }
        }

        // Aplica a linha cinza sutil em todos os retângulos
        grid.stroke({ width: 1, color: 0x262626, alpha: 1 });

        this.groundLayer.addChild(grid);
    }

    /**
     * 🟢 Notifica o renderer que o mapa foi carregado na memória e pode ser exibido
     */
    public setMapReady(ready: boolean = true): void {
        this.isMapReady = ready;
        if (this.app?.stage) {
            this.app.stage.visible = ready;
        }

        if (ready) {
            console.log("🔓 [PixiJS] Mapa pronto em memória. Liberação visual ativada no Canvas!");
        }
    }

    /**
     * 🗺️ Desenha o pacote inicial do mapa (OpCode 0x00) ou Chunks recebidos via WebSocket
     */
    public renderMap(mapData: any): void {
        if (!this.isInitialized) {
            console.warn("[PixiJS] Tentativa de renderizar mapa antes da inicialização do Canvas.");
            return;
        }

        console.log("🎨 [PixiJS] Renderizando dados de mapa recebidos:", mapData);

        // Desenha o grid debug ou tiles reais
        this.setupDebugGrid();

        // 🔓 Ativa a visibilidade do mapa na tela assim que processar os dados
        this.setMapReady(true);
    }

    /**
     * 📦 Atualização incremental de chunks do mapa (OpCode 0x49 ou similar)
     */
    public renderMapChunk(chunkData: any): void {
        if (!this.isInitialized || !this.isMapReady) return;

        console.log("📦 [PixiJS] Atualizando chunk do mapa:", chunkData);
    }

    /**
     * 🧹 Limpeza completa para evitar vazamento de memória ao mudar de página
     */
    public destroy(): void {
        this.isInitialized = false;
        this.isMapReady = false;

        if (this.app) {
            try {
                if (this.app.canvas && this.app.canvas.parentNode) {
                    this.app.canvas.parentNode.removeChild(this.app.canvas);
                }
                this.app.destroy(true, { children: true });
            } catch (err) {
                console.warn("[PixiJS] Erro ao destruir aplicação:", err);
            }
        }
    }
}