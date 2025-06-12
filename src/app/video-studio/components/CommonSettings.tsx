import { CommonRenderSettings, RepeatSettings, SUBTITLE_POSITIONS } from '../types';

interface CommonSettingsProps {
  settings: CommonRenderSettings;
  onSettingsChange: (updates: Partial<CommonRenderSettings>) => void;
  onRepeatSettingsChange: (repeatIndex: number, updates: Partial<RepeatSettings>) => void;
}

export default function CommonSettings({ 
  settings, 
  onSettingsChange, 
  onRepeatSettingsChange 
}: CommonSettingsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          ⚙️ 공통 렌더링 설정
        </h2>
        <p className="text-sm text-gray-500 mt-1">모든 클립에 적용되는 설정입니다</p>
      </div>
      
      <div className="p-4 space-y-6">
        {/* 반복횟수 설정 */}
        <div>
          <label className="block text-sm font-medium mb-2">🔄 반복횟수</label>
          <input
            type="range"
            min="1"
            max="5"
            value={settings.repeatCount}
            onChange={(e) => onSettingsChange({ repeatCount: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-center text-sm text-gray-600 mt-1">{settings.repeatCount}회</div>
        </div>

        {/* 자막 위치 설정 */}
        <div>
          <label className="block text-sm font-medium mb-2">📍 자막 위치</label>
          <div className="flex gap-2">
            {SUBTITLE_POSITIONS.map(pos => (
              <button
                key={pos.value}
                onClick={() => onSettingsChange({ subtitlePosition: pos.value })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  settings.subtitlePosition === pos.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-lg">{pos.icon}</div>
                <div>{pos.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 회차별 세부 설정 */}
        <div>
          <label className="block text-sm font-medium mb-3">🎯 회차별 세부 설정</label>
          <div className="space-y-3">
            {settings.repeatSettings.map((repeatSetting, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{index + 1}회차</span>
                  <div className="text-xs text-gray-500">
                    일시정지: {repeatSetting.pauseAfter}초
                  </div>
                </div>
                
                {/* 표시 옵션 */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    { key: 'showEnglish', label: '영어', icon: '🇺🇸' },
                    { key: 'showKorean', label: '한글', icon: '🇰🇷' },
                    { key: 'showExplanation', label: '해설', icon: '💡' },
                    { key: 'showPronunciation', label: '발음', icon: '🔊' }
                  ].map(option => (
                    <label key={option.key} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={repeatSetting[option.key as keyof RepeatSettings] as boolean}
                        onChange={(e) => onRepeatSettingsChange(index, {
                          [option.key]: e.target.checked
                        })}
                        className="w-3 h-3"
                      />
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>

                {/* 일시정지 시간 */}
                <div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.5"
                    value={repeatSetting.pauseAfter}
                    onChange={(e) => onRepeatSettingsChange(index, { 
                      pauseAfter: parseFloat(e.target.value) 
                    })}
                    className="w-full h-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 글로벌 옵션 */}
        <div>
          <label className="block text-sm font-medium mb-2">🌟 글로벌 옵션</label>
          <div className="space-y-2">
            {[
              { key: 'fadeInOut', label: '페이드 인/아웃', icon: '🌅' },
              { key: 'backgroundBlur', label: '배경 블러', icon: '🌫️' },
              { key: 'showProgress', label: '진행률 표시', icon: '📊' }
            ].map(option => (
              <label key={option.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.globalOptions[option.key as keyof typeof settings.globalOptions]}
                  onChange={(e) => onSettingsChange({
                    globalOptions: {
                      ...settings.globalOptions,
                      [option.key]: e.target.checked
                    }
                  })}
                  className="w-4 h-4"
                />
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 폰트 설정 */}
        <div>
          <label className="block text-sm font-medium mb-3">🎨 폰트 설정</label>
          <div className="space-y-4">
            {/* 폰트 크기 */}
            <div>
              <label className="block text-xs font-medium mb-1">크기</label>
              <input
                type="range"
                min="24"
                max="120"
                value={settings.fontSettings.size}
                onChange={(e) => onSettingsChange({
                  fontSettings: {
                    ...settings.fontSettings,
                    size: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-xs text-gray-600 mt-1">{settings.fontSettings.size}px</div>
            </div>

            {/* 폰트 색상 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">텍스트 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.fontSettings.color}
                    onChange={(e) => onSettingsChange({
                      fontSettings: {
                        ...settings.fontSettings,
                        color: e.target.value
                      }
                    })}
                    className="w-8 h-8 rounded border"
                  />
                  <input
                    type="text"
                    value={settings.fontSettings.color}
                    onChange={(e) => onSettingsChange({
                      fontSettings: {
                        ...settings.fontSettings,
                        color: e.target.value
                      }
                    })}
                    className="flex-1 px-2 py-1 text-xs border rounded"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">테두리 색상</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.fontSettings.strokeColor}
                    onChange={(e) => onSettingsChange({
                      fontSettings: {
                        ...settings.fontSettings,
                        strokeColor: e.target.value
                      }
                    })}
                    className="w-8 h-8 rounded border"
                  />
                  <input
                    type="text"
                    value={settings.fontSettings.strokeColor}
                    onChange={(e) => onSettingsChange({
                      fontSettings: {
                        ...settings.fontSettings,
                        strokeColor: e.target.value
                      }
                    })}
                    className="flex-1 px-2 py-1 text-xs border rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* 테두리 두께 */}
            <div>
              <label className="block text-xs font-medium mb-1">테두리 두께</label>
              <input
                type="range"
                min="0"
                max="5"
                value={settings.fontSettings.strokeWidth}
                onChange={(e) => onSettingsChange({
                  fontSettings: {
                    ...settings.fontSettings,
                    strokeWidth: parseInt(e.target.value)
                  }
                })}
                className="w-full h-1"
              />
              <div className="text-center text-xs text-gray-600 mt-1">{settings.fontSettings.strokeWidth}px</div>
            </div>

            {/* 폰트 패밀리 - Noto Sans KR 고정 */}
            <div>
              <label className="block text-xs font-medium mb-1">폰트</label>
              <div className="w-full px-2 py-1 text-xs border rounded bg-gray-50 text-gray-700">
                Noto Sans KR (고정)
              </div>
            </div>

            {/* 폰트 미리보기 */}
            <div className="border rounded p-3 bg-black text-center">
              <div 
                style={{
                  color: settings.fontSettings.color,
                  fontSize: `${Math.min(settings.fontSettings.size / 4, 20)}px`,
                  fontFamily: settings.fontSettings.fontFamily,
                  textShadow: `1px 1px 0 ${settings.fontSettings.strokeColor}, -1px -1px 0 ${settings.fontSettings.strokeColor}, 1px -1px 0 ${settings.fontSettings.strokeColor}, -1px 1px 0 ${settings.fontSettings.strokeColor}`
                }}
              >
                Sample Text 샘플 텍스트
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
