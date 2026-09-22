const { EventEmitter } = require("events");

/**
 * Any module can emit domain events here without importing Socket.IO directly.
 * socket.gateway.js subscribes to these events and pushes them to the right
 * user room. Keeps business-logic modules testable and free of transport concerns.
 */
const realtimeBus = new EventEmitter();

function emitRealtime(event) {
  realtimeBus.emit(event.type, event);
}

module.exports = { realtimeBus, emitRealtime };
