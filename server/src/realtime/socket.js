export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.emit('connected', { socketId: socket.id });
    socket.on('join:organization', (organizationId) => socket.join(`org:${organizationId}`));
    socket.on('join:flash', (couponId) => socket.join(`coupon:${couponId}`));
  });
}

export function emitOrganization(io, organizationId, event, payload) {
  io?.to(`org:${organizationId}`).emit(event, payload);
}

