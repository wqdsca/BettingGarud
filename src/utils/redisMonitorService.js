// services/redisMonitorService.js

/**
 * redisMonitorService
 * -------------------
 * Redis 전체 키 통계 조회 및 메모리 사용량 모니터링 기능을 제공합니다.
 * - getKeyStats(): SCAN 명령어로 도메인별 키 개수를 집계
 * - monitorMemoryUsage(): INFO 명령어의 "memory" 섹션을 파싱해 메모리 통계 반환
 */

const { redis, redisLogger, CONFIG, getKey } = require('../services/Redis/redisBase');

class RedisMonitorService {
  /**
   * Redis 키 통계 조회
   * ------------------
   * SCAN 명령어를 사용해서 다음 도메인별 키 개수를 집계합니다.
   * - users:         User:{*}
   * - boards:        Board:{*}
   * - mainBoards:    MainBoard:{*}
   * - comments:      Comment:{*}
   * - reports:       Report:{*}
   * - educations:    Education:{*}
   * - mainEducations: MainEducation:{*}
   *
   * @returns {Promise<Object>} 
   *   {
   *     users: number,
   *     boards: number,
   *     mainBoards: number,
   *     comments: number,
   *     reports: number,
   *     educations: number,
   *     mainEducations: number
   *   }
   */
  async getKeyStats() {
    try {
      const patterns = {
        users:        getKey.user('*'),
        boards:       getKey.board('*'),
        mainBoards:   getKey.mainBoard('*'),
        comments:     getKey.comment('*'),
        reports:      getKey.report('*'),
        educations:   getKey.education('*'),
        mainEducations: getKey.mainEducation('*')
      };

      const stats = {};
      for (const [name, pattern] of Object.entries(patterns)) {
        let cursor = '0';
        let count = 0;
        do {
          // SCAN cursor MATCH pattern COUNT batchSize
          const [nextCursor, keys] = await redis.scan(
            cursor,
            'MATCH', pattern,
            'COUNT', CONFIG.LIMITS.SCAN_COUNT
          );
          cursor = nextCursor;
          count += keys.length;
        } while (cursor !== '0');
        stats[name] = count;
      }
      return stats;
    } catch (error) {
      redisLogger.error('🔴 getKeyStats 실패', { message: error.message, stack: error.stack });
      return {};
    }
  }

  /**
   * Redis 메모리 사용량 모니터링
   * -----------------------------
   * INFO 명령어의 "memory" 섹션을 가져와서
   * used_memory, used_memory_peak, used_memory_lua 값을 추출해 반환합니다.
   *
   * @returns {Promise<{ used_memory: number, used_memory_peak: number, used_memory_lua: number } | null>}
   */
  async monitorMemoryUsage() {
    try {
      const infoRaw = await redis.info('memory');
      // CRLF 또는 LF 모두 대응하도록 split
      const lines = infoRaw.split(/\r?\n/);

      // 우리가 추출할 키 목록
      const wantedKeys = ['used_memory', 'used_memory_peak', 'used_memory_lua'];
      const memoryStats = {};

      for (const line of lines) {
        // 빈 줄 혹은 주석(#)은 건너뜀
        if (!line || line.startsWith('#')) continue;

        const idx = line.indexOf(':');
        if (idx === -1) continue;

        const key = line.slice(0, idx);
        const val = line.slice(idx + 1);

        if (wantedKeys.includes(key)) {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            memoryStats[key] = num;
          }
        }

        // 모든 키를 찾았으면 더 이상 순회할 필요 없음
        if (wantedKeys.every(k => k in memoryStats)) break;
      }

      return memoryStats;
    } catch (error) {
      redisLogger.error('🔴 monitorMemoryUsage 실패', { message: error.message, stack: error.stack });
      return null;
    }
  }
}

module.exports = new RedisMonitorService();
