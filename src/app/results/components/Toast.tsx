'use client';

interface ToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export default function Toast({ show, message, onClose }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-lg shadow-lg border border-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          <span className="font-medium">{message}</span>
          <button 
            onClick={onClose}
            className="ml-2 text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
