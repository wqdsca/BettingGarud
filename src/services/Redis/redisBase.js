/**
 * Redis 공통 유틸 (redisBase)
 * - Redis 클라이언트, TTL/리밋 설정, Key 헬퍼, Pipeline, 공통 캐시 Helper, Logger를 제공
 */

const redis = require('../../config/redis');                             // Redis 클라이언트 (ioredis 인스턴스)
const redisLogger = require('../../utils/logger');         // Redis 전용 로거

/**
 * TTL과 LIMITS 설정
 * - TTL: 각 도메인별 데이터 만료 시간(초 단위)
 * - LIMITS: 각 도메인별 리스트 최대 길이, SCAN 배치 크기 등
 */
const CONFIG = {
  TTL: {
    User:           1800,   // 온라인 유저 TTL (30분)
  },
  LIMITS: {
    Board:          20,
    MainBoard:      4,
    Comment:        20,
    Report:         20,
    Education:      20,
    MainEducation:  4,
    SCAN_COUNT:     100
  }
};

/**
 * Redis Key 헬퍼
 * - 도메인별 일관된 key 네이밍을 위해 함수 제공
 */
const getKey = {
  // User 도메인
  user:               (userId)           => `User:${userId}`,
  userList:                       ()  => `UserList:latest`,

  // Board
  // board:              (boardId)          => `Board:${boardId}`,
  // boardList:                         ()  => `BoardList:latest`,

  // // MainBoard
  // mainBoard:          (boardId)          => `MainBoard:${boardId}`,
  // mainBoardList:                    ()  => `MainBoardList:latest`,

  // // Comment
  // comment:            (commentId)        => `Comment:${commentId}`,
  // commentList:                      ()  => `CommentList:latest`,

  // // Report
  // report:             (reportId)         => `Report:${reportId}`,
  // reportList:                       ()  => `ReportList:latest`,

  // // Education
  // education:          (educationId)      => `Education:${educationId}`,
  // educationList:                    ()  => `EducationList:latest`,

  // // MainEducation
  // mainEducation:      (educationId)      => `MainEducation:${educationId}`,
  // mainEducationList:                ()  => `MainEducationList:latest`
};

/**
 * 파이프라인 유틸
 * - 여러 Redis 명령을 한 번에 실행 (네트워크 왕복 최소화)
 * @param {Array<{method: string, args: Array}>} commands
 * @returns {Promise<Array>}
 */
async function pipeline(commands) {
  const pipe = redis.pipeline();
  commands.forEach(cmd => {
    pipe[cmd.method](...cmd.args);
  });
  return await pipe.exec();
}

/**
 * 공통 캐시 헬퍼 (도메인별 CRUD 캐시 로직을 통합 관리)
 * - itemKey: ID에 해당하는 단일 캐시 Key 생성 함수
 * - listKey: 전체 목록 Key 생성 함수
 * - ttl: 캐시 TTL (초) / null 이면 TTL 없음
 * - limit: 리스트 최대 보관 개수
 */
const cacheHelper = (itemKeyFn, listKeyFn, ttl = null, limit = 20) => ({
  /**
   * 캐시 추가 또는 갱신
   * @param {string} id - 항목 ID
   * @param {Object} data - 저장할 JSON 객체
   */
  async add(id, data) {
    const key = itemKeyFn(id);
    const listKey = listKeyFn();

    const args = [key, JSON.stringify(data)];
    if (ttl) {
      args.push('EX', ttl); // TTL 설정 (optional)
    }

    const commands = [
      { method: 'set',  args },
      { method: 'lrem', args: [listKey, 0, id] },            // 중복 제거
      { method: 'lpush', args: [listKey, id] },              // 앞에 추가
      { method: 'ltrim', args: [listKey, 0, limit - 1] }     // 최대 개수 유지
    ];

    await pipeline(commands);
  },

  /**
   * 목록 조회
   * - 유효하지 않은 항목은 자동 제거 (유령 ID 제거)
   * @returns {Promise<Array<Object>>}
   */
  async getList() {
    const listKey = listKeyFn();
    const ids = await redis.lrange(listKey, 0, limit - 1);
    if (ids.length === 0) return [];

    const pipe = redis.pipeline();
    ids.forEach(id => pipe.get(itemKeyFn(id)));
    const results = await pipe.exec();

    const valid = [];
    for (let i = 0; i < results.length; i++) {
      const [err, val] = results[i];
      if (err || !val) {
        await redis.lrem(listKey, 0, ids[i]); // 유령 ID 제거
      } else {
        valid.push(JSON.parse(val));
      }
    }
    return valid;
  },

  /**
   * 단일 항목 조회
   * @param {string} id - 항목 ID
   * @returns {Promise<Object|null>}
   */
  async get(id) {
    const val = await redis.get(itemKeyFn(id));
    return val ? JSON.parse(val) : null;
  },

  /**
   * 항목 삭제
   * - 캐시 값과 리스트에서 모두 제거
   * @param {string} id - 항목 ID
   */
  async delete(id) {
    await redis.del(itemKeyFn(id));
    await redis.lrem(listKeyFn(), 0, id);
  }
});

module.exports = {
  redis,
  redisLogger,
  CONFIG,
  getKey,
  pipeline,
  cacheHelper // ✅ 공통 캐시 헬퍼 추가
};
