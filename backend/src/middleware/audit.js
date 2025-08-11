export const auditLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = {
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      userId: req.user?.id || null,
      ip: req.ip,
      durationMs: duration,
    };
    if (process.env.NODE_ENV !== 'test') {
      console.log('[AUDIT]', JSON.stringify(entry));
    }
  });
  next();
};