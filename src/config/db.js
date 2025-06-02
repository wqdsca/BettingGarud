require('dotenv').config();
const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

const sequelize = new Sequelize(
    process.env.MYSQL_DB,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASS,
    {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        dialect: 'mysql',
        pool: {
            max: 5, // 최대 연결 수
            min: 0,
            acquire: 30000, // 연결 타임아웃
            idle: 10000, // 유휴 연결 유지 시간
        },
        logging: false,
        define: {
            timestamps: true, // createdAt, updatedAt 자동 추가
            underscored: true, // 카멜 케이스를 언더스코어로 변환
            paranoid: true, // deletedAt 자동 추가
        },
    }
);

async function connectDB(retries = 10, delay = 3000) {
    for (let i = 1; i <= retries; i++) {
      try {
        await sequelize.authenticate();
        logger.info('✅ MySQL 연결 성공');
        return;
      } catch (err) {
        logger.warn(`❌ MySQL 연결 실패 (시도 ${i}/${retries}) - ${err.message}`);
        if (i === retries) {
          logger.error('❌ MySQL 연결 재시도 실패. 서버 종료');
          process.exit(1);
        }
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

module.exports = { sequelize, connectDB };