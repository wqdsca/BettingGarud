class redisUserModel {
    constructor(userId, fcmToken, otheruserId, otheruserFcmToken,socketId,refreshToken,accessToken) {
        this.userId = userId;
        this.fcmToken = fcmToken;
        this.otheruserId = otheruserId;
        this.otheruserFcmToken = otheruserFcmToken;
        this.socketId = socketId;
        this.refreshToken = refreshToken;
    }

}

module.exports = redisUserModel;