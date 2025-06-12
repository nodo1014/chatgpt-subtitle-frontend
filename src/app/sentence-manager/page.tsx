'use client';

import React, { useState, useEffect } from 'react';

interface Workspace {
  id: number;
  name: string;
  description: string;
  sentence_count: number;
}

interface WorkspaceSentence {
  id: number;
  subtitle_id: number;
  text: string;
  ai_translation: string;
  ai_explanation: string;
  pronunciation_guide: string;
  learning_priority: number;
  is_bookmarked: boolean;
}

export default function SentenceManager() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null);
  const [sentences, setSentences] = useState<WorkspaceSentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [spreadsheetData, setSpreadsheetData] = useState('');

  // 워크스페이스 목록 로드
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/v3/workspace?includeStats=true');
      const data = await response.json();
      if (data.success) {
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      console.error('워크스페이스 로드 오류:', error);
    }
  };

  // 워크스페이스 문장 로드
  const loadSentences = async (workspaceId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sentence-manager/sentences?workspaceId=${workspaceId}`);
      const data = await response.json();
      if (data.success) {
        setSentences(data.sentences);
        generateSpreadsheetData(data.sentences);
      }
    } catch (error) {
      console.error('문장 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 스프레드시트 데이터 생성
  const generateSpreadsheetData = (sentenceList: WorkspaceSentence[]) => {
    const headers = ['ID', '영어 문장', '한글 번역', '해설', '발음 가이드', '우선순위', '북마크'];
    const rows = sentenceList.map(sentence => [
      sentence.id,
      sentence.text,
      sentence.ai_translation || '',
      sentence.ai_explanation || '',
      sentence.pronunciation_guide || '',
      sentence.learning_priority || 5,
      sentence.is_bookmarked ? 'Y' : 'N'
    ]);
    
    const csvData = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join('\t'))
      .join('\n');
    
    setSpreadsheetData(csvData);
  };

  // 스프레드시트 데이터 파싱 및 저장
  const handleSaveSpreadsheetData = async () => {
    if (!selectedWorkspace || !spreadsheetData.trim()) {
      alert('워크스페이스를 선택하고 데이터를 입력해주세요.');
      return;
    }

    try {
      const lines = spreadsheetData.trim().split('\n');
      const headers = lines[0].split('\t').map(h => h.replace(/"/g, ''));
      const dataRows = lines.slice(1);

      const parsedData = dataRows.map(line => {
        const cells = line.split('\t').map(cell => cell.replace(/"/g, ''));
        return {
          id: parseInt(cells[0]) || 0,
          text: cells[1] || '',
          ai_translation: cells[2] || '',
          ai_explanation: cells[3] || '',
          pronunciation_guide: cells[4] || '',
          learning_priority: parseInt(cells[5]) || 5,
          is_bookmarked: cells[6] === 'Y'
        };
      });

      const response = await fetch('/api/sentence-manager/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          sentences: parsedData
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('문장 데이터가 저장되었습니다.');
        loadSentences(selectedWorkspace);
      } else {
        alert('저장 실패: ' + result.error);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('데이터 저장 중 오류가 발생했습니다.');
    }
  };

  const handleWorkspaceChange = (workspaceId: number) => {
    setSelectedWorkspace(workspaceId);
    loadSentences(workspaceId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">문장 관리</h1>
          
          {/* 워크스페이스 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              워크스페이스 선택
            </label>
            <select
              value={selectedWorkspace || ''}
              onChange={(e) => handleWorkspaceChange(parseInt(e.target.value))}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">워크스페이스를 선택하세요</option>
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} ({workspace.sentence_count}개 문장)
                </option>
              ))}
            </select>
          </div>

          {selectedWorkspace && (
            <>
              {/* 안내 메시지 */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-2">사용 방법</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>1. 아래 텍스트 영역의 데이터를 복사하여 엑셀/구글시트에 붙여넣기</li>
                  <li>2. 엑셀/구글시트에서 한글 번역, 해설, 발음 가이드 등을 편집</li>
                  <li>3. 편집된 데이터를 복사하여 아래 텍스트 영역에 붙여넣기</li>
                  <li>4. '저장' 버튼을 클릭하여 데이터베이스에 반영</li>
                </ul>
              </div>

              {/* 스프레드시트 데이터 영역 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    스프레드시트 데이터 (탭으로 구분)
                  </label>
                  <div className="space-x-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(spreadsheetData)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      복사
                    </button>
                    <button
                      onClick={handleSaveSpreadsheetData}
                      className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      저장
                    </button>
                  </div>
                </div>
                <textarea
                  value={spreadsheetData}
                  onChange={(e) => setSpreadsheetData(e.target.value)}
                  className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="스프레드시트 데이터를 여기에 붙여넣으세요..."
                />
              </div>

              {/* 현재 문장 목록 (읽기 전용) */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">문장을 불러오는 중...</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    현재 문장 목록 ({sentences.length}개)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">영어 문장</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">한글 번역</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">해설</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발음</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">북마크</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sentences.map((sentence) => (
                          <tr key={sentence.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sentence.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sentence.text}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sentence.ai_translation || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sentence.ai_explanation || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sentence.pronunciation_guide || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sentence.learning_priority}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sentence.is_bookmarked ? '⭐' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 