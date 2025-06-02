require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const { sequelize } = require('../../config/db');
const AuthModel = require('../../model/dbModel/dbAuthModel');


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN;

class TokenService {
  static async generateAccessToken(userId) {
    const payload = { userId };
    const options = { expiresIn: accessTokenExpiresIn };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
  }

  static async generateRefreshToken(userId) {
    const payload = { userId };
    const options = { expiresIn: refreshTokenExpiresIn };
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
  }

  static async verifyAccessToken(req, res, next) {
    const AuthHeader = req.headers.authorization;
    if (!AuthHeader) {
      return res.status(401).json({ message: '토큰이 없습니다.' });
    }

    const parts = AuthHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: '토큰 형식이 올바르지 않습니다.' });
    }

    const token = parts[1];
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      req.userId = decoded.userId; // ⬅️ userId를 다음 미들웨어로 넘겨줌
      next();
    } catch (error) {
      return res.status(401).json({ message: '토큰이 만료되었거나 유효하지 않습니다.' });
    }
  }

  static async verifyRefreshToken(req, res, next) {
    const userId = req.userId;

    try {
      const result = await authService.getRefreshTokenByUserId(userId);
      const refreshToken = result?.refreshToken;

      if (!refreshToken) {
 
        return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
      }

      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      next();
    } catch (error) {
      return res.status(401).json({ message: '리프레시 토큰이 만료되었거나 유효하지 않습니다.' });
    }
  }
}

module.exports = TokenService;
