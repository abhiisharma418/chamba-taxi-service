let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

const ensureIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

export const notifyUser = (userId, event, payload) => {
  const io = ensureIO();
  io.to(`user:${userId}`).emit(event, payload);
};

export const notifyDriver = (driverId, event, payload) => {
  const io = ensureIO();
  io.of('/driver').to(`driver:${driverId}`).emit(event, payload);
};

export const notifyRide = (rideId, event, payload) => {
  const io = ensureIO();
  io.to(`ride:${rideId}`).emit(event, payload);
};