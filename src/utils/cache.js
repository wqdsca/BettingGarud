/**
 * 캐시 컨트롤 유틸리티
 * - API 응답 캐시 설정
 * - 정적 파일 캐시 설정
 * - 캐시 헤더 관리
 */

// API 응답 캐시 비활성화 (동적 데이터)
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
};

// 정적 파일 캐시 설정 (이미지, CSS, JS 등)
const staticCache = (req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|css|js)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1년
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
};

// 짧은 시간 캐시 (자주 변경되는 데이터)
const shortTermCache = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5분
  next();
};

// 중간 시간 캐시 (보통 변경되는 데이터)
const mediumTermCache = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600'); // 1시간
  next();
};

// 긴 시간 캐시 (거의 변경되지 않는 데이터)
const longTermCache = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 24시간
  next();
};

// 조건부 캐시 설정
const conditionalCache = (maxAge = 3600) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      res.set('Cache-Control', 'no-store');
    }
    next();
  };
};

module.exports = {
  noCache,          // 동적 데이터 (예: 실시간 데이터, 사용자 정보)
  staticCache,      // 정적 파일 (예: 이미지, CSS, JS)
  shortTermCache,   // 자주 변경되는 데이터 (예: 실시간 순위, 최근 게시물)
  mediumTermCache,  // 보통 변경되는 데이터 (예: 게시물 목록, 통계)
  longTermCache,    // 거의 변경되지 않는 데이터 (예: 설정, 정책)
  conditionalCache  // 조건부 캐시 (예: GET 요청만 캐시)
}; 