/**
 * Joi를 이용한 요청 데이터 검증 미들웨어
 * - 전달받은 Joi 스키마로 req.body, req.params, req.query 등을 검증
 * - 검증 실패 시 에러 객체({ status, message })를 next()로 전달
 */
const Joi = require('joi');


const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    fcmToken: Joi.string().token().required(),
    loginType: Joi.string().valid('Google', 'Kakao', 'Apple').required(),
});

function validateUser(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return next({ status: 400, message: error.message });
    }
    next();
}

module.exports = { validateUser };