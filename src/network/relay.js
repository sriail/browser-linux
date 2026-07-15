// In-memory state for rooms. 
const rooms = {};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Match paths like /relay/my-room-name
    const match = path.match(/^\/relay\/([a-zA-Z0-9-_]+)$/);
    
    if (!match) {
      return new Response("WebSocket Relay Server\nConnect to: wss://<url>/relay/<room_id>", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    const roomId = match[1];
    const upgradeHeader = request.headers.get("Upgrade");
    
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // Create a WebSocket pair
    const [client, server] = new WebSocketPair();
    server.accept();

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = new Set();
    }

    // Add the new server socket to the room
    rooms[roomId].add(server);

    // Relay messages to all other peers in the room
    server.addEventListener("message", (event) => {
      const data = event.data; // Handles both text and binary (ArrayBuffer) payloads
      
      // Broadcast to all other connected clients in the same room
      for (const peer of rooms[roomId]) {
        // Don't send the message back to the sender
        if (peer !== server && peer.readyState === 1) { // 1 = OPEN
          peer.send(data);
        }
      }
    });

    // Clean up on disconnect
    server.addEventListener("close", () => {
      rooms[roomId].delete(server);
      // Clean up the room if it's empty to save memory
      if (rooms[roomId].size === 0) {
        delete rooms[roomId];
      }
    });

    // Clean up on error
    server.addEventListener("error", (err) => {
      console.error(`WebSocket error in room ${roomId}:`, err);
      rooms[roomId].delete(server);
      if (rooms[roomId] && rooms[roomId].size === 0) {
        delete rooms[roomId];
      }
    });

    // Return the client side of the WebSocket
    return new Response(null, { status: 101, webSocket: client });
  }
};
