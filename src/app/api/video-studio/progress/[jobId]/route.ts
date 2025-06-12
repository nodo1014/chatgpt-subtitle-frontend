import { NextRequest, NextResponse } from 'next/server';

// 렌더링 작업 상태 관리 (메모리 - 추후 Redis나 DB로 이전)
// 임시로 전역 객체에 저장
declare global {
  var renderJobs: Map<string, any> | undefined;
}

// 전역 렌더링 작업 저장소 초기화
if (!global.renderJobs) {
  global.renderJobs = new Map();
}

// GET: 렌더링 진행률 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID가 필요합니다.'
      }, { status: 400 });
    }
    
    const job = global.renderJobs?.get(jobId);
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: '작업을 찾을 수 없습니다.'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: job.status,
      progress: job.progress,
      output_path: job.output_path,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at
    });
    
  } catch (error) {
    console.error('진행률 확인 실패:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// DELETE: 렌더링 작업 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    
    const job = renderJobs.get(jobId);
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: '작업을 찾을 수 없습니다.'
      }, { status: 404 });
    }
    
    if (job.status === 'completed') {
      return NextResponse.json({
        success: false,
        error: '이미 완료된 작업은 취소할 수 없습니다.'
      }, { status: 400 });
    }
    
    // 작업 취소 로직
    job.status = 'cancelled';
    job.cancelled_at = new Date();
    
    // TODO: 실제 FFmpeg 프로세스 종료
    
    return NextResponse.json({
      success: true,
      message: '렌더링 작업이 취소되었습니다.'
    });
    
  } catch (error) {
    console.error('작업 취소 실패:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
