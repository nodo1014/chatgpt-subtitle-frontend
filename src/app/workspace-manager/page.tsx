'use client';

import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Save, Plus, BookOpen, Volume2, MessageSquare, Check, X } from 'lucide-react';

interface SelectedSentence {
  id: number;
  subtitle_id: number;
  text: string;
  ai_translation: string;
  ai_explanation: string;
  explanation_line1: string;
  explanation_line2: string;
  explanation_line3: string;
  pronunciation_guide: string;
  pronunciation_notes: string;
  learning_priority: number;
  selection_reason: string;
  series_name: string;
  episode_title: string;
  start_time: string;
  end_time: string;
  created_at: string;
  is_active: boolean;
}

interface WorkspaceStats {
  total_sentences: number;
  by_series: { [key: string]: number };
  by_priority: { [key: string]: number };
  by_difficulty: { [key: string]: number };
}

export default function WorkspaceManagerPage() {
  const [sentences, setSentences] = useState<SelectedSentence[]>([]);
  const [filteredSentences, setFilteredSentences] = useState<SelectedSentence[]>([]);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SelectedSentence>>({});
  const [filterSeries, setFilterSeries] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // 데이터 로드
  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = sentences;

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sentence => 
        sentence.text.toLowerCase().includes(query) ||
        sentence.ai_translation.toLowerCase().includes(query) ||
        sentence.series_name.toLowerCase().includes(query)
      );
    }

    // 시리즈 필터링
    if (filterSeries !== 'all') {
      filtered = filtered.filter(sentence => sentence.series_name === filterSeries);
    }

    // 우선순위 필터링
    if (filterPriority !== 'all') {
      filtered = filtered.filter(sentence => sentence.learning_priority.toString() === filterPriority);
    }

    setFilteredSentences(filtered);
  }, [sentences, searchQuery, filterSeries, filterPriority]);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      const [sentencesRes, statsRes] = await Promise.all([
        fetch('/api/workspace/sentences'),
        fetch('/api/workspace/stats')
      ]);

      if (sentencesRes.ok && statsRes.ok) {
        const sentencesData = await sentencesRes.json();
        const statsData = await statsRes.json();
        
        setSentences(sentencesData.sentences || []);
        setStats(statsData.stats || null);
      }
    } catch (error) {
      console.error('워크스페이스 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sentence: SelectedSentence) => {
    setEditingId(sentence.id);
    setEditForm(sentence);
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;

    try {
      const response = await fetch(`/api/workspace/sentences/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await loadWorkspaceData();
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error('문장 수정 실패:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (ids: number[]) => {
    if (!confirm(`선택된 ${ids.length}개 문장을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch('/api/workspace/sentences/batch-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });

      if (response.ok) {
        await loadWorkspaceData();
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('문장 삭제 실패:', error);
    }
  };

  const handleBatchTranslate = async () => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch('/api/workspace/sentences/batch-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (response.ok) {
        await loadWorkspaceData();
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('일괄 번역 실패:', error);
    }
  };

  const handleBatchExplain = async () => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch('/api/workspace/sentences/batch-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (response.ok) {
        await loadWorkspaceData();
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('일괄 해설 실패:', error);
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSentences.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSentences.map(s => s.id)));
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return { backgroundColor: '#fef2f2', color: '#991b1b' };
    if (priority >= 6) return { backgroundColor: '#fefce8', color: '#92400e' };
    if (priority >= 4) return { backgroundColor: '#eff6ff', color: '#1e40af' };
    return { backgroundColor: '#f9fafb', color: '#374151' };
  };

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

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '60px',
    resize: 'vertical' as const
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
          📚 워크스페이스 관리
        </h1>
        <p style={{ color: '#6b7280' }}>선택된 학습 문장들을 관리하고 편집하세요</p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.total_sentences}</div>
            <div style={{ color: '#6b7280' }}>총 학습 문장</div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{Object.keys(stats.by_series).length}</div>
            <div style={{ color: '#6b7280' }}>시리즈 수</div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{selectedIds.size}</div>
            <div style={{ color: '#6b7280' }}>선택된 문장</div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '16px', height: '16px' }} />
            <input
              type="text"
              placeholder="문장, 번역, 시리즈명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '40px' }}
            />
          </div>
          <select
            value={filterSeries}
            onChange={(e) => setFilterSeries(e.target.value)}
            style={inputStyle}
          >
            <option value="all">모든 시리즈</option>
            {stats && Object.keys(stats.by_series).map(series => (
              <option key={series} value={series}>{series} ({stats.by_series[series]})</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={inputStyle}
          >
            <option value="all">모든 우선순위</option>
            {[1,2,3,4,5,6,7,8,9,10].map(priority => (
              <option key={priority} value={priority.toString()}>우선순위 {priority}</option>
            ))}
          </select>
        </div>

        {/* 일괄 작업 버튼 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={toggleSelectAll}
            style={{ ...buttonStyle, backgroundColor: selectedIds.size > 0 ? '#ef4444' : '#6b7280' }}
          >
            <Check style={{ width: '16px', height: '16px' }} />
            {selectedIds.size === filteredSentences.length ? '전체 해제' : '전체 선택'}
          </button>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => handleDelete(Array.from(selectedIds))}
                style={{ ...buttonStyle, backgroundColor: '#ef4444' }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                삭제 ({selectedIds.size})
              </button>
              <button
                onClick={handleBatchTranslate}
                style={{ ...buttonStyle, backgroundColor: '#10b981' }}
              >
                <MessageSquare style={{ width: '16px', height: '16px' }} />
                일괄 번역
              </button>
              <button
                onClick={handleBatchExplain}
                style={{ ...buttonStyle, backgroundColor: '#f59e0b' }}
              >
                <BookOpen style={{ width: '16px', height: '16px' }} />
                일괄 해설
              </button>
            </>
          )}
        </div>
      </div>

      {/* 문장 목록 */}
      <div>
        {filteredSentences.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
            <div style={{ color: '#6b7280', fontSize: '18px' }}>
              {searchQuery || filterSeries !== 'all' || filterPriority !== 'all' 
                ? '검색 조건에 맞는 문장이 없습니다.' 
                : '학습 문장이 없습니다.'}
            </div>
          </div>
        ) : (
          filteredSentences.map((sentence) => (
            <div key={sentence.id} style={{ ...cardStyle, position: 'relative' }}>
              {/* 선택 체크박스 */}
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(sentence.id)}
                  onChange={() => toggleSelection(sentence.id)}
                  style={{ width: '16px', height: '16px' }}
                />
              </div>

              <div style={{ paddingLeft: '40px' }}>
                {editingId === sentence.id ? (
                  // 편집 모드
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>영어 문장</label>
                        <input
                          type="text"
                          value={editForm.text || ''}
                          onChange={(e) => setEditForm({...editForm, text: e.target.value})}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>우선순위</label>
                        <select
                          value={editForm.learning_priority || 5}
                          onChange={(e) => setEditForm({...editForm, learning_priority: parseInt(e.target.value)})}
                          style={inputStyle}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>한글 번역</label>
                      <textarea
                        value={editForm.ai_translation || ''}
                        onChange={(e) => setEditForm({...editForm, ai_translation: e.target.value})}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>해설 1줄 (기본 의미)</label>
                        <textarea
                          value={editForm.explanation_line1 || ''}
                          onChange={(e) => setEditForm({...editForm, explanation_line1: e.target.value})}
                          style={textareaStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>해설 2줄 (뉘앙스/문맥)</label>
                        <textarea
                          value={editForm.explanation_line2 || ''}
                          onChange={(e) => setEditForm({...editForm, explanation_line2: e.target.value})}
                          style={textareaStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>해설 3줄 (활용법)</label>
                        <textarea
                          value={editForm.explanation_line3 || ''}
                          onChange={(e) => setEditForm({...editForm, explanation_line3: e.target.value})}
                          style={textareaStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>한글 발음</label>
                        <textarea
                          value={editForm.pronunciation_guide || ''}
                          onChange={(e) => setEditForm({...editForm, pronunciation_guide: e.target.value})}
                          style={textareaStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={handleSave} style={{ ...buttonStyle, backgroundColor: '#10b981' }}>
                        <Save style={{ width: '16px', height: '16px' }} />
                        저장
                      </button>
                      <button onClick={handleCancel} style={{ ...buttonStyle, backgroundColor: '#6b7280' }}>
                        <X style={{ width: '16px', height: '16px' }} />
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '600' }}>{sentence.text}</span>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: '500',
                            ...getPriorityColor(sentence.learning_priority)
                          }}>
                            우선순위 {sentence.learning_priority}
                          </span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
                          {sentence.series_name} • {sentence.episode_title} • {sentence.start_time}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(sentence)}
                          style={{ ...buttonStyle, padding: '6px', backgroundColor: '#f59e0b' }}
                        >
                          <Edit style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete([sentence.id])}
                          style={{ ...buttonStyle, padding: '6px', backgroundColor: '#ef4444' }}
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>

                    {sentence.ai_translation && (
                      <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px', color: '#374151' }}>🇰🇷 한글 번역</div>
                        <div>{sentence.ai_translation}</div>
                      </div>
                    )}

                    {(sentence.explanation_line1 || sentence.explanation_line2 || sentence.explanation_line3) && (
                      <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '8px', color: '#92400e' }}>💡 해설</div>
                        {sentence.explanation_line1 && <div style={{ marginBottom: '4px' }}>• {sentence.explanation_line1}</div>}
                        {sentence.explanation_line2 && <div style={{ marginBottom: '4px' }}>• {sentence.explanation_line2}</div>}
                        {sentence.explanation_line3 && <div>• {sentence.explanation_line3}</div>}
                      </div>
                    )}

                    {sentence.pronunciation_guide && (
                      <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Volume2 style={{ width: '16px', height: '16px' }} />
                          한글 발음
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '16px' }}>{sentence.pronunciation_guide}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 