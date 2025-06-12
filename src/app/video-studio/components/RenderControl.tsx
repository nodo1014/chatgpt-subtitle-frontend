interface RenderControlProps {
  isRendering: boolean;
  renderProgress: number;
  canRender: boolean;
  onRender: () => void;
}

export default function RenderControl({ 
  isRendering, 
  renderProgress, 
  canRender, 
  onRender 
}: RenderControlProps) {
  return (
    <button
      onClick={onRender}
      disabled={isRendering || !canRender}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
    >
      {isRendering ? `렌더링 중... ${renderProgress}%` : '🎬 렌더링 시작'}
    </button>
  );
}
