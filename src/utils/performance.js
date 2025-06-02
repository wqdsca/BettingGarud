const {logger} = require('../utils/logger');

/**
 * API 성능 모니터링 유틸리티
 * - API 응답 시간 측정
 * - 메모리 사용량 모니터링
 * - 요청 정보 로깅
 */

// API 응답 시간 측정
const measureResponseTime = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // 밀리초로 변환

    logger.info('API Performance', {
      path: req.path,
      method: req.method,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent']
    });
  });

  next();
};

// 메모리 사용량 모니터링
const monitorMemoryUsage = () => {
  const used = process.memoryUsage();
  
  logger.info('Memory Usage', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(used.external / 1024 / 1024)}MB`
  });
};

module.exports = {
  measureResponseTime,
  monitorMemoryUsage
}; 