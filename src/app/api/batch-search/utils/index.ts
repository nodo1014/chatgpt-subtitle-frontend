
/**
 * 텍스트에서 영어 문장만 추출하는 함수
 * @param text 입력 텍스트
 * @returns 영어 문장 배열
 */
export function extractEnglishSentences(text: string): string[] {
  // 한글, 한자, 일본어 문자 제거 (유니코드 범위)
  const koreanRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g;
  
  // 줄바꿈으로 문장 분리
  const lines = text.split('\n').map(line => line.trim()).filter(line => {
    // 빈 줄 제거
    if (line.length === 0) return false;
    
    // 한글/중국어/일본어 문자가 포함된 줄 제거
    if (koreanRegex.test(line)) return false;
    
    // 최소 길이 체크 (3글자 이상)
    if (line.length < 3) return false;
    
    // 최소 단어 수 체크 (1개 이상의 단어)
    if (line.split(/\s+/).length < 1) return false;
    
    return true;
  });
  
  return lines;
}

/**
 * 검색 순위에 따른 신뢰도 계산
 * @param index 검색 결과 인덱스
 * @param baseConfidence 기본 신뢰도
 * @param maxConfidence 최대 신뢰도
 * @returns 계산된 신뢰도
 */
export function calculateConfidence(
  index: number, 
  baseConfidence: number = 0.7, 
  maxConfidence: number = 1.0
): number {
  return Math.max(baseConfidence, Math.min(maxConfidence, maxConfidence - (index * 0.05)));
}

/**
 * 폴백 검색 신뢰도 계산
 * @param index 검색 결과 인덱스
 * @returns 폴백 신뢰도
 */
export function calculateFallbackConfidence(index: number): number {
  return calculateConfidence(index, 0.6, 0.9);
}

/**
 * 검색 요청 유효성 검사
 * @param text 검색할 텍스트
 * @returns 유효성 검사 결과
 */
export function validateSearchRequest(text: unknown): { isValid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: '검색할 텍스트를 입력해주세요.' };
  }
  
  const extractedSentences = extractEnglishSentences(text);
  if (extractedSentences.length === 0) {
    return { 
      isValid: false, 
      error: '영어 문장을 찾을 수 없습니다. 각 줄에 하나씩 영어 문장을 입력해주세요.' 
    };
  }
  
  return { isValid: true };
}
