import { RenderTemplate } from '../types';

// 확장된 템플릿 정의 (카테고리별 구체적 템플릿)
export const templates: RenderTemplate[] = [
  // 쉐도잉 카테고리
  {
    id: 'shadowing_basic_16_9',
    name: '기본 쉐도잉 (16:9)',
    description: '영어→한글 순차 표시, 유튜브 최적화',
    category: 'shadowing',
    format: '16:9',
    resolution: '1920x1080',
    settings: {
      background: '#000000',
      font_family: 'NotoSans KR',
      font_size: 84,
      stroke_width: 1,
      text_color: '#FFFFFF',
      stroke_color: '#000000'
    }
  },
  {
    id: 'shadowing_advanced_16_9',
    name: '고급 쉐도잉 (16:9)',
    description: '발음+해설 포함, 상세 학습용',
    category: 'shadowing',
    format: '16:9',
    resolution: '1920x1080',
    settings: {
      background: '#1a1a2e',
      font_family: 'NotoSans KR',
      font_size: 78,
      stroke_width: 2,
      text_color: '#FFFFFF',
      stroke_color: '#000000'
    }
  },
  {
    id: 'shadowing_minimal_16_9',
    name: '미니멀 쉐도잉 (16:9)',
    description: '자막만 표시, 깔끔한 디자인',
    category: 'shadowing',
    format: '16:9',
    resolution: '1920x1080',
    settings: {
      background: '#f8f9fa',
      font_family: 'NotoSans KR',
      font_size: 72,
      stroke_width: 0,
      text_color: '#2d3436',
      stroke_color: '#000000'
    }
  },
  // 쇼츠 카테고리
  {
    id: 'shorts_basic_9_16',
    name: '기본 쇼츠 (9:16)',
    description: '세로형 기본 템플릿, 쇼츠/릴스용',
    category: 'shorts',
    format: '9:16',
    resolution: '1080x1920',
    settings: {
      background: '#000000',
      font_family: 'NotoSans KR',
      font_size: 72,
      stroke_width: 1,
      text_color: '#FFFFFF',
      stroke_color: '#000000'
    }
  },
  {
    id: 'shorts_colorful_9_16',
    name: '컬러풀 쇼츠 (9:16)',
    description: '화려한 컬러, 젊은 층 타겟',
    category: 'shorts',
    format: '9:16',
    resolution: '1080x1920',
    settings: {
      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
      font_family: 'NotoSans KR',
      font_size: 68,
      stroke_width: 2,
      text_color: '#FFFFFF',
      stroke_color: '#000000'
    }
  },
  {
    id: 'shorts_professional_9_16',
    name: '프로페셔널 쇼츠 (9:16)',
    description: '비즈니스/교육용, 차분한 톤',
    category: 'shorts',
    format: '9:16',
    resolution: '1080x1920',
    settings: {
      background: '#2c3e50',
      font_family: 'NotoSans KR',
      font_size: 64,
      stroke_width: 1,
      text_color: '#ecf0f1',
      stroke_color: '#34495e'
    }
  }
];
