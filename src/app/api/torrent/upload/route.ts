import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('torrent') as File;
    
    if (!file) {
      return NextResponse.json({ error: '토렌트 파일이 필요합니다.' }, { status: 400 });
    }

    console.log('📥 토렌트 파일 업로드:', file.name);

    // 토렌트 저장 디렉토리 생성
    const torrentDir = '/home/kang/torrents/files';
    if (!existsSync(torrentDir)) {
      await mkdir(torrentDir, { recursive: true });
    }

    // 토렌트 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const torrentPath = path.join(torrentDir, file.name);
    await writeFile(torrentPath, buffer);

    console.log('💾 토렌트 파일 저장:', torrentPath);

    // transmission-cli로 즉시 다운로드 시작
    const downloadPath = '/mnt/qnap/torrent';
    const downloadId = Date.now().toString();
    
    console.log('🚀 토렌트 다운로드 시작:', {
      torrent: torrentPath,
      downloadPath,
      downloadId
    });

    // transmission-cli 실행
    const transmissionProcess = spawn('transmission-cli', [
      '-w', downloadPath,  // 다운로드 경로
      '-f', '/tmp/transmission-script.sh',  // 완료 시 실행할 스크립트
      torrentPath
    ], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // 완료 시 자막 다운로드 스크립트 생성
    const completionScript = `#!/bin/bash
echo "토렌트 다운로드 완료: $TR_TORRENT_NAME"
# 여기서 자막 다운로드 API 호출
curl -X POST http://localhost:3015/api/torrent/completed \\
  -H "Content-Type: application/json" \\
  -d '{"torrentName":"$TR_TORRENT_NAME","downloadPath":"${downloadPath}","downloadId":"${downloadId}"}'
`;

    await writeFile('/tmp/transmission-script.sh', completionScript);
    await spawn('chmod', ['+x', '/tmp/transmission-script.sh']);

    // 프로세스 분리
    transmissionProcess.unref();

    // 진행률 모니터링을 위한 정보 저장
    const downloadInfo = {
      id: downloadId,
      torrentName: file.name,
      torrentPath,
      downloadPath,
      startTime: new Date().toISOString(),
      status: 'downloading',
      progress: 0
    };

    // 간단한 메모리 저장 (실제로는 DB 사용 권장)
    global.activeDownloads = global.activeDownloads || new Map();
    global.activeDownloads.set(downloadId, downloadInfo);

    console.log('✅ 토렌트 다운로드 시작됨:', downloadId);

    return NextResponse.json({
      success: true,
      downloadId,
      torrentName: file.name,
      downloadPath,
      message: '토렌트 다운로드가 시작되었습니다.',
      estimatedTime: '다운로드 속도에 따라 결정됩니다.'
    });

  } catch (error) {
    console.error('토렌트 업로드 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
}

// 다운로드 진행률 확인 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadId = searchParams.get('id');

    if (!downloadId) {
      // 모든 활성 다운로드 반환
      const activeDownloads = global.activeDownloads || new Map();
      const downloads = Array.from(activeDownloads.values());
      
      return NextResponse.json({
        success: true,
        downloads
      });
    }

    // 특정 다운로드 정보 반환
    const activeDownloads = global.activeDownloads || new Map();
    const downloadInfo = activeDownloads.get(downloadId);

    if (!downloadInfo) {
      return NextResponse.json({ error: '다운로드를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      download: downloadInfo
    });

  } catch (error) {
    console.error('다운로드 정보 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      },
      { status: 500 }
    );
  }
} 