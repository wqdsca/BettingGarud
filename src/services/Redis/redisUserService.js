/**
 * redisUserService
 * ----------------
 * 온라인 유저 캐시 관리 (리스트 기반 + TTL 30분)
 */

const { cacheHelper, CONFIG, getKey } = require('./redisBase');

// ✅ TTL 포함한 캐시 헬퍼 구성
const userCache = cacheHelper(
  getKey.user,
  getKey.userList,
  CONFIG.TTL.User,
  CONFIG.LIMITS.Board // 혹은 적절한 User 리스트 최대값 설정
);

class RedisUserService {
  /**
   * 온라인 유저 추가/갱신
   * @param {Object} user - { userId, socketId, lastSeen }
   */
  async setOnlineUser(user) {
    await userCache.add(user.userId, user);
  }

  /**
   * 온라인 유저 조회 + TTL 갱신
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async getOnlineUser(userId) {
    const user = await userCache.get(userId);
    if (user) {
      const key = getKey.user(userId);
      await redis.expire(key, CONFIG.TTL.User); // TTL 갱신
    }
    return user;
  }

  /**
   * 온라인 유저 삭제
   * @param {string} userId
   */
  async deleteOnlineUser(userId) {
    await userCache.delete(userId);
  }

  /**
   * 온라인 유저 목록 조회 (리스트 기반)
   * @returns {Promise<Array<Object>>}
   */
  async getOnlineUserList() {
    return await userCache.getList();
  }
}

module.exports = new RedisUserService();
