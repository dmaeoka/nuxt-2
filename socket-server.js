const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

let lastCount = 0;

wss.on('connection', function connection(ws) {
  console.log('A new client connected.');
  // Send the last known count to the new client
  ws.send(lastCount.toString());

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    const newCount = parseInt(data, 10);
    if (!isNaN(newCount)) {
      lastCount = newCount;
      // Broadcast the new count to all clients
      wss.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
          client.send(lastCount.toString());
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});

console.log('WebSocket server started on ws://localhost:8080');
