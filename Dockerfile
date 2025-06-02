# 1. 베이스 이미지
FROM node:18-slim

# 2. 빌드 시점 포트 인자 설정 (기본값: 3000)
ARG PORT=3000
ENV PORT=${PORT}

# 3. 작업 디렉터리
WORKDIR /usr/src/app

# 4. 의존성 설치
COPY package*.json ./
RUN npm install --production

# 5. 소스 복사
COPY . .

# 6. EXPOSE는 빌드 시 ARG로 지정된 포트를 사용
EXPOSE ${PORT}

# 7. 컨테이너 시작 커맨드
CMD ["node", "src/app.js"]
