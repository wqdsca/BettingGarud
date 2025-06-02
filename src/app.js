require('dotenv').config();

const express = require('express');
const http = require('http');
const TokenService = require('./services/Token/TokenService');
const { connectDB } = require('./config/db');
const fs = require('fs');
const cors = require('cors');
const client = require('prom-client'); // 📊 Prometheus client
const { redisStatusGauge } = require('./config/redis'); // ✅ Redis 상태 메트릭 연동

// ─── 미들웨어 ──────────────────────────────────────
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { measureResponseTime } = require('./utils/performance');
const { noCache } = require('./utils/cache');
const corsMiddleware = require('./middlewares/cors');
const checkAppVersion = require('./middlewares/appVersion');
const {
  helmetMiddleware,
  hppProtection,
} = require('./middlewares/security');
const morganMiddleware = require('./middlewares/morgan');

// ─── 로거 ───────────────────────────────────────────
const { logger } = require('./utils/logger');
const { transports, format } = require('winston');

// ─── 라우터 ────────────────────────────────────────
const v1Router = require('./routes/v1');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Prometheus 기본 메트릭 수집 ──────────────────
client.collectDefaultMetrics();

// ─── Prometheus 메트릭 엔드포인트 ────────────────
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    logger.error(`❌ Prometheus 메트릭 오류: ${err.message}`);
    res.status(500).end();
  }
});
// ─── 전역 미들웨어 ──────────────────────────────────
app.use(helmetMiddleware);
app.use(hppProtection);
app.use(corsMiddleware);
app.use(morganMiddleware);
app.use(measureResponseTime);
// app.use(noCache); // ❓ 필요한 경우만 활성화
// app.use(checkAppVersion); // ❓ 앱 버전 검증 미사용 시 주석 유지
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── 인증 분기 처리 ────────────────────────────────
const authWhiteList = ['/auth/login', '/auth/register'];
app.use('/api', (req, res, next) => {
  if (authWhiteList.includes(req.path)) return next();
  return TokenService.verifyAccessToken(req, res, next);
});

// ─── API 등록 ─────────────────────────────────────
app.use('/api/v1', v1Router);



// ─── 루트 라우터 ──────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '✅ BetGuard 서버 작동 중!',
    apiVersion: 'v1',
    documentation: '/api-docs'
  });
});

// ─── 에러 핸들러 ──────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── 서버 및 DB 연결 ──────────────────────────────
const server = http.createServer(app);

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`❌ 서버 시작 중 오류 발생: ${err.message}`);
    process.exit(1);
  }
})();

// ─── Graceful Shutdown ────────────────────────────
const shutdown = () => {
  logger.info('🔒 서버 종료 중...');
  server.close(() => {
    logger.info('✅ 서버 안전 종료 완료');
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ─── 예기치 않은 예외 처리 ───────────────────────
process.on('uncaughtException', err => {
  logger.error(`💥 Uncaught Exception: ${err.message}`);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error(`🔥 Unhandled Rejection: ${reason?.message || reason}`);
});
