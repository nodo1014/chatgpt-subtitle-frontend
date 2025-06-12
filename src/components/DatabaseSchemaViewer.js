'use client';

import { useState, useEffect } from 'react';

export default function DatabaseSchemaViewer() {
  const [schema, setSchema] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeView, setActiveView] = useState('schema'); // 'schema' or 'data'

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v3/schema');
      const data = await response.json();
      
      if (data.success) {
        setSchema(data.schema);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('스키마 로드 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName, limit = 100) => {
    try {
      setDataLoading(true);
      const response = await fetch(`/api/v3/schema?table=${tableName}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setTableData(data);
      } else {
        setError(data.error);
        setTableData(null);
      }
    } catch (err) {
      setError('데이터 로드 실패: ' + err.message);
      setTableData(null);
    } finally {
      setDataLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      'INTEGER': 'bg-blue-100 text-blue-800',
      'TEXT': 'bg-green-100 text-green-800',
      'REAL': 'bg-yellow-100 text-yellow-800',
      'BLOB': 'bg-purple-100 text-purple-800',
      'DATETIME': 'bg-pink-100 text-pink-800',
      'BOOLEAN': 'bg-indigo-100 text-indigo-800'
    };
    
    const upperType = type.toUpperCase();
    for (const [key, color] of Object.entries(typeColors)) {
      if (upperType.includes(key)) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">스키마 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-400">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const tableNames = Object.keys(schema);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          🗄️ 데이터베이스 스키마
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({tableNames.length}개 테이블)
          </span>
        </h2>
      </div>

      <div className="flex">
        {/* 테이블 목록 */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">테이블 목록</h3>
            <div className="space-y-1">
              {tableNames.map(tableName => (
                <button
                  key={tableName}
                  onClick={() => {
                    setSelectedTable(tableName);
                    setActiveView('schema');
                    setTableData(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedTable === tableName
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tableName}</span>
                    <span className="text-xs text-gray-500">
                      {schema[tableName].columns.length}개 컬럼
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 테이블 상세 정보 */}
        <div className="flex-1 p-6">
          {selectedTable ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  📋 {selectedTable}
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>컬럼: {schema[selectedTable].columns.length}개</span>
                    <span>인덱스: {schema[selectedTable].indexes.length}개</span>
                    <span>외래키: {schema[selectedTable].foreignKeys.length}개</span>
                  </div>
                  
                  {/* 뷰 전환 버튼 */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveView('schema')}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        activeView === 'schema'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📊 구조
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('data');
                        if (!tableData || tableData.tableName !== selectedTable) {
                          loadTableData(selectedTable);
                        }
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        activeView === 'data'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      📄 데이터
                    </button>
                  </div>
                </div>
              </div>

              {/* 스키마 뷰 */}
              {activeView === 'schema' && (
                <>
                  {/* 컬럼 정보 */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-800 mb-3">컬럼 정보</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NULL</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">기본값</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PK</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schema[selectedTable].columns.map((column, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {column.name}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(column.type)}`}>
                              {column.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {column.notnull ? '❌' : '✅'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {column.dflt_value || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {column.pk ? '🔑' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 인덱스 정보 */}
              {schema[selectedTable].indexes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-800 mb-3">인덱스</h4>
                  <div className="space-y-2">
                    {schema[selectedTable].indexes.map((index, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{index.name}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            index.unique ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {index.unique ? 'UNIQUE' : 'INDEX'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 외래키 정보 */}
              {schema[selectedTable].foreignKeys.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-800 mb-3">외래키</h4>
                  <div className="space-y-2">
                    {schema[selectedTable].foreignKeys.map((fk, i) => (
                      <div key={i} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="text-sm">
                          <span className="font-medium">{fk.from}</span>
                          <span className="text-gray-500 mx-2">→</span>
                          <span className="font-medium">{fk.table}.{fk.to}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}

              {/* 데이터 뷰 */}
              {activeView === 'data' && (
                <div>
                  {dataLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">데이터 로딩 중...</span>
                    </div>
                  ) : tableData && tableData.data ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-800">
                          테이블 데이터 ({tableData.totalCount.toLocaleString()}개 중 {tableData.data.length}개 표시)
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadTableData(selectedTable, 50)}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            50개
                          </button>
                          <button
                            onClick={() => loadTableData(selectedTable, 100)}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            100개
                          </button>
                          <button
                            onClick={() => loadTableData(selectedTable, 500)}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            500개
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {tableData.data.length > 0 && Object.keys(tableData.data[0]).map((column) => (
                                <th key={column} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableData.data.map((row, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                                    {value === null ? (
                                      <span className="text-gray-400 italic">NULL</span>
                                    ) : typeof value === 'string' && value.length > 100 ? (
                                      <span title={value}>{value.substring(0, 100)}...</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl">📄</span>
                      <p className="mt-2">데이터가 없습니다</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-gray-500">테이블을 선택하여 상세 정보를 확인하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 