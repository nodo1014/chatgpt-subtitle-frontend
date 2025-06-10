import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SubtitleData {
  media_file: string;
  text: string;
  start_time: string;
  end_time: string;
  language: string;
  directory: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty') || 'easy';
    const category = searchParams.get('category') || 'all';

    // JSON 파일 읽기
    const jsonPath = path.join(process.cwd(), 'public', 'subtitles_sample.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const subtitles: SubtitleData[] = JSON.parse(jsonData);

    // 영어 자막만 필터링
    let filteredSubtitles = subtitles.filter(sub => sub.language === 'en');

    // 난이도별 필터링
    filteredSubtitles = filteredSubtitles.filter(sub => {
      const wordCount = sub.text.split(' ').length;
      
      switch (difficulty) {
        case 'easy':
          return wordCount >= 5 && wordCount <= 8;
        case 'medium':
          return wordCount >= 8 && wordCount <= 15;
        case 'hard':
          return wordCount >= 15;
        default:
          return true;
      }
    });

    // 카테고리별 필터링 (간단한 키워드 기반)
    if (category !== 'all') {
      const keywords = getCategoryKeywords(category);
      if (keywords.length > 0) {
        filteredSubtitles = filteredSubtitles.filter(sub =>
          keywords.some(keyword => 
            sub.text.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      }
    }

    if (filteredSubtitles.length === 0) {
      return NextResponse.json({
        success: false,
        error: '해당 조건에 맞는 문장이 없습니다.'
      });
    }

    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * filteredSubtitles.length);
    const selectedSubtitle = filteredSubtitles[randomIndex];

    // 카테고리 추정
    const estimatedCategory = estimateCategory(selectedSubtitle.text);

    const sentence = {
      id: randomIndex,
      text: selectedSubtitle.text,
      media_file: selectedSubtitle.media_file,
      start_time: selectedSubtitle.start_time,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      category: estimatedCategory
    };

    return NextResponse.json({
      success: true,
      sentence
    });

  } catch (error) {
    console.error('받아쓰기 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

function getCategoryKeywords(category: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    daily: ['hello', 'good', 'morning', 'how', 'are', 'you', 'thank', 'please', 'sorry'],
    business: ['meeting', 'project', 'company', 'business', 'work', 'office', 'manager'],
    movie: ['action', 'drama', 'love', 'fight', 'hero', 'villain'],
    documentary: ['nature', 'science', 'history', 'research', 'study', 'fact']
  };
  
  return keywordMap[category] || [];
}

function estimateCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('hello') || lowerText.includes('good') || lowerText.includes('how are')) {
    return '일상 대화';
  } else if (lowerText.includes('meeting') || lowerText.includes('business') || lowerText.includes('work')) {
    return '비즈니스';
  } else if (lowerText.includes('love') || lowerText.includes('fight') || lowerText.includes('action')) {
    return '영화 대사';
  } else {
    return '일반';
  }
} 