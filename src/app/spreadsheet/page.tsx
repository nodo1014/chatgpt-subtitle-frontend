'use client';

import { useState } from 'react';

export default function SpreadsheetPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">스프레드시트</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          스프레드시트 기능이 여기에 구현될 예정입니다.
        </p>
        
        {loading && (
          <div className="flex items-center justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {data.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">데이터</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2">ID</th>
                    <th className="border border-gray-300 px-4 py-2">내용</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{JSON.stringify(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}