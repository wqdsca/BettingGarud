const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// 📁 로그 저장 디렉토리 경로
const logDir = path.join(__dirname, '../logs');

// 📁 logs 폴더가 없으면 자동 생성
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 🧾 공통 로그 포맷: [시간] [레벨] 메시지
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
);

// 📦 도메인별 로거 생성 함수
const createDomainLogger = (filename) => {
  const logger = createLogger({
    level: 'info', // info 이상만 기록 (info, warn, error)
    format: logFormat,
    transports: [
      // 📄 일반 로그 (info/warn/error 포함)
      new DailyRotateFile({
        dirname: logDir,
        filename: `${filename}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d'
      }),
      // 🛑 에러 전용 로그
      new DailyRotateFile({
        dirname: logDir,
        filename: `${filename}-error-%DATE%.log`,
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '60d'
      })
    ],
    exitOnError: false
  });

  // 🖥 개발 환경에서는 콘솔에도 출력
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }));
  }

  return logger;
};

// 🌐 기본 서버 전역 로거
const logger = createDomainLogger('server');

// 🧩 도메인별 전용 로거 (필요 시 주석 해제)
const loginLogger = createDomainLogger('login');
// const boardLogger = createDomainLogger('board');
// const commentLogger = createDomainLogger('comment');
// const reportLogger = createDomainLogger('report');
// const notifyLogger = createDomainLogger('notify');

// 🔁 Redis 연동 로그 전용
const redisLogger = createDomainLogger('redis');

// 📤 외부 모듈로 내보내기
module.exports = {
  logger,         // 서버 전역 로거
  loginLogger,    // 로그인 관련 로그
  // boardLogger,
  // commentLogger,
  // reportLogger,
  // notifyLogger,
  redisLogger     // Redis 연결, 상태 관련 로그
};
