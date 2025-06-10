# 🎯 Theme Search - 테마별 다중 문장 검색 시스템

영어 학습을 위한 미디어 자막 검색 시스템입니다. 여러 개의 영어 문장을 한 번에 입력하여 관련된 미디어 콘텐츠를 찾을 수 있습니다.

## ✨ 주요 기능

- **배치 문장 검색**: 여러 영어 문장을 한 번에 검색
- **자동 문장 추출**: 입력된 텍스트에서 영어 문장 자동 추출
- **실시간 검색**: 빠른 JSON 기반 검색 엔진
- **반응형 디자인**: 모바일/데스크톱 최적화
- **ChatGPT 스타일 UI**: 직관적인 사용자 인터페이스

## 🚀 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **데이터**: JSON 기반 검색 (10,000+ 영어 자막)
- **배포**: Vercel

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 🎬 데이터 소스

현재 시스템은 다음과 같은 미디어 콘텐츠의 영어 자막을 포함합니다:

- TV 시리즈 (Friends, The Office, Breaking Bad 등)
- 영화
- 다큐멘터리
- 기타 영어 학습 콘텐츠

## 🔍 사용법

1. **문장 입력**: 여러 영어 문장을 텍스트 영역에 입력
2. **자동 추출**: 시스템이 영어 문장을 자동으로 추출
3. **검색 실행**: "배치 검색 시작" 버튼 클릭
4. **결과 확인**: 각 문장별로 관련 미디어 콘텐츠 확인

## 📱 반응형 디자인

- **데스크톱**: 사이드바와 메인 영역으로 구성
- **모바일**: 접을 수 있는 사이드바와 터치 최적화

## 🌐 배포

이 프로젝트는 Vercel에 배포할 수 있습니다:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/theme-search)

## 📄 라이선스

MIT License

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
