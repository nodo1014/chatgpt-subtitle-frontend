import V3WorkspaceManager from '@/components/V3WorkspaceManager';
import AppLayout from '@/components/layout/AppLayout';

export default function V3Page() {
  return (
    <AppLayout 
      title="v3 DB 관리 툴" 
      subtitle="작업파일명 기반 자막 관리 시스템"
      icon="🚀"
    >
      <V3WorkspaceManager />
    </AppLayout>
  );
}

export const metadata = {
  title: 'v3 DB 관리 툴 - 작업파일 기반 자막 관리',
  description: 'v3.md 기획에 따른 작업파일명 기반 자막 관리 시스템',
};
