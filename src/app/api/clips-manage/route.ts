import { NextRequest, NextResponse } from 'next/server';
import { ClipDatabaseService, ClipFilter } from './services/clip-database.service';
import { ClipMigrationService } from './services/clip-migration.service';

/**
 * 클립 관리 API
 * GET: 클립 목록 조회
 * POST: 새 클립 생성
 * PUT: 클립 업데이트
 * DELETE: 클립 삭제
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 특수 액션 처리
    const action = searchParams.get('action');
    
    if (action === 'migration-status') {
      const status = await ClipMigrationService.checkMigrationStatus();
      return NextResponse.json({
        success: true,
        data: status
      });
    }
    
    if (action === 'migrate') {
      const result = await ClipMigrationService.migrateFromJSON();
      return NextResponse.json({
        success: true,
        message: `마이그레이션 완료: 성공 ${result.success}개, 실패 ${result.failed}개`,
        data: result
      });
    }

    // 필터 파라미터 파싱
    const filter: ClipFilter = {};
    
    if (searchParams.get('categoryId')) {
      filter.categoryId = parseInt(searchParams.get('categoryId')!);
    }
    
    if (searchParams.get('isBookmarked')) {
      filter.isBookmarked = searchParams.get('isBookmarked') === 'true';
    }
    
    if (searchParams.get('search')) {
      filter.search = searchParams.get('search')!;
    }
    
    if (searchParams.get('limit')) {
      filter.limit = parseInt(searchParams.get('limit')!);
    }
    
    if (searchParams.get('offset')) {
      filter.offset = parseInt(searchParams.get('offset')!);
    }

    // 데이터베이스 초기화
    await ClipDatabaseService.initDatabase();
    
    // 클립 목록 조회
    const clips = await ClipDatabaseService.getClips(filter);
    
    return NextResponse.json({
      success: true,
      data: clips,
      count: clips.length
    });

  } catch (error) {
    console.error('❌ 클립 조회 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clipData = await request.json();
    
    // 데이터베이스 초기화
    await ClipDatabaseService.initDatabase();
    
    // 클립 생성
    const success = await ClipDatabaseService.createClip(clipData);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: '클립이 성공적으로 생성되었습니다',
        data: { id: clipData.id }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '클립 생성에 실패했습니다'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 클립 생성 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '클립 ID가 필요합니다'
      }, { status: 400 });
    }
    
    // 데이터베이스 초기화
    await ClipDatabaseService.initDatabase();
    
    // 클립 업데이트
    const success = await ClipDatabaseService.updateClip(id, updates);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: '클립이 성공적으로 업데이트되었습니다'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '클립 업데이트에 실패했습니다'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 클립 업데이트 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids')?.split(',');
    
    if (!id && !ids) {
      return NextResponse.json({
        success: false,
        error: '삭제할 클립 ID가 필요합니다'
      }, { status: 400 });
    }
    
    // 데이터베이스 초기화
    await ClipDatabaseService.initDatabase();
    
    if (ids && ids.length > 1) {
      // 일괄 삭제
      const result = await ClipDatabaseService.deleteClips(ids);
      return NextResponse.json({
        success: true,
        message: `클립 삭제 완료: 성공 ${result.success}개, 실패 ${result.failed}개`,
        data: result
      });
    } else {
      // 단일 삭제
      const targetId = id || ids![0];
      const success = await ClipDatabaseService.deleteClip(targetId);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: '클립이 성공적으로 삭제되었습니다'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: '클립 삭제에 실패했습니다'
        }, { status: 400 });
      }
    }

  } catch (error) {
    console.error('❌ 클립 삭제 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
