// 렌더링 템플릿 인터페이스 및 JSON 생성 유틸리티

export interface RenderTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  
  // 기본 설정
  clip: {
    id: string;
    title: string;
    duration: string;
    path: string;
  };
  
  // 출력 설정
  output: {
    aspectRatio: '16:9' | '9:16';
    resolution: {
      width: number;
      height: number;
    };
    quality: 'high' | 'medium' | 'low';
    format: 'mp4' | 'webm';
  };
  
  // 패턴 설정
  pattern: {
    type: 'repeat-3' | 'repeat-5' | 'slow-motion' | 'with-pause' | 'custom';
    repeatCount?: number;
    speed?: number;
    pauseDuration?: number;
  };
  
  // 비디오 처리
  video: {
    background: {
      color: string; // 기본: #000000 (검정)
      type: 'solid' | 'blur' | 'gradient';
    };
    scaling: {
      method: 'fit' | 'fill' | 'stretch';
      position: 'center' | 'top' | 'bottom';
    };
  };
  
  // 자막 설정
  subtitles?: {
    enabled: boolean;
    english?: {
      text: string;
      enabled: boolean;
      position: 'top' | 'center' | 'bottom';
      fontSize: number;
      fontColor: string;
      backgroundColor?: string;
      backgroundOpacity?: number;
    };
    korean?: {
      text: string;
      enabled: boolean;
      position: 'top' | 'center' | 'bottom';
      fontSize: number;
      fontColor: string;
      backgroundColor?: string;
      backgroundOpacity?: number;
    };
    font: {
      family: string;
      path: string;
      weight: 'normal' | 'bold';
    };
  };
  
  // FFmpeg 명령어 (생성된 명령어 저장용)
  ffmpeg?: {
    command: string[];
    filters: string[];
    estimatedDuration: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export class RenderTemplateManager {
  private static readonly TEMPLATES_DIR = '/home/kang/docker/youtube/indexer/indexer_v3/theme-search/public/render-templates';
  
  /**
   * 폼 데이터로부터 렌더링 템플릿 생성
   */
  static async createTemplate(
    clipData: any,
    formData: {
      aspectRatio: '16:9' | '9:16';
      quality: 'high' | 'medium' | 'low';
      pattern: string;
      repeatCount?: number;
      englishSubtitle?: string;
      koreanSubtitle?: string;
      enableEnglish?: boolean;
      enableKorean?: boolean;
    }
  ): Promise<RenderTemplate> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 해상도 계산
    const resolution = formData.aspectRatio === '16:9' 
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1920 };
    
    const template: RenderTemplate = {
      id: templateId,
      name: `${clipData.title} - ${formData.pattern}`,
      description: `${formData.aspectRatio} 비율, ${formData.quality} 품질`,
      createdAt: new Date().toISOString(),
      
      clip: {
        id: clipData.id,
        title: clipData.title,
        duration: clipData.duration,
        path: clipData.clipPath
      },
      
      output: {
        aspectRatio: formData.aspectRatio,
        resolution,
        quality: formData.quality,
        format: 'mp4'
      },
      
      pattern: {
        type: formData.pattern as any,
        repeatCount: formData.repeatCount
      },
      
      video: {
        background: {
          color: '#000000',
          type: 'solid'
        },
        scaling: {
          method: 'fit',
          position: 'center'
        }
      }
    };
    
    // 자막 설정 추가
    if (formData.enableEnglish || formData.enableKorean) {
      template.subtitles = {
        enabled: true,
        font: {
          family: 'Noto Sans KR',
          path: '/usr/share/fonts/truetype/noto-sans-kr/NotoSansKR-Regular.ttf',
          weight: 'normal'
        }
      };
      
      if (formData.enableEnglish && formData.englishSubtitle) {
        template.subtitles.english = {
          text: formData.englishSubtitle,
          enabled: true,
          position: 'bottom',
          fontSize: formData.aspectRatio === '16:9' ? 36 : 28,
          fontColor: '#FFFFFF',
          backgroundColor: '#000000',
          backgroundOpacity: 0.7
        };
      }
      
      if (formData.enableKorean && formData.koreanSubtitle) {
        template.subtitles.korean = {
          text: formData.koreanSubtitle,
          enabled: true,
          position: formData.enableEnglish ? 'top' : 'bottom',
          fontSize: formData.aspectRatio === '16:9' ? 32 : 24,
          fontColor: '#FFFF00',
          backgroundColor: '#000000',
          backgroundOpacity: 0.7
        };
      }
    }
    
    return template;
  }
  
  /**
   * 템플릿을 JSON 파일로 저장
   */
  static async saveTemplate(template: RenderTemplate): Promise<string> {
    const fs = require('fs/promises');
    const path = require('path');
    
    // 디렉토리 생성
    try {
      await fs.access(this.TEMPLATES_DIR);
    } catch {
      await fs.mkdir(this.TEMPLATES_DIR, { recursive: true });
    }
    
    const templatePath = path.join(this.TEMPLATES_DIR, `${template.id}.json`);
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf8');
    
    console.log(`📄 렌더링 템플릿 저장: ${templatePath}`);
    return templatePath;
  }
  
  /**
   * 템플릿으로부터 FFmpeg 명령어 생성
   */
  static generateFFmpegCommand(template: RenderTemplate): string[] {
    const args = ['-y']; // 기존 파일 덮어쓰기
    
    const inputPath = template.clip.path.replace('/clips/', '/home/kang/docker/youtube/indexer/indexer_v3/theme-search/public/clips/');
    const outputPath = `/home/kang/docker/youtube/indexer/indexer_v3/theme-search/public/rendered/${template.id}.${template.output.format}`;
    
    let filterComplex = '';
    let videoFilter = '';
    let audioFilter = '';
    
    // 1. 기본 비디오 처리 (배경 + 스케일링)
    const { width, height } = template.output.resolution;
    
    // 패턴별 입력 설정
    switch (template.pattern.type) {
      case 'repeat-3':
        args.push('-i', inputPath, '-i', inputPath, '-i', inputPath);
        videoFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v0];[1:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v1];[2:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v2];[v0][v1][v2]concat=n=3:v=1:a=0[outv]`;
        audioFilter = `[0:a][1:a][2:a]concat=n=3:v=0:a=1[outa]`;
        break;
        
      case 'repeat-5':
        args.push('-i', inputPath, '-i', inputPath, '-i', inputPath, '-i', inputPath, '-i', inputPath);
        videoFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v0];[1:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v1];[2:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v2];[3:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v3];[4:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v4];[v0][v1][v2][v3][v4]concat=n=5:v=1:a=0[outv]`;
        audioFilter = `[0:a][1:a][2:a][3:a][4:a]concat=n=5:v=0:a=1[outa]`;
        break;
        
      case 'custom':
        const repeatCount = template.pattern.repeatCount || 3;
        const inputs = [];
        const videoInputs = [];
        const audioInputs = [];
        
        for (let i = 0; i < repeatCount; i++) {
          inputs.push('-i', inputPath);
          videoInputs.push(`[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[v${i}]`);
          audioInputs.push(`[${i}:a]`);
        }
        
        args.push(...inputs);
        videoFilter = `${videoInputs.join(';')};${videoInputs.map((_, i) => `[v${i}]`).join('')}concat=n=${repeatCount}:v=1:a=0[outv]`;
        audioFilter = `${audioInputs.join('')}concat=n=${repeatCount}:v=0:a=1[outa]`;
        break;
        
      default:
        args.push('-i', inputPath);
        videoFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[outv]`;
        audioFilter = `[0:a]acopy[outa]`;
        break;
    }
    
    // 2. 자막 처리 추가
    if (template.subtitles?.enabled) {
      let subtitleFilter = '[outv]';
      
      if (template.subtitles.english?.enabled) {
        const eng = template.subtitles.english;
        const yPos = eng.position === 'top' ? '50' : eng.position === 'center' ? 'h/2' : 'h-100';
        subtitleFilter += `drawtext=fontfile='${template.subtitles.font.path}':text='${eng.text.replace(/'/g, "'")}':fontcolor=${eng.fontColor}:fontsize=${eng.fontSize}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=${eng.backgroundColor}@${eng.backgroundOpacity || 0.7}[witheng]`;
        subtitleFilter = '[witheng]';
      }
      
      if (template.subtitles.korean?.enabled) {
        const kor = template.subtitles.korean;
        const yPos = kor.position === 'top' ? '50' : kor.position === 'center' ? 'h/2' : 'h-100';
        subtitleFilter += `drawtext=fontfile='${template.subtitles.font.path}':text='${kor.text.replace(/'/g, "'")}':fontcolor=${kor.fontColor}:fontsize=${kor.fontSize}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=${kor.backgroundColor}@${kor.backgroundOpacity || 0.7}[finalv]`;
      } else {
        subtitleFilter += 'copy[finalv]';
      }
      
      videoFilter = videoFilter.replace('[outv]', subtitleFilter);
    } else {
      videoFilter = videoFilter.replace('[outv]', '[finalv]');
    }
    
    // 3. 필터 복합 구성
    filterComplex = `${videoFilter};${audioFilter}`;
    
    args.push(
      '-filter_complex', filterComplex,
      '-map', '[finalv]',
      '-map', '[outa]'
    );
    
    // 4. 품질 설정
    args.push('-c:v', 'libx264');
    switch (template.output.quality) {
      case 'high':
        args.push('-crf', '18', '-preset', 'slow');
        break;
      case 'medium':
        args.push('-crf', '23', '-preset', 'medium');
        break;
      case 'low':
        args.push('-crf', '28', '-preset', 'fast');
        break;
    }
    
    // 5. 오디오 설정
    args.push(
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ac', '2',
      '-ar', '48000'
    );
    
    // 6. 출력 파일
    args.push(outputPath);
    
    return args;
  }
  
  /**
   * 템플릿 검증
   */
  static validateTemplate(template: RenderTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.clip.id) errors.push('클립 ID가 누락되었습니다');
    if (!template.output.aspectRatio) errors.push('화면 비율이 누락되었습니다');
    if (!template.pattern.type) errors.push('패턴 타입이 누락되었습니다');
    
    if (template.subtitles?.enabled) {
      if (!template.subtitles.font.path) errors.push('폰트 경로가 누락되었습니다');
      if (template.subtitles.english?.enabled && !template.subtitles.english.text) {
        errors.push('영어 자막 텍스트가 누락되었습니다');
      }
      if (template.subtitles.korean?.enabled && !template.subtitles.korean.text) {
        errors.push('한글 자막 텍스트가 누락되었습니다');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
