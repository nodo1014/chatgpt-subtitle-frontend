import path from 'path';
import fs from 'fs';

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

interface SubtitleTrack {
  language: 'en' | 'ko';
  entries: SubtitleEntry[];
}

interface VideoSubtitles {
  videoId: string;
  tracks: SubtitleTrack[];
  lastUpdated: string;
}

/**
 * 자막 관리 서비스
 * - 자막 파일 읽기/쓰기
 * - 시간 기반 자막 검색
 * - 자막 형식 변환 (SRT, VTT, JSON)
 */
export class SubtitleService {
  private static subtitlesDir = path.join(process.cwd(), 'public', 'subtitles');

  /**
   * 자막 디렉토리 초기화
   */
  static async initSubtitlesDir(): Promise<void> {
    try {
      await fs.promises.mkdir(this.subtitlesDir, { recursive: true });
    } catch (error) {
      console.error('자막 디렉토리 생성 실패:', error);
    }
  }

  /**
   * 비디오의 자막 로드
   */
  static async loadSubtitles(videoId: string): Promise<VideoSubtitles | null> {
    try {
      await this.initSubtitlesDir();
      
      const subtitlePath = path.join(this.subtitlesDir, `${videoId}.json`);
      
      try {
        const content = await fs.promises.readFile(subtitlePath, 'utf-8');
        return JSON.parse(content);
      } catch {
        // 파일이 없으면 null 반환
        return null;
      }
    } catch (error) {
      console.error('자막 로드 실패:', error);
      return null;
    }
  }

  /**
   * 자막 저장
   */
  static async saveSubtitles(subtitles: VideoSubtitles): Promise<boolean> {
    try {
      await this.initSubtitlesDir();
      
      const subtitlePath = path.join(this.subtitlesDir, `${subtitles.videoId}.json`);
      
      await fs.promises.writeFile(
        subtitlePath, 
        JSON.stringify(subtitles, null, 2), 
        'utf-8'
      );
      
      return true;
    } catch (error) {
      console.error('자막 저장 실패:', error);
      return false;
    }
  }

  /**
   * 특정 시간 범위의 자막 추출
   */
  static extractSubtitlesForTimeRange(
    subtitles: VideoSubtitles,
    startTime: number,
    endTime: number,
    language?: 'en' | 'ko'
  ): { english?: string; korean?: string } {
    const result: { english?: string; korean?: string } = {};

    subtitles.tracks.forEach(track => {
      // 언어 필터링
      if (language && track.language !== language) {
        return;
      }

      // 시간 범위에 해당하는 자막 찾기
      const relevantEntries = track.entries.filter(entry => 
        (entry.start <= endTime && entry.end >= startTime)
      );

      if (relevantEntries.length > 0) {
        const text = relevantEntries.map(entry => entry.text).join(' ');
        
        if (track.language === 'en') {
          result.english = text;
        } else if (track.language === 'ko') {
          result.korean = text;
        }
      }
    });

    return result;
  }

  /**
   * SRT 파일을 JSON으로 변환
   */
  static parseSRTToJSON(srtContent: string, language: 'en' | 'ko'): SubtitleTrack {
    const entries: SubtitleEntry[] = [];
    const blocks = srtContent.trim().split('\n\n');

    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        
        if (timeMatch) {
          const start = parseInt(timeMatch[1]) * 3600 + 
                       parseInt(timeMatch[2]) * 60 + 
                       parseInt(timeMatch[3]) + 
                       parseInt(timeMatch[4]) / 1000;
          
          const end = parseInt(timeMatch[5]) * 3600 + 
                     parseInt(timeMatch[6]) * 60 + 
                     parseInt(timeMatch[7]) + 
                     parseInt(timeMatch[8]) / 1000;
          
          const text = lines.slice(2).join(' ').trim();
          
          entries.push({ start, end, text });
        }
      }
    });

    return { language, entries };
  }

  /**
   * JSON을 SRT 형식으로 변환
   */
  static convertJSONToSRT(track: SubtitleTrack): string {
    let srtContent = '';
    
    track.entries.forEach((entry, index) => {
      const startTime = this.formatSRTTime(entry.start);
      const endTime = this.formatSRTTime(entry.end);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${entry.text}\n\n`;
    });
    
    return srtContent;
  }

  /**
   * JSON을 VTT 형식으로 변환
   */
  static convertJSONToVTT(track: SubtitleTrack): string {
    let vttContent = 'WEBVTT\n\n';
    
    track.entries.forEach(entry => {
      const startTime = this.formatVTTTime(entry.start);
      const endTime = this.formatVTTTime(entry.end);
      
      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${entry.text}\n\n`;
    });
    
    return vttContent;
  }

  /**
   * SRT 시간 형식으로 변환
   */
  private static formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * VTT 시간 형식으로 변환
   */
  private static formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
    }
  }

  /**
   * 클립에서 자막 정보 추출 및 반환
   */
  static async getSubtitlesForClip(
    videoId: string,
    startTime: string,
    endTime: string
  ): Promise<{ english?: string; korean?: string }> {
    try {
      const subtitles = await this.loadSubtitles(videoId);
      
      if (!subtitles) {
        return {};
      }

      const startSeconds = this.timeStringToSeconds(startTime);
      const endSeconds = this.timeStringToSeconds(endTime);

      return this.extractSubtitlesForTimeRange(subtitles, startSeconds, endSeconds);
    } catch (error) {
      console.error('클립 자막 추출 실패:', error);
      return {};
    }
  }

  /**
   * 시간 문자열을 초로 변환
   */
  private static timeStringToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(parseFloat);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else {
      return parts[0];
    }
  }

  /**
   * 자막 품질 검증
   */
  static validateSubtitleQuality(track: SubtitleTrack): {
    isValid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];
    let totalConfidence = 0;
    let confidenceCount = 0;

    // 기본 검증
    if (track.entries.length === 0) {
      issues.push('자막이 비어있습니다.');
      return { isValid: false, issues, confidence: 0 };
    }

    // 시간 순서 검증
    for (let i = 1; i < track.entries.length; i++) {
      if (track.entries[i].start < track.entries[i - 1].end) {
        issues.push(`시간 겹침 발견: ${i}번째 항목`);
      }
    }

    // 신뢰도 계산
    track.entries.forEach(entry => {
      if (entry.confidence !== undefined) {
        totalConfidence += entry.confidence;
        confidenceCount++;
      }
    });

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.8;

    // 텍스트 품질 검증
    const emptyEntries = track.entries.filter(entry => !entry.text.trim()).length;
    if (emptyEntries > 0) {
      issues.push(`${emptyEntries}개의 빈 자막 항목이 있습니다.`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      confidence: avgConfidence
    };
  }
}
