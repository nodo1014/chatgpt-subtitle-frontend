// UI 표준 설정
export const UI_STANDARDS = {
  // 헤더 색상 설정
  HEADER: {
    background: 'bg-slate-800',
    text: 'text-white',
    subtitle: 'text-slate-300',
    border: 'border-slate-600',
    button: {
      background: 'bg-transparent',
      border: 'border-slate-600',
      text: 'text-slate-300',
      hover: 'hover:bg-slate-700'
    },
    stats: {
      background: 'bg-slate-700',
      text: 'text-slate-200'
    }
  },

  // 탭 색상 설정
  TABS: {
    container: 'bg-white border-b-2 border-gray-100 shadow-sm',
    inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
    colorSchemes: [
      { active: 'border-blue-500 text-blue-600 bg-blue-50', bar: 'bg-blue-500' },
      { active: 'border-green-500 text-green-600 bg-green-50', bar: 'bg-green-500' },
      { active: 'border-purple-500 text-purple-600 bg-purple-50', bar: 'bg-purple-500' },
      { active: 'border-orange-500 text-orange-600 bg-orange-50', bar: 'bg-orange-500' },
      { active: 'border-red-500 text-red-600 bg-red-50', bar: 'bg-red-500' },
      { active: 'border-indigo-500 text-indigo-600 bg-indigo-50', bar: 'bg-indigo-500' },
    ]
  },

  // 공통 UI 요소
  COMMON: {
    pageBackground: 'bg-white',
    cardBackground: 'bg-white',
    cardBorder: 'border-gray-200',
    shadow: 'shadow-sm',
    roundedCorners: 'rounded-lg',
    buttonTransition: 'transition-all duration-200'
  }
};

// 페이지별 특화 설정
export const PAGE_CONFIGS = {
  'clips-manage': {
    title: '클립 관리',
    subtitle: '클립 데이터베이스 관리 및 검색',
    icon: '🗄️',
    tabs: [
      { id: 'manage', label: '클립 관리', icon: '📋' },
      { id: 'ai-analysis', label: 'AI 분석', icon: '🤖' }
    ]
  },
  'results': {
    title: '검색 결과',
    subtitle: '다중 문장 검색 결과',
    icon: '🔍',
    tabs: [
      { id: 'search', label: '검색 결과', icon: '🔍' },
      { id: 'clips', label: '클립', icon: '🎬' }
    ]
  },
  'producer': {
    title: '컨텐츠 제작 대시보드',
    subtitle: '유튜브 영어 학습 컨텐츠 제작 워크플로우',
    icon: '🎬'
  }
};
