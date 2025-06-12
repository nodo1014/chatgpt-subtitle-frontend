import { NextRequest, NextResponse } from 'next/server';

// 비디오 캡처 API 엔드포인트
export async function GET(request: NextRequest) {
  try {
    // TODO: 비디오 캡처 기능 구현
    return NextResponse.json({ message: 'Video capture API endpoint' });
  } catch (error) {
    console.error('Video capture API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: 비디오 캡처 데이터 처리
    const body = await request.json();
    return NextResponse.json({ message: 'Video captured', data: body });
  } catch (error) {
    console.error('Video capture API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
