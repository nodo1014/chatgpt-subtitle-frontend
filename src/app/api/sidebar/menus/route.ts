// 사이드바 메뉴 API
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'public', 'working_subtitles.db');

interface SidebarMenu {
  id: number;
  name: string;
  icon: string;
  menu_type: string;
  target_id: number | null;
  url: string | null;
  workflow_stage: string | null;
  sort_order: number;
  children?: SidebarMenu[];
}

export async function GET() {
  try {
    const db = new Database(dbPath);
    
    // 모든 사이드바 메뉴 조회
    const menus = db.prepare(`
      SELECT 
        sm.id,
        sm.name,
        sm.icon,
        sm.menu_type,
        sm.target_id,
        sm.url,
        sm.parent_id,
        sm.workflow_stage,
        sm.is_active,
        sm.sort_order,
        -- 카테고리 정보
        cc.name as category_name,
        cc.icon as category_icon,
        -- 시리즈 정보
        ys.series_name,
        ys.status as series_status,
        ys.current_episode_count,
        ys.target_episode_count
      FROM sidebar_menus sm
      LEFT JOIN content_categories cc ON sm.menu_type = 'category' AND sm.target_id = cc.id
      LEFT JOIN youtube_series ys ON sm.menu_type = 'series' AND sm.target_id = ys.id
      WHERE sm.is_active = 1
      ORDER BY sm.parent_id, sm.sort_order, sm.name
    `).all();
    
    // 계층 구조로 변환
    const menuMap = new Map<number, SidebarMenu>();
    const rootMenus: SidebarMenu[] = [];
    
    // 먼저 모든 메뉴를 맵에 저장
    menus.forEach(menu => {
      const processedMenu: SidebarMenu = {
        id: menu.id,
        name: menu.name,
        icon: menu.icon,
        menu_type: menu.menu_type,
        target_id: menu.target_id,
        url: menu.url,
        workflow_stage: menu.workflow_stage,
        sort_order: menu.sort_order,
        children: []
      };
      
      // 동적 이름 설정
      if (menu.menu_type === 'category' && menu.category_name) {
        processedMenu.name = menu.category_name;
        processedMenu.icon = menu.category_icon || menu.icon;
      } else if (menu.menu_type === 'series' && menu.series_name) {
        const progress = menu.target_episode_count > 0 
          ? `(${menu.current_episode_count}/${menu.target_episode_count})`
          : '';
        processedMenu.name = `${menu.series_name} ${progress}`.trim();
      }
      
      menuMap.set(menu.id, processedMenu);
    });
    
    // 계층 구조 구성
    menus.forEach(menu => {
      if (menu.parent_id) {
        const parent = menuMap.get(menu.parent_id);
        const child = menuMap.get(menu.id);
        if (parent && child) {
          parent.children!.push(child);
        }
      } else {
        const rootMenu = menuMap.get(menu.id);
        if (rootMenu) {
          rootMenus.push(rootMenu);
        }
      }
    });
    
    // 워크플로우 단계별 통계
    const workflowStages = db.prepare(`
      SELECT 
        workflow_stage,
        COUNT(*) as count
      FROM sidebar_menus 
      WHERE workflow_stage IS NOT NULL AND is_active = 1
      GROUP BY workflow_stage
      ORDER BY workflow_stage
    `).all();
    
    db.close();
    
    return NextResponse.json({
      success: true,
      menus: rootMenus,
      workflowStages,
      count: menus.length
    });
    
  } catch (error) {
    console.error('사이드바 메뉴 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '메뉴 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
