// Shared render job store
// This should be replaced with Redis or database in production

export interface RenderJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  workspace_id: string;
  template_id: string;
  clips: any[];
  options: any;
  output_path?: string;
  error?: string;
  created_at: Date;
  completed_at?: Date;
}

// Global render jobs store
const renderJobs = new Map<string, RenderJob>();

export class RenderJobStore {
  static set(jobId: string, job: RenderJob) {
    renderJobs.set(jobId, job);
  }

  static get(jobId: string): RenderJob | undefined {
    return renderJobs.get(jobId);
  }

  static delete(jobId: string): boolean {
    return renderJobs.delete(jobId);
  }

  static getAll(): RenderJob[] {
    return Array.from(renderJobs.values());
  }

  static clear() {
    renderJobs.clear();
  }
}
