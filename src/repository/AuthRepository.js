// repository/AuthRepository.js
const AuthModel = require('../model/dbModel/dbAuthModel');

class AuthRepository {
  /**
   * myuserId에 해당하는 레코드 조회
   * @param {string} userId
   * @returns {Promise<AuthModel|null>}
   */
  async findByUserId(userId) {
    // 모델 필드명은 myuserId 이므로 where: { myuserId: userId }
    return await AuthModel.findOne({ where: { myuserId: userId } });
  }

  /**
   * 전달된 userModel 객체 안의 필드를 모두 업데이트
   * 단, myuserId는 PK 역할이므로 변경할 수 없습니다. 
   * @param {Object} userModel
   *   - userModel.myuserId       : 기존 사용자를 식별하기 위한 값 (필수)
   *   - userModel.myFcmToken     : 새로 저장할 FCM 토큰 (선택)
   *   - userModel.otheruserId    : 부모/배우자 ID (선택)
   *   - userModel.otheruserFcmToken: 부모/배우자 FCM 토큰 (선택)
   * @returns {Promise<[number, AuthModel[]]>}
   */
  async updateUserModel(userModel) {
    // userModel.myuserId를 WHERE 절에 사용
    // 실제로 업데이트할 필드만 추려서 객체로 전달하면, 
    // 모델 정의에 없는 필드는 무시됩니다.
    const { myuserId, myFcmToken, otheruserId, otheruserFcmToken } = userModel;

    // update 메서드 첫번째 인자는 “변경할 컬럼: 새 값” 객체
    const updateObj = {};
    if (typeof myFcmToken !== 'undefined')      updateObj.myFcmToken = myFcmToken;
    // if (typeof otheruserId !== 'undefined')      updateObj.otheruserId = otheruserId;
    // if (typeof otheruserFcmToken !== 'undefined') updateObj.otheruserFcmToken = otheruserFcmToken;

    // myuserId 자체는 변경하지 않고, WHERE절에만 사용
    return await AuthModel.update(updateObj, {
      where: { myuserId }
    });
  }
}

module.exports = new AuthRepository();
