// src/middlewares/upload.js

/**
 * 파일 업로드용 Multer 설정 (이미지 & 동영상 분리)
 * - 이미지: 최대 5MB, JPEG/PNG/JPG만 허용
 * - 동영상: 최대 50MB, MP4/MOV/AVI/WEBM/OGG만 허용
 */

const multer = require('multer');
const path = require('path');

// ---------------------------------------------
// 1) 공통 저장 설정 (diskStorage)
// ---------------------------------------------
const storage = multer.diskStorage({
  /**
   * destination: 업로드된 파일을 저장할 디렉터리
   * - 'uploads/' 폴더를 사용
   */
  destination: (req, file, cb) => {
    cb(null, '../../uploads/');
  },
  /**
   * filename: 저장될 파일명 형식 지정
   * - 필드 이름 + '-' + 타임스탬프 + 랜덤 숫자 + 확장자
   *   예) image-1617891234567-123456789.png
   */
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ---------------------------------------------
// 2) 이미지 전용 업로드 설정
// ---------------------------------------------
const uploadImage = multer({
  storage,
  /**
   * fileFilter: 이미지 MIME 타입만 허용
   * - 허용: image/jpeg, image/png, image/jpg
   * - 그 외 타입 거부
   */
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // 허용되지 않는 형식인 경우 에러 객체 전달
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  },
  /**
   * limits: 파일 크기 제한
   * - 이미지 최대 5MB
   */
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// ---------------------------------------------
// 3) 동영상 전용 업로드 설정
// ---------------------------------------------
const uploadVideo = multer({
  storage,
  /**
   * fileFilter: 동영상 MIME 타입만 허용
   * - 허용: video/mp4, video/mov, video/avi, video/webm, video/ogg
   * - 그 외 타입 거부
   */
  fileFilter: (req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/ogg'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // 허용되지 않는 형식인 경우 에러 객체 전달
      cb(new Error('동영상 파일만 업로드 가능합니다.'), false);
    }
  },
  /**
   * limits: 파일 크기 제한
   * - 동영상 최대 50MB
   */
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = { uploadImage, uploadVideo };
