import { WorkspaceClip, CommonRenderSettings, RenderTemplate, SUBTITLE_POSITIONS } from '../types';
import VideoPreviewCanvas from '@/components/VideoPreviewCanvas';

interface VideoPreviewProps {
  clip: WorkspaceClip;
  settings: CommonRenderSettings;
  template?: RenderTemplate;
}

function VideoPreview({ clip, settings, template }: VideoPreviewProps) {
  const getSubtitleStyle = (position: string) => {
    const baseStyle = "absolute left-4 right-4 text-center px-2 py-1 rounded text-sm font-medium shadow-lg";
    
    switch (position) {
      case 'top':
        return `${baseStyle} top-4 bg-black/80 text-white`;
      case 'middle':
        return `${baseStyle} top-1/2 transform -translate-y-1/2 bg-black/80 text-white`;
      case 'bottom':
        return `${baseStyle} bottom-4 bg-black/80 text-white`;
      default:
        return `${baseStyle} bottom-4 bg-black/80 text-white`;
    }
  };

  const aspectRatio = template?.format === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]';

  // 현재 회차의 설정 (미리보기용으로 첫 번째 회차 사용)
  const currentRepeatSettings = settings.repeatSettings[0] || {
    showEnglish: true,
    showKorean: true,
    showExplanation: false,
    showPronunciation: false,
    pauseAfter: 1.0
  };

  return (
    <div className="space-y-4">
      {/* 비디오 미리보기 */}
      <div className={`relative ${aspectRatio} bg-black rounded-lg overflow-hidden border-2 border-gray-200`}>
        {/* 비디오 배경 (시뮬레이션) */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-50" />
        
        {/* 비디오 제목 (중앙) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <div className="text-lg font-bold mb-2">🎬 {clip.title}</div>
            <div className="text-sm opacity-75">비디오 프레임 시뮬레이션</div>
          </div>
        </div>

        {/* 자막 오버레이 */}
        {currentRepeatSettings.showEnglish && (
          <div 
            className={getSubtitleStyle(settings.subtitlePosition)}
            style={{
              color: settings.fontSettings.color,
              fontSize: `${Math.min(settings.fontSettings.size / 6, 16)}px`,
              fontFamily: settings.fontSettings.fontFamily,
              textShadow: settings.fontSettings.strokeWidth > 0 
                ? `1px 1px 0 ${settings.fontSettings.strokeColor}, -1px -1px 0 ${settings.fontSettings.strokeColor}, 1px -1px 0 ${settings.fontSettings.strokeColor}, -1px 1px 0 ${settings.fontSettings.strokeColor}`
                : 'none'
            }}
          >
            <div>{clip.english_text}</div>
          </div>
        )}
        
        {currentRepeatSettings.showKorean && (
          <div 
            className={`${getSubtitleStyle(settings.subtitlePosition)} ${currentRepeatSettings.showEnglish ? 'mt-8' : ''}`}
            style={{
              color: settings.fontSettings.color,
              fontSize: `${Math.min(settings.fontSettings.size / 6, 16)}px`,
              fontFamily: settings.fontSettings.fontFamily,
              textShadow: settings.fontSettings.strokeWidth > 0 
                ? `1px 1px 0 ${settings.fontSettings.strokeColor}, -1px -1px 0 ${settings.fontSettings.strokeColor}, 1px -1px 0 ${settings.fontSettings.strokeColor}, -1px 1px 0 ${settings.fontSettings.strokeColor}`
                : 'none'
            }}
          >
            <div>{clip.korean_text}</div>
          </div>
        )}

        {currentRepeatSettings.showExplanation && clip.explanation && (
          <div className="absolute top-4 left-4 bg-green-600/90 text-white px-2 py-1 rounded text-xs max-w-[200px]">
            💡 {clip.explanation}
          </div>
        )}

        {currentRepeatSettings.showPronunciation && clip.pronunciation && (
          <div className="absolute top-4 right-4 bg-purple-600/90 text-white px-2 py-1 rounded text-xs max-w-[200px]">
            🔊 {clip.pronunciation}
          </div>
        )}

        {/* 반복 표시 */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
          🔄 {settings.repeatCount}회 반복
        </div>

        {/* 글로벌 옵션 표시 */}
        {settings.globalOptions.showProgress && (
          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
            📊 진행률 표시
          </div>
        )}
      </div>

      {/* 설정 요약 */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-gray-700">미리보기 설정</div>
        
        <div className="space-y-3">
          {/* 회차별 설정 요약 */}
          <div>
            <div className="font-medium text-gray-600 mb-2 text-xs">회차별 설정</div>
            <div className="grid grid-cols-1 gap-2">
              {settings.repeatSettings.map((repeatSetting, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-white rounded p-2">
                  <span className="font-medium">{index + 1}회차</span>
                  <div className="flex gap-1">
                    {repeatSetting.showEnglish && <span className="text-yellow-600">🇺🇸</span>}
                    {repeatSetting.showKorean && <span className="text-blue-600">🇰🇷</span>}
                    {repeatSetting.showExplanation && <span className="text-green-600">💡</span>}
                    {repeatSetting.showPronunciation && <span className="text-purple-600">🔊</span>}
                  </div>
                  <span className="text-gray-500">{repeatSetting.pauseAfter}s</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 전체 설정 */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-gray-600 mb-1">기본 설정</div>
              <div className="space-y-1">
                <div>반복: {settings.repeatCount}회</div>
                <div>위치: {SUBTITLE_POSITIONS.find(p => p.value === settings.subtitlePosition)?.label}</div>
              </div>
            </div>
            
            <div>
              <div className="font-medium text-gray-600 mb-1">글로벌 옵션</div>
              <div className="space-y-1">
                {settings.globalOptions.fadeInOut && <div className="text-orange-600">🌅 페이드</div>}
                {settings.globalOptions.backgroundBlur && <div className="text-gray-600">🌫️ 블러</div>}
                {settings.globalOptions.showProgress && <div className="text-blue-600">📊 진행률</div>}
              </div>
            </div>
          </div>
        </div>

        {/* 타임라인 미리보기 */}
        <div className="mt-3">
          <div className="font-medium text-gray-600 mb-2 text-xs">예상 타임라인</div>
          <div className="flex gap-1">
            {Array.from({ length: settings.repeatCount }, (_, i) => (
              <div key={i} className="flex-1 space-y-1">
                <div className="bg-blue-500 h-2 rounded"></div>
                <div className="text-center text-xs text-gray-500">{i + 1}</div>
              </div>
            ))}
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            총 예상 시간: {(
              clip.duration * settings.repeatCount + 
              settings.repeatSettings.reduce((sum, setting) => sum + setting.pauseAfter, 0)
            ).toFixed(1)}초
          </div>
        </div>
      </div>
    </div>
  );
}

interface PreviewSectionProps {
  clips: WorkspaceClip[];
  selectedClipForPreview: string;
  settings: CommonRenderSettings;
  template?: RenderTemplate;
  useRealTimePreview: boolean;
  onToggleRealTimePreview: (enabled: boolean) => void;
}

export default function PreviewSection({
  clips,
  selectedClipForPreview,
  settings,
  template,
  useRealTimePreview,
  onToggleRealTimePreview
}: PreviewSectionProps) {
  const selectedClip = clips.find(c => c.id === selectedClipForPreview);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            👁️ 미리보기
          </h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useRealTimePreview}
              onChange={(e) => onToggleRealTimePreview(e.target.checked)}
              className="w-4 h-4"
            />
            <span>실시간 미리보기</span>
          </label>
        </div>
      </div>
      
      <div className="p-4">
        {selectedClipForPreview && selectedClip ? (
          useRealTimePreview ? (
            <VideoPreviewCanvas 
              clip={selectedClip}
              settings={settings}
              template={template}
            />
          ) : (
            <VideoPreview 
              clip={selectedClip}
              settings={settings}
              template={template}
            />
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-sm">클립을 선택하면</div>
            <div className="text-sm">미리보기가 표시됩니다</div>
          </div>
        )}
      </div>
    </div>
  );
}
