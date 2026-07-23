import asyncio
import json
import urllib.parse
from websockets.server import serve

# Configurações de Rede
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 1337
GAME_PORT = 2222

async def handle_login_request(reader, writer):
    """Trata a requisição HTTP inicial de Login de forma assíncrona"""
    data = await reader.read(1024)
    request_text = data.decode('utf-8', errors='ignore')

    # Isola a linha de requisição (Ex: GET /?account=333333... HTTP/1.1)
    lines = request_text.split('\r\n')
    if not lines or len(lines) == 0:
        writer.close()
        return

    req_line = lines[0]
    parts = req_line.split(' ')

    if len(parts) >= 2:
        path = parts[1]
        # Realiza o parse dos parâmetros da URL de forma segura
        parsed_url = urllib.parse.urlparse(path)
        params = urllib.parse.parse_qs(parsed_url.query)

        # Estrutura a resposta exatamente no formato que o parser do front-end precisa
        response_data = {
            "token": "eyJuYW1lIjoidGhiYnMiLCJleHBpcmUiOjE3ODQ0MTU0NjM2NzMsInRva2VuIjoiYTFlZTAx...=",
            "host": f"ws://{HTTP_HOST}:{GAME_PORT}",
            "name": params.get("account", ["Player"])[0],
            "level": 1
        }

        json_response = json.dumps(response_data)

        # Headers HTTP cruciais para o Next.js e para engines legadas (CORS + JSON)
        http_response = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: application/json\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
            "Access-Control-Allow-Headers: Content-Type\r\n"
            f"Content-Length: {len(json_response)}\r\n"
            "Connection: close\r\n"
            "\r\n"
            f"{json_response}"
          )
    else:
        http_response = "HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"

    writer.write(http_response.encode('utf-8'))
    await writer.drain()
    writer.close()

async def game_socket_handler(websocket):
    """Gerencia as mensagens WebSocket na porta do jogo (2222)"""
    print(f"[Python] 🚀 Conexão WebSocket aceita vinda de: {websocket.remote_address}")
    try:
        async for message in websocket:
            # Aqui sua engine legada enviará os primeiros pacotes de rede (Tibia OpCodes)
            print(f"[Python] Pacote recebido da Engine: {message}")

            # Resposta genérica de Keep-Alive / Login Packet de confirmação
            # O protocolo de bytes precisa corresponder ao PacketWriter do front
            await websocket.send(json.dumps({"type": "ping"}))
    except Exception as e:
        print(f"[Python] Conexão fechada ou erro no canal: {e}")

async def main():
    # Inicializa o servidor HTTP de Login na porta 1337
    login_server = await asyncio.start_server(handle_login_request, HTTP_HOST, HTTP_PORT)
    print(f"[*] Servidor de Login HTTP ativo em http://{HTTP_HOST}:{HTTP_PORT}")

    # Inicializa o servidor WebSocket de Jogo na porta 2222
    async with serve(game_socket_handler, HTTP_HOST, GAME_PORT):
        print(f"[*] Servidor WebSocket do Jogo ativo em ws://{HTTP_HOST}:{GAME_PORT}")
        await login_server.serve_forever()

if __name__ == "__main__":
    # Instalação necessária: pip install websockets
    asyncio.run(main())