let connections = [];

self.addEventListener('connect', function(event) {
  const port = event.ports[0];
  const connectionId = Math.random().toString(36).substring(2, 11);

  connections.push({
    port,
    id: connectionId
  });

  port.start();

  console.log('New connection to shared worker:', connectionId, 'Total connections:', connections.length);

  port.onmessage = function(event) {
    const message = event.data;
    console.log('Worker received:', message.type, 'from:', message.domain || message.source);

    // Broadcast message to all other connections
    connections.forEach(({port: connPort, id}) => {
      // Don't send back to sender
      if (id !== connectionId) {
        try {
          connPort.postMessage(message);
          console.log('Broadcasted to connection:', id);
        } catch (error) {
          console.log('Error broadcasting to connection:', id, error);
        }
      }
    });
  };

  port.onclose = function() {
    connections = connections.filter(conn => conn.id !== connectionId);
    console.log('Connection closed:', connectionId, 'Remaining connections:', connections.length);
  };
}, false);
