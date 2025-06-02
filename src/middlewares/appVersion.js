const compareVersions = require('compare-versions');
const logger = require('../utils/logger');

/**
 * 모바일 앱 버전 체크 미들웨어
 * - 클라이언트의 앱 버전을 확인하고 최소 필요 버전과 비교
 * - 업데이트가 필요한 경우 426 상태코드와 함께 업데이트 요청
 */
const checkAppVersion = (req, res, next) => {
  try {
    const appVersion = req.headers['x-app-version'];
    const minVersion = process.env.MIN_APP_VERSION;
    const forceUpdate = process.env.FORCE_UPDATE === 'true';

    // 앱 버전이 없는 경우 (웹 요청 등)
    if (!appVersion) {
      return next();
    }

    // 최소 버전과 비교
    if (compareVersions(appVersion, minVersion) < 0) {
      logger.warn(`App version check failed: ${appVersion} < ${minVersion}`);
      
      return res.status(426).json({
        status: 'error',
        code: 'UPDATE_REQUIRED',
        message: '앱 업데이트가 필요합니다',
        data: {
          updateRequired: true,
          forceUpdate,
          currentVersion: appVersion,
          minimumVersion: minVersion,
          updateUrl: process.env.APP_UPDATE_URL
        }
      });
    }

    next();
  } catch (error) {
    logger.error('App version check error:', error);
    next(error);
  }
};

module.exports = checkAppVersion; 