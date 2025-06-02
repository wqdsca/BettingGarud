/**
 * 요청 속도 제한 설정
 * windowsMs: 5초 동안 최대  요청 허용 횟수
 * max: 해당 윈도우 동안 최대 요청 횟수
 * 게시글 댓글 등등등 .... 추가예정
 */
const rateLimit = require('express-rate-limit');

const generateRateLimiter = rateLimit({
    windowMs: 5 * 1000,
    max: 10,
    message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
});



function applyRateLimiter(app) {
    app.use("/api", generateRateLimiter);
}

module.exports = { applyRateLimiter };