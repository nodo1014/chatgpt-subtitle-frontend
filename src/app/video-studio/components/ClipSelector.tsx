import { WorkspaceClip } from '../types';

interface ClipListProps {
  clips: WorkspaceClip[];
  selectedClipForPreview: string;
  onClipSelect: (clipId: string) => void;
}

export default function ClipList({ clips, selectedClipForPreview, onClipSelect }: ClipListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🎥 클립 목록 ({clips.length}개)
        </h2>
      </div>
      
      <div className="p-4">
        {clips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📁</div>
            <div className="text-sm">워크스페이스를 선택하면</div>
            <div className="text-sm">클립 목록이 표시됩니다</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clips.map((clip, index) => (
              <div 
                key={clip.id} 
                className={`p-2 rounded border cursor-pointer transition-all ${
                  selectedClipForPreview === clip.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onClipSelect(clip.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{clip.title}</div>
                    <div className="text-xs text-gray-600 truncate">"{clip.english_text}"</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}