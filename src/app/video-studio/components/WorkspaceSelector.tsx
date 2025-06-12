import { Workspace } from '../types';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspace: string;
  onWorkspaceChange: (workspaceId: string) => void;
}

export default function WorkspaceSelector({ 
  workspaces, 
  selectedWorkspace, 
  onWorkspaceChange 
}: WorkspaceSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        📁 워크스페이스
      </h2>
      <select
        value={selectedWorkspace}
        onChange={(e) => onWorkspaceChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">선택하세요</option>
        {workspaces.map(workspace => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name} ({workspace.clip_count}개)
          </option>
        ))}
      </select>
    </div>
  );
}