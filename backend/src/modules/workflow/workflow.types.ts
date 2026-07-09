export interface WorkflowLogDomain {
  id: string;
  sessionId: string;
  stepName?: string;
  nodeName?: string;
  message: string;
  status?: string;
  timestamp: string;
}

export interface AIMessageDomain {
  id: string;
  sessionId: string;
  type: string;
  message: string;
  metadata?: string;
  timestamp: string;
}
