import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화 (환경변수에서 API 키 로드)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ClipAnalysisRequest {
  clipId: string;
  analyzeQuality?: boolean;
  generateTags?: boolean;
  suggestContent?: boolean;
}

interface ClipQualityAnalysis {
  audio_clarity: number;
  speech_speed: number;
  vocabulary_level: 'beginner' | 'intermediate' | 'advanced';
  grammar_complexity: number;
  emotion_tone: string;
  energy_level: number;
  engagement_score: number;
  copyright_risk: number;
}

interface AIGeneratedTags {
  expressions: string[];
  grammar_points: string[];
  vocabulary_themes: string[];
  scene_context: string[];
  emotions: string[];
  difficulty_tags: string[];
  youtube_categories: string[];
}

interface YouTubeContentSuggestion {
  title: string;
  description: string;
  tags: string[];
  thumbnail_text: string;
  target_duration: number;
  difficulty_level: string;
  learning_objectives: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ClipAnalysisRequest = await request.json();
    const { clipId, analyzeQuality = true, generateTags = true, suggestContent = true } = body;

    // 데이터베이스에서 클립 정보 조회
    const db = new Database('public/clips.db');
    const clip = db.prepare('SELECT * FROM clips WHERE id = ?').get(clipId);
    
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    const results: any = {
      clipId,
      timestamp: new Date().toISOString(),
    };

    // 1. 클립 품질 분석
    if (analyzeQuality) {
      results.qualityAnalysis = await analyzeClipQuality(clip);
    }

    // 2. AI 기반 태그 생성
    if (generateTags) {
      results.aiTags = await generateAITags(clip);
    }

    // 3. 유튜브 컨텐츠 제안
    if (suggestContent) {
      results.contentSuggestion = await suggestYouTubeContent(clip);
    }

    // 결과를 데이터베이스에 저장 (별도 테이블)
    await saveAnalysisResults(db, clipId, results);

    db.close();

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('클립 분석 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeClipQuality(clip: any): Promise<ClipQualityAnalysis> {
  // 텍스트 기반 분석 (실제로는 오디오/비디오 분석도 필요)
  const englishText = clip.english_subtitle || '';
  const duration = clip.duration_seconds || 0;
  
  // 단어 수 계산 (WPM 추정)
  const wordCount = englishText.split(' ').length;
  const speechSpeed = duration > 0 ? (wordCount / duration) * 60 : 0;
  
  // OpenAI를 사용한 텍스트 분석
  const analysisPrompt = `
Analyze this English dialogue for language learning purposes:
"${englishText}"

Rate on a scale of 0-100:
1. Grammar complexity
2. Vocabulary difficulty 
3. Energy level of speech
4. Potential engagement for YouTube

Also classify:
- Vocabulary level (beginner/intermediate/advanced)
- Emotional tone
- Copyright risk level (0-100)

Respond in JSON format.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.3,
    });

    const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      audio_clarity: 85, // 기본값 (실제로는 오디오 분석 필요)
      speech_speed: Math.round(speechSpeed),
      vocabulary_level: aiAnalysis.vocabulary_level || 'intermediate',
      grammar_complexity: aiAnalysis.grammar_complexity || 50,
      emotion_tone: aiAnalysis.emotional_tone || 'neutral',
      energy_level: aiAnalysis.energy_level || 50,
      engagement_score: aiAnalysis.engagement_score || 60,
      copyright_risk: aiAnalysis.copyright_risk || 30,
    };
  } catch (error) {
    console.error('AI 분석 오류:', error);
    // 기본값 반환
    return {
      audio_clarity: 75,
      speech_speed: Math.round(speechSpeed),
      vocabulary_level: 'intermediate',
      grammar_complexity: 50,
      emotion_tone: 'neutral',
      energy_level: 50,
      engagement_score: 60,
      copyright_risk: 30,
    };
  }
}

async function generateAITags(clip: any): Promise<AIGeneratedTags> {
  const englishText = clip.english_subtitle || '';
  const koreanText = clip.korean_subtitle || '';
  const sourceFile = clip.source_file || '';
  
  const taggingPrompt = `
Analyze this English learning clip and generate comprehensive tags:

English: "${englishText}"
Korean: "${koreanText}"
Source: ${sourceFile}

Generate tags for:
1. expressions (specific phrases or idioms)
2. grammar_points (grammar concepts used)
3. vocabulary_themes (topic areas)
4. scene_context (situation/setting)
5. emotions (emotional content)
6. difficulty_tags (learning level indicators)
7. youtube_categories (content categorization)

Return as JSON with arrays for each category.
Focus on English learning value and YouTube content potential.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: taggingPrompt }],
      temperature: 0.4,
    });

    const aiTags = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      expressions: aiTags.expressions || [],
      grammar_points: aiTags.grammar_points || [],
      vocabulary_themes: aiTags.vocabulary_themes || [],
      scene_context: aiTags.scene_context || [],
      emotions: aiTags.emotions || [],
      difficulty_tags: aiTags.difficulty_tags || [],
      youtube_categories: aiTags.youtube_categories || [],
    };
  } catch (error) {
    console.error('AI 태깅 오류:', error);
    return {
      expressions: [],
      grammar_points: [],
      vocabulary_themes: [],
      scene_context: [],
      emotions: [],
      difficulty_tags: [],
      youtube_categories: [],
    };
  }
}

async function suggestYouTubeContent(clip: any): Promise<YouTubeContentSuggestion> {
  const englishText = clip.english_subtitle || '';
  const sourceFile = clip.source_file || '';
  
  // 소스에서 시리즈/영화 이름 추출
  const sourceName = sourceFile.includes('Friends') ? 'Friends' : 
                    sourceFile.includes('Batman') ? 'Batman' : 
                    'Unknown';

  const contentPrompt = `
Create a YouTube content suggestion for this English learning clip:

English dialogue: "${englishText}"
Source: ${sourceName}

Generate:
1. Catchy Korean YouTube title (for Korean English learners)
2. Engaging description
3. Relevant tags for YouTube algorithm
4. Thumbnail text suggestion
5. Target video duration (seconds)
6. Difficulty level
7. Learning objectives

Format as JSON. Make it appealing for Korean English learners.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: contentPrompt }],
      temperature: 0.6,
    });

    const suggestion = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: suggestion.title || `${sourceName}로 배우는 영어 표현`,
      description: suggestion.description || '영어 학습 클립입니다.',
      tags: suggestion.tags || ['영어학습', sourceName],
      thumbnail_text: suggestion.thumbnail_text || '영어 표현',
      target_duration: suggestion.target_duration || 60,
      difficulty_level: suggestion.difficulty_level || 'intermediate',
      learning_objectives: suggestion.learning_objectives || ['영어 표현 학습'],
    };
  } catch (error) {
    console.error('컨텐츠 제안 오류:', error);
    return {
      title: `${sourceName}로 배우는 영어 표현`,
      description: '영어 학습을 위한 클립입니다.',
      tags: ['영어학습', sourceName],
      thumbnail_text: '영어 표현',
      target_duration: 60,
      difficulty_level: 'intermediate',
      learning_objectives: ['영어 표현 학습'],
    };
  }
}

async function saveAnalysisResults(db: Database.Database, clipId: string, results: any) {
  // AI 분석 결과 저장 테이블 생성 (존재하지 않는 경우)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clip_id TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      results TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clip_id) REFERENCES clips(id)
    )
  `);

  // 분석 결과들을 각각 저장
  const insertStmt = db.prepare(`
    INSERT INTO ai_analysis (clip_id, analysis_type, results)
    VALUES (?, ?, ?)
  `);

  if (results.qualityAnalysis) {
    insertStmt.run(clipId, 'quality', JSON.stringify(results.qualityAnalysis));
  }
  
  if (results.aiTags) {
    insertStmt.run(clipId, 'tags', JSON.stringify(results.aiTags));
  }
  
  if (results.contentSuggestion) {
    insertStmt.run(clipId, 'content_suggestion', JSON.stringify(results.contentSuggestion));
  }
}

// GET 요청: 저장된 분석 결과 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clipId = searchParams.get('clipId');

  if (!clipId) {
    return NextResponse.json({ error: 'clipId is required' }, { status: 400 });
  }

  try {
    const db = new Database('public/clips.db');
    
    const analysisResults = db.prepare(`
      SELECT analysis_type, results, created_at 
      FROM ai_analysis 
      WHERE clip_id = ? 
      ORDER BY created_at DESC
    `).all(clipId);

    db.close();

    const formattedResults = analysisResults.reduce((acc, row) => {
      acc[row.analysis_type] = {
        data: JSON.parse(row.results),
        timestamp: row.created_at
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      clipId,
      analysis: formattedResults
    });

  } catch (error) {
    console.error('분석 결과 조회 오류:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
