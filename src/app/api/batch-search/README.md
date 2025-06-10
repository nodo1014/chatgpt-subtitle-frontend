# Batch Search API 모듈화 구조

## 📋 개요

배치 검색 API가 모듈화되어 유지보수성과 재사용성이 크게 향상되었습니다.

## 🗂️ 디렉토리 구조

```
/src/app/api/batch-search/
├── route.ts                    # API 엔드포인트 (31줄)
├── route.old.ts                # 원본 파일 백업 (198줄)
├── README.md                   # 이 문서
├── types/
│   └── index.ts               # 타입 정의 (47줄)
├── utils/
│   └── index.ts               # 유틸리티 함수 (70줄)
└── services/
    ├── database.service.ts    # 데이터베이스 서비스 (126줄)
    └── search.service.ts      # 검색 로직 서비스 (112줄)
```

## 📊 모듈화 성과

| 항목 | 이전 | 이후 | 개선율 |
|------|------|------|---------|
| 메인 파일 크기 | 198줄 | 31줄 | **84% 감소** |
| 모듈 개수 | 1개 | 5개 | **500% 증가** |
| 함수 분리도 | 낮음 | 높음 | **완전 분리** |
| 재사용성 | 없음 | 높음 | **향상됨** |

## 🔧 주요 모듈 설명

### 1. `types/index.ts` - 타입 정의
- **SubtitleData**: 자막 데이터 구조
- **SearchResult**: 검색 결과 구조
- **SentenceResult**: 문장별 검색 결과
- **BatchSearchRequest**: API 요청 구조
- **BatchSearchResponse**: API 응답 구조
- **DatabaseRow**: 데이터베이스 행 구조

### 2. `utils/index.ts` - 유틸리티 함수
- **extractEnglishSentences()**: 영어 문장 추출
- **calculateConfidence()**: 신뢰도 계산
- **calculateFallbackConfidence()**: 폴백 신뢰도 계산
- **validateSearchRequest()**: 요청 유효성 검사

### 3. `services/database.service.ts` - 데이터베이스 서비스
- **DatabaseService.getDatabase()**: DB 연결 관리
- **DatabaseService.searchWithFTS()**: FTS 검색
- **DatabaseService.searchWithLike()**: LIKE 폴백 검색
- **DatabaseService.searchInDatabase()**: 통합 검색
- **DatabaseService.closeDatabase()**: 연결 종료

### 4. `services/search.service.ts` - 검색 서비스
- **SearchService.performBatchSearch()**: 배치 검색 수행
- **SearchService.searchSentences()**: 문장별 검색
- **SearchService.calculateSearchSummary()**: 검색 요약 계산

### 5. `route.ts` - API 엔드포인트
- 간결한 엔드포인트 로직
- 명확한 에러 처리
- 적절한 HTTP 상태 코드 반환

## 🎯 개선된 특징

### 1. **단일 책임 원칙 (SRP)**
- 각 모듈이 하나의 명확한 책임을 가짐
- 함수별로 역할이 분명히 분리됨

### 2. **의존성 역전 원칙 (DIP)**
- 상위 레벨 모듈이 하위 레벨 모듈에 의존하지 않음
- 추상화에 의존하는 구조

### 3. **재사용성 향상**
- 유틸리티 함수들을 다른 API에서도 사용 가능
- 서비스 클래스를 독립적으로 테스트 가능

### 4. **에러 처리 개선**
- 각 레벨에서 적절한 에러 처리
- 상세한 로깅으로 디버깅 용이

### 5. **타입 안정성**
- 모든 데이터 구조에 TypeScript 타입 적용
- 컴파일 타임 에러 방지

## 🔄 API 사용법

### 요청 예시
```typescript
POST /api/batch-search
Content-Type: application/json

{
  "text": "Hello world\nHow are you\nGoodbye",
  "results_per_sentence": 20
}
```

### 응답 예시
```typescript
{
  "success": true,
  "extracted_sentences": ["Hello world", "How are you", "Goodbye"],
  "search_summary": {
    "total_sentences": 3,
    "total_results": 45,
    "average_per_sentence": "15.0",
    "search_time": 1.2
  },
  "sentence_results": [...],
  "auto_create_clips": true
}
```

## 🚀 향후 개선 계획

### 즉시 가능한 개선
1. **단위 테스트 작성** - 각 서비스별 테스트 코드
2. **성능 측정** - 실제 검색 시간 측정 로직 추가
3. **캐싱 구현** - 자주 검색되는 쿼리 캐싱

### 중장기 개선
1. **검색 알고리즘 최적화** - 더 정확한 매칭 알고리즘
2. **병렬 처리** - 여러 문장 동시 검색
3. **모니터링 추가** - 검색 성능 및 오류 모니터링

## ✨ 아키텍처 품질 향상

### Before (Monolithic)
```
route.ts (198줄)
├── 모든 로직이 한 파일에 집중
├── 높은 결합도, 낮은 응집도
└── 테스트 및 유지보수 어려움
```

### After (Modular)
```
route.ts (31줄)
├── types/     - 타입 정의 분리
├── utils/     - 순수 함수 분리
└── services/  - 비즈니스 로직 분리
    ├── database.service.ts
    └── search.service.ts
```

이제 배치 검색 API도 Results 페이지와 동일하게 깔끔하고 유지보수하기 쉬운 모듈화된 구조를 갖게 되었습니다!
