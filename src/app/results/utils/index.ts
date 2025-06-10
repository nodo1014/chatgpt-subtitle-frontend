// Results 페이지 유틸리티 함수들

export const formatTime = (timeStr: string): string => {
  // "00:01:23,456" 형식을 "1:23" 형식으로 변환
  try {
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2].split(',')[0]);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
};

export const getLanguageEmoji = (language: string): string => {
  return language === 'ko' ? '🇰🇷' : '🇺🇸';
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.95) return 'text-green-600';
  if (confidence >= 0.8) return 'text-blue-600';
  if (confidence >= 0.7) return 'text-yellow-600';
  return 'text-red-600';
};

export const getMatchType = (confidence: number): string => {
  if (confidence >= 0.95) return '완전일치';
  if (confidence >= 0.8) return '정확매치';
  if (confidence >= 0.7) return '부분매치';
  return '유사매치';
};

export const showToastMessage = (
  message: string, 
  setToastMessage: (message: string) => void,
  setShowToast: (show: boolean) => void
): void => {
  setToastMessage(message);
  setShowToast(true);
  setTimeout(() => setShowToast(false), 4000);
};

export const loadSearchHistory = (): import('../types').HistoryItem[] => {
  // 샘플 히스토리 데이터
  return [
    { title: '💕 사랑과 관계 표현', count: 15, timestamp: '2024-01-15' },
    { title: '💼 비즈니스 미팅 영어', count: 12, timestamp: '2024-01-14' },
    { title: '☕ 일상 대화 표현', count: 18, timestamp: '2024-01-13' },
    { title: '😊 감정 표현하기', count: 20, timestamp: '2024-01-12' },
    { title: '🍕 음식 관련 표현', count: 16, timestamp: '2024-01-11' },
    { title: '✈️ 여행 영어 표현', count: 22, timestamp: '2024-01-10' },
    { title: '🎓 학교생활 표현', count: 14, timestamp: '2024-01-09' },
    { title: '💪 운동과 건강', count: 19, timestamp: '2024-01-08' },
    { title: '🎬 영화 리뷰 표현', count: 17, timestamp: '2024-01-07' },
    { title: '🛍️ 쇼핑 영어', count: 13, timestamp: '2024-01-06' },
  ];
};
