'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, Column } from 'react-data-grid';
import { Search, Save, Trash2, Download, RefreshCw, BookOpen } from 'lucide-react';
import 'react-data-grid/lib/styles.css';

interface WorkspaceRow {
  id: number;
  subtitle_id: number;
  series_name: string;
  episode_title: string;
  english_text: string;
  korean_translation: string;
  explanation_line1: string;
  explanation_line2: string;
  explanation_line3: string;
  pronunciation_guide: string;
  learning_priority: number;
  tags: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export default function WorkspaceSpreadsheetPage() {
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [originalRows, setOriginalRows] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // 컬럼 정의 (스프레드시트 스타일)
  const columns: Column<WorkspaceRow>[] = [
    {
      key: 'id',
      name: '자막ID',
      width: 80,
      frozen: true,
      resizable: false,
      renderCell: ({ row }) => (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '4px 8px', 
          fontWeight: '500',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          {row.id}
        </div>
      )
    },
    {
      key: 'series_name',
      name: '시리즈명',
      width: 120,
      frozen: true,
      renderCell: ({ row }) => (
        <div style={{ 
          fontWeight: '500',
          color: '#374151'
        }}>
          {row.series_name}
        </div>
      )
    },
    {
      key: 'episode_title',
      name: '에피소드',
      width: 150,
      renderCell: ({ row }) => (
        <div style={{ 
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {row.episode_title}
        </div>
      )
    },
    {
      key: 'english_text',
      name: '영어 자막',
      width: 300,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <textarea
          autoFocus
          value={row.english_text}
          onChange={(e) => onRowChange({ ...row, english_text: e.target.value })}
          onBlur={onClose}
          style={{
            width: '100%',
            height: '60px',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            resize: 'none'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          lineHeight: '1.4',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {row.english_text}
        </div>
      )
    },
    {
      key: 'korean_translation',
      name: '한글 번역',
      width: 250,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <textarea
          autoFocus
          value={row.korean_translation}
          onChange={(e) => onRowChange({ ...row, korean_translation: e.target.value })}
          onBlur={onClose}
          style={{
            width: '100%',
            height: '60px',
            border: '2px solid #10b981',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            resize: 'none'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          lineHeight: '1.4',
          fontSize: '14px',
          color: '#059669'
        }}>
          {row.korean_translation}
        </div>
      )
    },
    {
      key: 'explanation_line1',
      name: '해설1 (기본의미)',
      width: 200,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <textarea
          autoFocus
          value={row.explanation_line1}
          onChange={(e) => onRowChange({ ...row, explanation_line1: e.target.value })}
          onBlur={onClose}
          style={{
            width: '100%',
            height: '60px',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            resize: 'none'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          lineHeight: '1.4',
          fontSize: '13px',
          color: '#d97706'
        }}>
          {row.explanation_line1}
        </div>
      )
    },
    {
      key: 'explanation_line2',
      name: '해설2 (뉘앙스)',
      width: 200,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <textarea
          autoFocus
          value={row.explanation_line2}
          onChange={(e) => onRowChange({ ...row, explanation_line2: e.target.value })}
          onBlur={onClose}
          style={{
            width: '100%',
            height: '60px',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            resize: 'none'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          lineHeight: '1.4',
          fontSize: '13px',
          color: '#d97706'
        }}>
          {row.explanation_line2}
        </div>
      )
    },
    {
      key: 'explanation_line3',
      name: '해설3 (활용법)',
      width: 200,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <textarea
          autoFocus
          value={row.explanation_line3}
          onChange={(e) => onRowChange({ ...row, explanation_line3: e.target.value })}
          onBlur={onClose}
          style={{
            width: '100%',
            height: '60px',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            resize: 'none'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          lineHeight: '1.4',
          fontSize: '13px',
          color: '#d97706'
        }}>
          {row.explanation_line3}
        </div>
      )
    },
    {
      key: 'pronunciation_guide',
      name: '한글 발음',
      width: 180,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <input
          autoFocus
          type="text"
          value={row.pronunciation_guide}
          onChange={(e) => onRowChange({ ...row, pronunciation_guide: e.target.value })}
          onBlur={onClose}
          style={{
            width: '100%',
            border: '2px solid #8b5cf6',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#7c3aed',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px'
        }}>
          {row.pronunciation_guide}
        </div>
      )
    },
    {
      key: 'learning_priority',
      name: '우선순위',
      width: 100,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <select
          autoFocus
          value={row.learning_priority}
          onChange={(e) => onRowChange({ ...row, learning_priority: parseInt(e.target.value) })}
          onBlur={onClose}
          style={{
            width: '100%',
            border: '2px solid #ef4444',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px'
          }}
        >
          {[1,2,3,4,5,6,7,8,9,10].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      ),
      renderCell: ({ row }) => {
        const getPriorityColor = (priority: number) => {
          if (priority >= 8) return { backgroundColor: '#fef2f2', color: '#991b1b' };
          if (priority >= 6) return { backgroundColor: '#fefce8', color: '#92400e' };
          if (priority >= 4) return { backgroundColor: '#eff6ff', color: '#1e40af' };
          return { backgroundColor: '#f9fafb', color: '#374151' };
        };

        return (
          <div style={{ 
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textAlign: 'center',
            ...getPriorityColor(row.learning_priority)
          }}>
            {row.learning_priority}
          </div>
        );
      }
    },
    {
      key: 'tags',
      name: '태그',
      width: 150,
      editable: true,
      renderEditCell: ({ row, onRowChange, onClose }) => (
        <input
          autoFocus
          type="text"
          value={row.tags}
          onChange={(e) => onRowChange({ ...row, tags: e.target.value })}
          onBlur={onClose}
          placeholder="태그1, 태그2"
          style={{
            width: '100%',
            border: '2px solid #6b7280',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px'
          }}
        />
      ),
      renderCell: ({ row }) => (
        <div style={{ 
          padding: '8px',
          fontSize: '12px'
        }}>
          {row.tags && row.tags.split(',').map((tag, idx) => (
            <span 
              key={idx}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '2px 6px',
                borderRadius: '8px',
                marginRight: '4px',
                fontSize: '11px'
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'start_time',
      name: '시작시간',
      width: 100,
      renderCell: ({ row }) => (
        <div style={{ 
          fontSize: '12px',
          color: '#6b7280',
          fontFamily: 'monospace'
        }}>
          {row.start_time}
        </div>
      )
    },
    {
      key: 'end_time',
      name: '종료시간',
      width: 100,
      renderCell: ({ row }) => (
        <div style={{ 
          fontSize: '12px',
          color: '#6b7280',
          fontFamily: 'monospace'
        }}>
          {row.end_time}
        </div>
      )
    }
  ];

  // 데이터 로드
  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // 변경사항 감지
  useEffect(() => {
    const hasChanges = JSON.stringify(rows) !== JSON.stringify(originalRows);
    setHasChanges(hasChanges);
  }, [rows, originalRows]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspace/sentences?limit=1000');

      if (response.ok) {
        const data = await response.json();
        
        // 데이터 변환
        const transformedRows: WorkspaceRow[] = (data.sentences || []).map((sentence: any) => ({
          id: sentence.id,
          subtitle_id: sentence.subtitle_id,
          series_name: sentence.series_name || '',
          episode_title: sentence.episode_title || '',
          english_text: sentence.text || '',
          korean_translation: sentence.ai_translation || '',
          explanation_line1: sentence.explanation_line1 || '',
          explanation_line2: sentence.explanation_line2 || '',
          explanation_line3: sentence.explanation_line3 || '',
          pronunciation_guide: sentence.pronunciation_guide || '',
          learning_priority: sentence.learning_priority || 5,
          tags: '', // 태그는 별도 처리 필요
          start_time: sentence.start_time || '',
          end_time: sentence.end_time || '',
          created_at: sentence.created_at || ''
        }));

        setRows(transformedRows);
        setOriginalRows(JSON.parse(JSON.stringify(transformedRows)));
      }
    } catch (error) {
      console.error('워크스페이스 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 행 업데이트 핸들러
  const handleRowsChange = useCallback((newRows: WorkspaceRow[]) => {
    setRows(newRows);
  }, []);

  // 저장
  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setSaving(true);
      
      // 변경된 행들만 찾기
      const changedRows = rows.filter((row, index) => {
        const original = originalRows[index];
        return original && JSON.stringify(row) !== JSON.stringify(original);
      });

      console.log('💾 저장할 변경사항:', changedRows.length, '개');

      // 일괄 업데이트 API 호출
      const response = await fetch('/api/workspace/sentences/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: changedRows })
      });

      if (response.ok) {
        setOriginalRows(JSON.parse(JSON.stringify(rows)));
        console.log('✅ 저장 완료');
      } else {
        console.error('❌ 저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
    } finally {
      setSaving(false);
    }
  };

  // 선택된 행 삭제
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    
    if (!confirm(`선택된 ${selectedRows.size}개 문장을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch('/api/workspace/sentences/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedRows) })
      });

      if (response.ok) {
        await loadWorkspaceData();
        setSelectedRows(new Set());
      }
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    const headers = columns.map(col => col.name).join(',');
    const csvData = rows.map(row => 
      columns.map(col => {
        const value = row[col.key as keyof WorkspaceRow];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    ).join('\n');
    
    const csv = headers + '\n' + csvData;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `workspace_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 필터링된 행
  const filteredRows = searchQuery.trim() 
    ? rows.filter(row => 
        row.english_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.korean_translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.series_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rows;

  const cardStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    marginBottom: '16px'
  };

  const buttonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
          📊 워크스페이스 스프레드시트
        </h1>
        <p style={{ color: '#6b7280' }}>Excel처럼 편집하고 복사/붙여넣기가 가능한 학습 문장 관리</p>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          ⚡ Powered by <strong>react-data-grid</strong> + <strong>better-sqlite3</strong>
        </div>
      </div>

      {/* 통계 및 컨트롤 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{filteredRows.length}</span>
              <span style={{ color: '#6b7280', marginLeft: '4px' }}>개 문장</span>
            </div>
            {selectedRows.size > 0 && (
              <div>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{selectedRows.size}</span>
                <span style={{ color: '#6b7280', marginLeft: '4px' }}>개 선택됨</span>
              </div>
            )}
            {hasChanges && (
              <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>
                ⚠️ 저장되지 않은 변경사항이 있습니다
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              style={{
                ...buttonStyle,
                backgroundColor: hasChanges ? '#10b981' : '#9ca3af',
                cursor: hasChanges ? 'pointer' : 'not-allowed'
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              {saving ? '저장 중...' : '저장'}
            </button>
            
            <button
              onClick={handleDeleteSelected}
              disabled={selectedRows.size === 0}
              style={{
                ...buttonStyle,
                backgroundColor: selectedRows.size > 0 ? '#ef4444' : '#9ca3af',
                cursor: selectedRows.size > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
              삭제 ({selectedRows.size})
            </button>

            <button onClick={handleExportCSV} style={{ ...buttonStyle, backgroundColor: '#6b7280' }}>
              <Download style={{ width: '16px', height: '16px' }} />
              CSV 내보내기
            </button>

            <button onClick={loadWorkspaceData} style={{ ...buttonStyle, backgroundColor: '#6b7280' }}>
              <RefreshCw style={{ width: '16px', height: '16px' }} />
              새로고침
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '16px', height: '16px' }} />
          <input
            type="text"
            placeholder="문장, 번역, 시리즈명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* 스프레드시트 */}
      <div style={{ 
        height: 'calc(100vh - 300px)', 
        minHeight: '500px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <DataGrid
          columns={columns}
          rows={filteredRows}
          onRowsChange={handleRowsChange}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          rowKeyGetter={(row) => row.id}
          defaultColumnOptions={{
            sortable: true,
            resizable: true
          }}
          style={{ 
            height: '100%',
            fontSize: '14px'
          }}
          className="rdg-light"
          rowHeight={50}
          headerRowHeight={40}
        />
      </div>

      {/* 도움말 */}
      <div style={{ ...cardStyle, marginTop: '16px', backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
          💡 사용법
        </h3>
        <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
          • <strong>편집:</strong> 셀을 더블클릭하거나 Enter키로 편집 모드 진입<br/>
          • <strong>선택:</strong> 체크박스로 여러 행 선택 가능<br/>
          • <strong>복사/붙여넣기:</strong> Ctrl+C, Ctrl+V로 Excel처럼 사용<br/>
          • <strong>정렬:</strong> 컬럼 헤더 클릭으로 정렬<br/>
          • <strong>크기조절:</strong> 컬럼 경계를 드래그해서 크기 조절<br/>
          • <strong>저장:</strong> 변경사항이 있으면 자동으로 저장 버튼 활성화
        </div>
      </div>
    </div>
  );
} 