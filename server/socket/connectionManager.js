class ConnectionManager {
  constructor() {
    this.connections = new Set();
  }

  add(socketId) {
    this.connections.add(socketId);
  }

  remove(socketId) {
    this.connections.delete(socketId);
  }

  count() {
    return this.connections.size;
  }
}

module.exports = ConnectionManager;
