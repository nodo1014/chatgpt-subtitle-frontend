import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// GET /api/workspaces/[workspaceId]/clips - 워크스페이스의 클립 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = await params;
    
    if (!workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Workspace ID가 필요합니다.'
      }, { status: 400 });
    }

    // 클립 디렉토리에서 파일들 읽기
    const clipsDir = path.join(process.cwd(), 'public', 'clips');
    const files = await fs.readdir(clipsDir);
    
    // JSON 메타데이터 파일들 필터링
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const clips = [];
    
    // 각 JSON 파일에서 클립 정보 읽기
    for (const jsonFile of jsonFiles.slice(0, 10)) { // 처음 10개만 로드
      try {
        const jsonPath = path.join(clipsDir, jsonFile);
        const jsonContent = await fs.readFile(jsonPath, 'utf-8');
        const clipData = JSON.parse(jsonContent);
        
        // 비디오 파일 존재 확인
        const videoFile = jsonFile.replace('.json', '.mp4');
        const videoPath = path.join(clipsDir, videoFile);
        
        try {
          await fs.access(videoPath);
          
          // Video Studio에서 사용할 형태로 데이터 변환
          clips.push({
            id: clipData.id,
            title: clipData.title || videoFile.replace('.mp4', ''),
            english_text: clipData.englishSubtitle || '',
            korean_text: clipData.koreanSubtitle === 'X' ? '' : (clipData.koreanSubtitle || ''),
            explanation: `${clipData.title}에서 추출된 클립`,
            pronunciation: clipData.englishSubtitle ? 
              clipData.englishSubtitle.replace(/[^a-zA-Z\s]/g, '').toLowerCase() : '',
            video_path: clipData.clipPath,
            duration: parseFloat(clipData.duration?.replace('초', '') || '3.0'),
            working_dir: workspaceId
          });
        } catch (videoError) {
          console.log(`비디오 파일 없음: ${videoFile}`);
        }
        
      } catch (error) {
        console.error(`JSON 파싱 오류 (${jsonFile}):`, error);
      }
    }

    console.log(`워크스페이스 ${workspaceId}에서 ${clips.length}개 클립 로드됨`);

    return NextResponse.json({
      success: true,
      clips,
      total: clips.length
    });

  } catch (error) {
    console.error('클립 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: '클립을 조회할 수 없습니다.'
    }, { status: 500 });
  }
}
