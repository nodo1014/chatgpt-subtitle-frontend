import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// 렌더링 작업 상태 관리
declare global {
  var renderJobs: Map<string, any> | undefined;
}

// 전역 렌더링 작업 저장소 초기화
if (!global.renderJobs) {
  global.renderJobs = new Map();
}

interface RenderJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  workspace_id: string;
  template_id: string;
  clips: any[];
  options: any;
  common_settings?: any; // 새로운 공통 설정 필드
  output_path?: string;
  error?: string;
  created_at: Date;
}

interface FFmpegTemplate {
  id: string;
  name: string;
  category: 'shadowing' | 'shorts';
  format: '16:9' | '9:16';
  resolution: string;
  settings: {
    background: string;
    font_family: string;
    font_size: number;
    stroke_width: number;
    text_color: string;
    stroke_color: string;
  };
}

// 확장된 템플릿 정의
const templates: FFmpegTemplate[] = [
  // 쉐도잉 카테고리
  {
    id: 'shadowing_basic_16_9',
    name: '기본 쉐도잉 (16:9)',
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
  },
  // 하위 호환성을 위한 기존 템플릿 유지
  {
    id: 'shadowing_16_9',
    name: '쉐도잉 연습 (16:9) - 레거시',
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
    id: 'shadowing_9_16',
    name: '쉐도잉 연습 (쇼츠) - 레거시',
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
  }
];

// ASS 자막 파일 생성 함수 (회차별 설정 지원)
async function generateSubtitleFile(
  clip: any,
  commonSettings: any,
  template: FFmpegTemplate,
  outputDir: string,
  repeatIndex: number = 0
): Promise<string | null> {
  const { settings: templateSettings } = template;
  
  // 현재 회차의 설정 가져오기
  const currentRepeatSettings = commonSettings?.repeatSettings?.[repeatIndex] || {
    showEnglish: true,
    showKorean: true,
    showExplanation: false,
    showPronunciation: false,
    pauseAfter: 1.0
  };
  
  // 표시할 텍스트 라인들 수집
  const textLines: string[] = [];
  
  if (currentRepeatSettings.showEnglish && clip.english_text) {
    textLines.push(clip.english_text);
  }
  if (currentRepeatSettings.showKorean && clip.korean_text) {
    textLines.push(clip.korean_text);
  }
  if (currentRepeatSettings.showExplanation && clip.explanation) {
    textLines.push(`💡 ${clip.explanation}`);
  }
  if (currentRepeatSettings.showPronunciation && clip.pronunciation) {
    textLines.push(`🔊 ${clip.pronunciation}`);
  }
  
  // 텍스트가 없으면 자막 파일 생성하지 않음
  if (textLines.length === 0) {
    return null;
  }
  
  // 자막 위치 설정 (top/center/bottom)
  const position = commonSettings?.subtitlePosition || 'bottom';
  let alignment = 2; // 기본: bottom center
  let marginV = 30;
  
  switch (position) {
    case 'top':
      alignment = 8; // top center
      marginV = 30;
      break;
    case 'middle':
      alignment = 5; // middle center
      marginV = 0;
      break;
    case 'bottom':
    default:
      alignment = 2; // bottom center
      marginV = 30;
      break;
  }
  
  // ASS 파일 내용 생성 (사용자 폰트 설정 적용)
  const userFontSettings = commonSettings?.fontSettings || {
    size: templateSettings.font_size,
    color: templateSettings.text_color,
    strokeColor: templateSettings.stroke_color,
    strokeWidth: templateSettings.stroke_width,
    fontFamily: templateSettings.font_family
  };

  // Noto Sans KR 폰트 이름 정규화
  const normalizedFontFamily = userFontSettings.fontFamily === 'Noto Sans KR' 
    ? 'Noto Sans KR' 
    : userFontSettings.fontFamily;

  // 색상을 ASS 형식으로 변환 (#FFFFFF -> &H00FFFFFF)
  const assTextColor = userFontSettings.color.replace('#', '&H00') + 'FF';
  const assStrokeColor = userFontSettings.strokeColor.replace('#', '&H00') + 'FF';

  const assContent = `[Script Info]
Title: Video Studio Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${normalizedFontFamily},${userFontSettings.size},${assTextColor},&H000000FF,${assStrokeColor},&H80000000,1,0,0,0,100,100,0,0,1,${userFontSettings.strokeWidth},2,${alignment},10,10,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${textLines.map((line, index) => {
  const startTime = index * 1.5; // 각 라인마다 1.5초 간격
  const endTime = startTime + 3.0; // 3초 동안 표시
  const start = formatAssTime(startTime);
  const end = formatAssTime(endTime);
  return `Dialogue: 0,${start},${end},Default,,0,0,0,,${line.replace(/,/g, '，')}`;
}).join('\n')}`;

  // ASS 파일 저장
  const assFileName = `subtitle_${Date.now()}.ass`;
  const assFilePath = path.join(outputDir, assFileName);
  await fs.writeFile(assFilePath, assContent, 'utf-8');
  
  return assFilePath;
}

// ASS 시간 형식 변환 함수 (초를 H:MM:SS.CC 형식으로)
function formatAssTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

// FFmpeg 명령어 생성 (공통 설정 및 회차별 처리 지원)
async function generateFFmpegCommand(
  inputPath: string,
  outputPath: string,
  template: FFmpegTemplate,
  clip: any,
  commonSettings: any,
  outputDir: string
): Promise<string> {
  const { resolution, settings: templateSettings } = template;
  const [width, height] = resolution.split('x').map(Number);
  
  // 반복횟수 설정
  const repeatCount = commonSettings?.repeatCount || 1;
  
  // 복잡한 반복 처리를 위해 임시 클립들을 concat하는 방식 사용
  let command = `ffmpeg -y`;
  
  // 각 회차별로 다른 자막을 적용하기 위해 임시 파일들 생성
  const tempFiles: string[] = [];
  
  for (let i = 0; i < repeatCount; i++) {
    const tempOutputPath = path.join(outputDir, `temp_repeat_${i}_${Date.now()}.mp4`);
    tempFiles.push(tempOutputPath);
    
    // 각 회차별 FFmpeg 명령어
    let repeatCommand = `ffmpeg -y -i "${inputPath}"`;
    
    // 비디오 필터 체인: 스케일링, 패딩, 자막
    let videoFilters = [];
    videoFilters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
    videoFilters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${templateSettings.background}`);
    
    // 이 회차에 대한 자막 파일 생성 및 추가
    const subtitlePath = await generateSubtitleFile(clip, commonSettings, template, outputDir, i);
    if (subtitlePath) {
      const normalizedSubtitlePath = subtitlePath.replace(/\\/g, '/');
      
      // 사용자 폰트 설정 적용
      const userFontSettings = commonSettings?.fontSettings || {
        size: templateSettings.font_size,
        color: templateSettings.text_color,
        strokeColor: templateSettings.stroke_color,
        strokeWidth: templateSettings.stroke_width,
        fontFamily: templateSettings.font_family
      };
      
      // Noto Sans KR 폰트 경로 지정
      const fontName = userFontSettings.fontFamily === 'Noto Sans KR' 
        ? '/usr/share/fonts/truetype/noto-sans-kr/NotoSansKR-Bold.ttf'
        : userFontSettings.fontFamily;
      
      videoFilters.push(`subtitles='${normalizedSubtitlePath}':fontsdir=/usr/share/fonts/truetype/noto-sans-kr/:force_style='Fontname=${fontName},Fontsize=${userFontSettings.size},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=${userFontSettings.strokeWidth}'`);
    }
    
    // 5.1 채널 오디오를 스테레오로 변환하는 오디오 필터
    let audioFilter = 'pan=stereo|FL=0.5*FL+0.707*FC+0.5*BL|FR=0.5*FR+0.707*FC+0.5*BR';
    
    // 필터 체인 적용
    repeatCommand += ` -vf "${videoFilters.join(',')}" -af "${audioFilter}"`;
    
    // 출력 설정
    repeatCommand += ` -c:v libx264 -preset fast -crf 23 -c:a aac -ac 2 -ar 44100 -b:a 128k "${tempOutputPath}"`;
    
    console.log(`🎬 회차 ${i + 1} FFmpeg 명령어:`, repeatCommand);
    
    // 각 회차별 임시 파일 생성
    const { spawn } = require('child_process');
    const args = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < repeatCommand.length; j++) {
      const char = repeatCommand[j];
      if (char === '"' && (j === 0 || repeatCommand[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      args.push(current.trim());
    }
    
    const ffmpegArgs = args.slice(1);
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let errorOutput = '';
      
      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 회차 ${i + 1} 렌더링 완료`);
          resolve(true);
        } else {
          console.log(`❌ 회차 ${i + 1} FFmpeg failed with code ${code}`);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
    
    // 회차 간 일시정지 시간 적용을 위한 추가 처리 (필요시)
    const pauseAfter = commonSettings?.repeatSettings?.[i]?.pauseAfter || 0;
    if (pauseAfter > 0 && i < repeatCount - 1) {
      // 일시정지를 위한 검은 화면 클립 생성 (필요시 구현)
      console.log(`⏸️ 회차 ${i + 1} 후 ${pauseAfter}초 일시정지`);
    }
  }
  
  // 모든 임시 파일들을 concat하여 최종 출력 생성
  if (tempFiles.length > 1) {
    const concatListPath = path.join(outputDir, `concat_list_${Date.now()}.txt`);
    const concatContent = tempFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent, 'utf-8');
    
    console.log(`🔗 최종 병합 시작: ${tempFiles.length}개 파일`);
    
    // 최종 병합 실행 (spawn 대신 직접 명령어 실행)
    const { spawn } = require('child_process');
    
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        outputPath
      ]);
      
      let errorOutput = '';
      
      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        console.log(`FFmpeg concat stderr: ${output}`);
      });
      
      ffmpeg.stdout.on('data', (data) => {
        console.log(`FFmpeg concat stdout: ${data}`);
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 최종 병합 완료`);
          // 임시 파일들 정리
          Promise.all(tempFiles.map(async (file) => {
            try {
              await fs.unlink(file);
              console.log(`🗑️ 임시 파일 삭제: ${path.basename(file)}`);
            } catch (e) {
              console.log(`⚠️ 임시 파일 삭제 실패: ${path.basename(file)}`);
            }
          })).then(() => {
            // concat 리스트 파일도 삭제
            fs.unlink(concatListPath).catch(() => {
              console.log(`⚠️ concat 리스트 파일 삭제 실패`);
            });
          });
          resolve(true);
        } else {
          console.log(`❌ Final concat failed with code ${code}`);
          console.log('Concat error output:', errorOutput);
          reject(new Error(`Final concat failed with code ${code}: ${errorOutput}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        console.log(`❌ FFmpeg concat spawn error:`, error);
        reject(error);
      });
    });
    
    return `Concat completed: ${outputPath}`;
  } else if (tempFiles.length === 1) {
    // 단일 회차인 경우 임시 파일을 최종 파일로 이동
    await fs.rename(tempFiles[0], outputPath);
    console.log(`✅ 단일 회차 파일 이동 완료: ${outputPath}`);
    return `Single repeat - file moved to ${outputPath}`;
  }
  
  return command;
}

// 렌더링 실행 함수
async function executeRender(job: RenderJob): Promise<void> {
  try {
    job.status = 'processing';
    job.progress = 0;
    
    const template = templates.find(t => t.id === job.template_id);
    if (!template) {
      throw new Error('템플릿을 찾을 수 없습니다.');
    }
    
    // 출력 디렉토리 생성
    const outputDir = path.join(process.cwd(), 'public', 'renders', job.workspace_id);
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFileName = `${job.workspace_id}_${template.id}_${timestamp}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);
    
    // 공통 설정 추출 (새로운 구조 지원)
    const commonSettings = job.common_settings || {
      repeatCount: job.options?.repeat_count || 3,
      subtitlePosition: job.options?.subtitle_position || 'bottom',
      repeatSettings: [
        { showEnglish: true, showKorean: false, showExplanation: false, showPronunciation: false, pauseAfter: 0.5 },
        { showEnglish: true, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 },
        { showEnglish: false, showKorean: true, showExplanation: false, showPronunciation: false, pauseAfter: 1.0 }
      ],
      globalOptions: {
        fadeInOut: true,
        backgroundBlur: false,
        showProgress: true
      }
    };
    
    console.log(`🔧 공통 설정:`, commonSettings);
    
    // 각 클립 처리
    for (let i = 0; i < job.clips.length; i++) {
      const clip = job.clips[i];
      job.progress = Math.round((i / job.clips.length) * 100);
      
      // 클립의 실제 경로 계산
      const clipPath = clip.video_path ? 
        (clip.video_path.startsWith('/clips/') 
          ? path.join(process.cwd(), 'public', clip.video_path)
          : clip.video_path)
        : (clip.clipPath ? 
          (clip.clipPath.startsWith('/clips/') 
            ? path.join(process.cwd(), 'public', clip.clipPath)
            : clip.clipPath)
          : null);
      
      if (!clipPath) {
        console.error(`클립 경로를 찾을 수 없음: ${JSON.stringify(clip)}`);
        continue;
      }
      
      // 파일 존재 확인
      try {
        await fs.access(clipPath);
      } catch (error) {
        console.error(`클립 파일 없음: ${clipPath}`);
        continue; // 다음 클립으로 스킵
      }
      
      // 개별 클립용 출력 경로 생성
      const clipOutputPath = path.join(outputDir, `clip_${i}_${timestamp}.mp4`);
      
      // FFmpeg 명령어 생성 (공통 설정 사용)
      const command = await generateFFmpegCommand(
        clipPath,
        clipOutputPath,
        template,
        clip,
        commonSettings,  // 공통 설정 전달
        outputDir
      );
      
      console.log(`🎬 클립 ${i + 1}/${job.clips.length} 처리 완료`);
    }
    
    job.status = 'completed';
    job.progress = 100;
    job.output_path = `/renders/${job.workspace_id}/${outputFileName}`;
    
    console.log(`✅ 전체 렌더링 완료: ${job.output_path}`);
    
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('렌더링 실패:', error);
  }
}

// POST: 렌더링 작업 시작
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, template_id, clips, options, common_settings } = body;
    
    console.log('📥 렌더링 요청 받음:', { 
      workspace_id, 
      template_id, 
      clips_count: clips?.length,
      common_settings,
      options 
    });
    
    // 검증
    if (!workspace_id || !template_id || !clips || clips.length === 0) {
      return NextResponse.json({
        success: false,
        error: '필수 데이터가 누락되었습니다.'
      }, { status: 400 });
    }
    
    const template = templates.find(t => t.id === template_id);
    if (!template) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 템플릿입니다.'
      }, { status: 400 });
    }
    
    // 렌더링 작업 생성
    const jobId = uuidv4();
    const job: RenderJob = {
      id: jobId,
      status: 'queued',
      progress: 0,
      workspace_id,
      template_id,
      clips,
      options,
      common_settings, // 공통 설정 저장
      created_at: new Date()
    };
    
    global.renderJobs!.set(jobId, job);
    
    // 백그라운드에서 렌더링 시작
    executeRender(job).catch(console.error);
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: '렌더링 작업이 시작되었습니다.',
      template: template.name
    });
    
  } catch (error) {
    console.error('렌더링 요청 처리 실패:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// GET: 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'templates') {
      return NextResponse.json({
        success: true,
        templates
      });
    }
    
    // 기본: 활성 렌더링 작업 목록
    const activeJobs = Array.from(global.renderJobs!.values())
      .filter(job => job.status === 'processing' || job.status === 'queued')
      .map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        workspace_id: job.workspace_id,
        template_id: job.template_id,
        created_at: job.created_at
      }));
    
    return NextResponse.json({
      success: true,
      active_jobs: activeJobs
    });
    
  } catch (error) {
    console.error('GET 요청 처리 실패:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
