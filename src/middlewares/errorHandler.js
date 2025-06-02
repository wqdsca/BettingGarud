const { logger } = require('../utils/logger');

/**
 * 404 에러 핸들러
 * - 존재하지 않는 라우트에 대한 처리
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * 전역 에러 핸들러
 * - 모든 에러를 일관된 형식으로 처리
 * - 개발/운영 환경에 따른 에러 정보 제공
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // 에러 로깅
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers
  });

  // 모바일 앱을 위한 에러 응답
  res.status(statusCode).json({
    status: 'error',
    code: err.code || statusCode.toString(),
    message: err.message || '서버 에러가 발생했습니다',
    data: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      path: req.path,
      method: req.method
    } : null,
    timestamp: new Date().toISOString()
  });
};

module.exports = { notFound, errorHandler }; 