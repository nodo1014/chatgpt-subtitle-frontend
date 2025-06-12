'use client';

import Link from 'next/link';

export default function EditorTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">📝 학습 문장 편집기</h2>
            <div className="flex space-x-3">
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">모든 시리즈</option>
                <option value="friends">Friends</option>
                <option value="disney">Disney Animations</option>
              </select>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                💾 저장
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                📥 CSV 내보내기
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">문장 편집기 로딩 중...</h3>
            <p className="text-gray-600 mb-4">
              Workspace 스프레드시트 기능을 이곳에 통합하고 있습니다.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>✅ 데이터베이스 연결 완료</p>
              <p>✅ 샘플 학습 문장 5개 생성 완료</p>
              <p>🔄 스프레드시트 컴포넌트 통합 중...</p>
            </div>
            <div className="mt-6">
              <Link 
                href="/workspace-spreadsheet" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                임시로 기존 Workspace 열기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 