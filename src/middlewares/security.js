const helmet = require('helmet');
const hpp = require('hpp');
const logger = require('../utils/logger');

/**
 * Helmet 보안 설정
 * - HTTP 응답 헤더를 안전하게 설정하여 다양한 공격을 방지
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],                 // 기본 리소스 출처 제한
      scriptSrc: ["'self'"],                 // 스크립트 출처 제한
      styleSrc: ["'self'"],                  // 스타일 출처 제한
      imgSrc: ["'self'", 'data:', 'https:'], // 이미지 출처 허용
      connectSrc: ["'self'"],                // AJAX 등 연결 허용 출처
      fontSrc: ["'self'"],                   // 폰트 출처 제한
      objectSrc: ["'none'"],                 // 플래시, 플러그인 금지
      mediaSrc: ["'self'"],                  // 오디오/비디오 출처 제한
      frameSrc: ["'none'"]                   // iframe 등 프레임 제한
    }
  },
  crossOriginEmbedderPolicy: true,                          // COEP 헤더
  crossOriginOpenerPolicy: true,                            // COOP 헤더
  crossOriginResourcePolicy: { policy: "same-site" },       // CORP 헤더
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Referrer 제한
  frameguard: { action: 'deny' },                           // clickjacking 방지
  hidePoweredBy: true,                                      // X-Powered-By 제거
  dnsPrefetchControl: true,                                 // DNS prefetch 제어
  // hsts: {                                                   // HTTPS 강제 운영단계 주석해제
  //   maxAge: 31536000,
  //   includeSubDomains: true,
  //   preload: true
  // },
  noSniff: true,                                            // MIME 타입 스니핑 방지
  ieNoOpen: true                                            // IE에서 파일 다운로드 방지
});


/**
 * HTTP Parameter Pollution 방지
 * - 중복 쿼리 파라미터 공격 방지 (?id=1&id=2)
 */
const hppProtection = hpp();

/**
 * SQL Injection 방지 미들웨어
 * - URL, body, query, params에 SQL 키워드/문자열이 포함되어 있으면 차단
 * - 중첩된 값까지 검사
 */
const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)|(;)|(\b(SELECT|INSERT|DELETE|UPDATE|DROP|UNION|OR|AND|EXEC|EXECUTE|WHERE|HAVING)\b)/i;

// 문자열 단위 악성 여부 검사
const isMalicious = (val) => typeof val === 'string' && sqlInjectionPattern.test(val);

// 중첩 객체까지 탐색
const deepCheck = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  for (const key in obj) {
    const val = obj[key];
    if (Array.isArray(val)) {
      if (val.some(isMalicious)) return true;
    } else if (typeof val === 'object') {
      if (deepCheck(val)) return true;
    } else if (isMalicious(val)) {
      return true;
    }
  }
  return false;
};

const sqlInjectionProtection = (req, res, next) => {
  try {
    const inputs = [req.url, req.query, req.body, req.params];
    const detected = inputs.some((input) =>
      typeof input === 'string' ? isMalicious(input) : deepCheck(input)
    );

    if (detected) {
      logger.warn('🚨 SQL Injection 탐지됨', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip
      });
      return res.status(403).json({
        status: 'error',
        code: '403',
        message: '잘못된 요청입니다.',
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (err) {
    logger.error('❌ SQL Injection 검사 실패', { message: err.message });
    return res.status(410).json({
      status: 'error',
      code: '410',
      message: '보안 검사 중 오류 발생',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 요청 크기 제한 (기본: 50MB)
 * - 대용량 파일 전송으로 인한 서버 자원 낭비 방지
 */
const requestSizeLimit = (req, res, next) => {
  const maxSize = 50 * 1024 * 1024;
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);

  if (!isNaN(contentLength) && contentLength > maxSize) {
    return res.status(413).json({
      status: 'error',
      code: '413',
      message: '요청 크기가 너무 큽니다.',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  helmetMiddleware,        // HTTP 보안 헤더 설정
  hppProtection,           // HPP 방지
  sqlInjectionProtection,  // SQL Injection 방지
  requestSizeLimit         // 요청 크기 제한
};
