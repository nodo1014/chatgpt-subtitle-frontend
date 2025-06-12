import { NextRequest, NextResponse } from 'next/server';

// 스프레드시트 API 엔드포인트
export async function GET(request: NextRequest) {
  try {
    // TODO: 스프레드시트 기능 구현
    return NextResponse.json({ message: 'Spreadsheet API endpoint' });
  } catch (error) {
    console.error('Spreadsheet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: 스프레드시트 데이터 처리
    const body = await request.json();
    return NextResponse.json({ message: 'Data processed', data: body });
  } catch (error) {
    console.error('Spreadsheet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}