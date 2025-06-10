import { ClipDatabaseService, ClipMetadata } from './clip-database.service';
import { join } from 'path';

/**
 * JSON 파일에서 DB로 마이그레이션하는 서비스
 */
export class ClipMigrationService {
  /**
   * 모든 JSON 파일을 DB로 마이그레이션
   */
  static async migrateFromJSON(): Promise<{success: number, failed: number, details: string[]}> {
    const result = {
      success: 0,
      failed: 0,
      details: [] as string[]
    };

    try {
      // 데이터베이스 초기화
      await ClipDatabaseService.initDatabase();
      
      const fs = await import('fs');
      const clipsDir = join(process.cwd(), 'public', 'clips');
      
      if (!fs.existsSync(clipsDir)) {
        throw new Error('클립 디렉토리가 존재하지 않습니다');
      }

      // JSON 파일 목록 가져오기
      const files = fs.readdirSync(clipsDir)
        .filter(file => file.endsWith('.json'))
        .sort();

      console.log(`📁 발견된 JSON 파일: ${files.length}개`);
      result.details.push(`발견된 JSON 파일: ${files.length}개`);

      for (const file of files) {
        try {
          const filePath = join(clipsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const jsonData = JSON.parse(content);

          // ClipMetadata 형식으로 변환
          const clipData: ClipMetadata = {
            id: jsonData.id,
            title: jsonData.title,
            sentence: jsonData.sentence,
            englishSubtitle: jsonData.englishSubtitle,
            koreanSubtitle: jsonData.koreanSubtitle,
            startTime: jsonData.startTime,
            endTime: jsonData.endTime,
            sourceFile: jsonData.sourceFile,
            clipPath: jsonData.clipPath,
            thumbnailPath: jsonData.thumbnailPath,
            createdAt: jsonData.createdAt,
            duration: jsonData.duration,
            tags: jsonData.tags || []
          };

          // DB에 저장
          const success = await ClipDatabaseService.createClip(clipData);
          
          if (success) {
            result.success++;
            result.details.push(`✅ ${file} → DB 저장 성공`);
            console.log(`✅ ${file} → DB 저장 성공`);
          } else {
            result.failed++;
            result.details.push(`❌ ${file} → DB 저장 실패`);
            console.log(`❌ ${file} → DB 저장 실패`);
          }

        } catch (error) {
          result.failed++;
          result.details.push(`❌ ${file} → 파싱 오류: ${error}`);
          console.error(`❌ ${file} → 파싱 오류:`, error);
        }
      }

      result.details.push(`📊 마이그레이션 완료: 성공 ${result.success}개, 실패 ${result.failed}개`);
      console.log(`📊 마이그레이션 완료: 성공 ${result.success}개, 실패 ${result.failed}개`);

    } catch (error) {
      result.details.push(`❌ 마이그레이션 전체 실패: ${error}`);
      console.error('❌ 마이그레이션 전체 실패:', error);
    }

    return result;
  }

  /**
   * 단일 JSON 파일을 DB로 마이그레이션
   */
  static async migrateSingleFile(filename: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      const filePath = join(process.cwd(), 'public', 'clips', filename);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ 파일이 존재하지 않습니다: ${filename}`);
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(content);

      const clipData: ClipMetadata = {
        id: jsonData.id,
        title: jsonData.title,
        sentence: jsonData.sentence,
        englishSubtitle: jsonData.englishSubtitle,
        koreanSubtitle: jsonData.koreanSubtitle,
        startTime: jsonData.startTime,
        endTime: jsonData.endTime,
        sourceFile: jsonData.sourceFile,
        clipPath: jsonData.clipPath,
        thumbnailPath: jsonData.thumbnailPath,
        createdAt: jsonData.createdAt,
        duration: jsonData.duration,
        tags: jsonData.tags || []
      };

      return await ClipDatabaseService.createClip(clipData);

    } catch (error) {
      console.error(`❌ 단일 파일 마이그레이션 실패: ${filename}`, error);
      return false;
    }
  }

  /**
   * DB 데이터를 JSON으로 백업
   */
  static async backupToJSON(): Promise<{success: number, failed: number}> {
    const result = { success: 0, failed: 0 };

    try {
      const clips = await ClipDatabaseService.getClips();
      const fs = await import('fs');
      const backupDir = join(process.cwd(), 'public', 'clips-backup');
      
      // 백업 디렉토리 생성
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      for (const clip of clips) {
        try {
          const filename = `${clip.id}.json`;
          const filePath = join(backupDir, filename);
          
          const jsonData = {
            id: clip.id,
            title: clip.title,
            sentence: clip.sentence,
            englishSubtitle: clip.englishSubtitle,
            koreanSubtitle: clip.koreanSubtitle,
            startTime: clip.startTime,
            endTime: clip.endTime,
            sourceFile: clip.sourceFile,
            clipPath: clip.clipPath,
            thumbnailPath: clip.thumbnailPath,
            createdAt: clip.createdAt,
            duration: clip.duration,
            tags: clip.tags
          };

          fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
          result.success++;

        } catch (error) {
          console.error(`❌ 백업 실패: ${clip.id}`, error);
          result.failed++;
        }
      }

      console.log(`📦 DB → JSON 백업 완료: 성공 ${result.success}개, 실패 ${result.failed}개`);

    } catch (error) {
      console.error('❌ 백업 전체 실패:', error);
    }

    return result;
  }

  /**
   * 마이그레이션 상태 확인
   */
  static async checkMigrationStatus(): Promise<{
    jsonFiles: number;
    dbRecords: number;
    needMigration: boolean;
  }> {
    try {
      // JSON 파일 개수 확인
      const fs = await import('fs');
      const clipsDir = join(process.cwd(), 'public', 'clips');
      const jsonFiles = fs.existsSync(clipsDir) 
        ? fs.readdirSync(clipsDir).filter(file => file.endsWith('.json')).length 
        : 0;

      // DB 레코드 개수 확인
      let dbRecords = 0;
      try {
        await ClipDatabaseService.initDatabase();
        const clips = await ClipDatabaseService.getClips();
        dbRecords = clips.length;
      } catch (error) {
        console.log('DB가 아직 생성되지 않았습니다');
      }

      return {
        jsonFiles,
        dbRecords,
        needMigration: jsonFiles > 0 && dbRecords === 0
      };

    } catch (error) {
      console.error('❌ 마이그레이션 상태 확인 실패:', error);
      return {
        jsonFiles: 0,
        dbRecords: 0,
        needMigration: false
      };
    }
  }
}
