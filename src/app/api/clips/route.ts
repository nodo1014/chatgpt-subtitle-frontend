import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sentence, media_file, start_time, end_time } = await request.json();

    // Python 백엔드 API 호출
    const response = await fetch('http://localhost:5000/api/request-clip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sentence,
        media_file,
        start_time,
        end_time
      })
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('클립 요청 오류:', error);
    return NextResponse.json(
      { success: false, error: '클립 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 대기 중인 클립 목록 조회
    const response = await fetch('http://localhost:5000/api/pending-clips');
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('클립 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '클립 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
