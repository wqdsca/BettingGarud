/**
 * 요청 로깅 미들웨어
 * - 요청 정보를 로깅
 * - 현재 시간, 요청 메서드, 요청 경로, 상태 코드, 응답 시간 등을 기록
 */
const morgan = require('morgan');
const {logger} = require('../utils/logger');

module.exports = morgan('combined', {
    stream: {
        write: (message) => {
            logger.info(message.trim());
        },
    },
});