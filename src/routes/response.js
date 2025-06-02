/**
 * API 응답 표준화 유틸리티
 * - 모든 API 응답을 일관된 형식으로 제공
 * - 성공/실패 응답 형식 통일
 */

// 성공 응답 생성
const success = (res, data = null, message = 'Success') => {
  return res.json({
    status: 'success',
    code: 'SUCCESS',
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// 에러 응답 생성
const error = (res, message, code = 400, data = null) => {
  return res.status(code).json({
    status: 'error',
    code: code.toString(),
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success,
  error
}; 