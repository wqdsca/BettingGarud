const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

class AuthModel extends Model {}
    AuthModel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        myuserId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            comment: '사용자 고유 식별자',
        },
        myFcmToken: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'FCM 토큰',
        },
        otheruserId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '부모 or 배우자 고유 식별자',
        },
        otheruserFcmToken: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '부모 or 배우자 FCM 토큰',
        },
        
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '생성일',
        },
        
    }, {
        sequelize: sequelize,
        modelName: 'Auth',
        tableName: 'user',
        timestamps: true,
        paranoid: true,
    });


module.exports = AuthModel;
