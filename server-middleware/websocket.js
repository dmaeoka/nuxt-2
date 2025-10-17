import { WebSocketServer } from 'ws'

let lastCount = 0

export default function (req, res, next) {
  if (!res.socket.server.wss) {
    console.log('Setting up WebSocket server...')

    const wss = new WebSocketServer({ noServer: true })
    res.socket.server.wss = wss

    res.socket.server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    })

    wss.on('connection', (ws) => {
      console.log('WebSocket client connected.')
      ws.send(lastCount.toString())

      ws.on('message', (data) => {
        console.log('received: %s', data)
        const newCount = parseInt(data, 10)
        if (!isNaN(newCount)) {
          lastCount = newCount
          wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
              client.send(lastCount.toString())
            }
          })
        }
      })

      ws.on('close', () => {
        console.log('WebSocket client disconnected.')
      })
    })
  }
  next()
}
