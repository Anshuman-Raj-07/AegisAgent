import React from 'react';
import { 
  FileText, 
  Cpu, 
  Code2, 
  ShieldCheck, 
  Play, 
  ClipboardCheck, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface AgentGraphProps {
  currentStage: 'idle' | 'architect' | 'developer' | 'tester' | 'executor' | 'validator' | 'complete';
}

export const AgentGraph: React.FC<AgentGraphProps> = ({ currentStage }) => {
  const stages = [
    { id: 'spec', label: 'Spec Input', icon: FileText, desc: 'Requirements' },
    { id: 'architect', label: 'Architect', icon: Cpu, desc: 'Structure & MCP Plan' },
    { id: 'developer', label: 'Developer', icon: Code2, desc: 'Source Code' },
    { id: 'tester', label: 'Tester', icon: ShieldCheck, desc: 'Test Suite' },
    { id: 'executor', label: 'Sandbox', icon: Play, desc: 'Browser Runner' },
    { id: 'validator', label: 'Validator', icon: ClipboardCheck, desc: 'AST & Quality' }
  ];

  const getStageStatus = (stageId: string) => {
    if (currentStage === 'idle') {
      return stageId === 'spec' ? 'completed' : 'idle';
    }
    if (currentStage === 'complete') return 'completed';
    
    const stageOrder = ['spec', 'architect', 'developer', 'tester', 'executor', 'validator'];
    const stageIndex = stageOrder.indexOf(stageId);
    const currentIndex = stageOrder.indexOf(currentStage);

    if (stageIndex === currentIndex) return 'active';
    if (stageIndex < currentIndex) return 'completed';
    return 'idle';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      margin: '12px 0',
      background: 'rgba(12, 14, 20, 0.4)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      overflowX: 'auto',
      gap: '8px'
    }}>
      {stages.map((stage, idx) => {
        const status = getStageStatus(stage.id);
        const IconComponent = stage.icon;

        return (
          <React.Fragment key={stage.id}>
            {/* Stage Node */}
            <div 
              className={`agent-node ${status === 'active' ? 'active' : ''} ${status === 'completed' ? 'completed' : ''}`}
              style={{
                flex: '1',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: status === 'active' 
                  ? 'var(--primary)' 
                  : status === 'completed' 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'var(--border-color)',
                background: status === 'active' 
                  ? 'rgba(59, 130, 246, 0.05)' 
                  : status === 'completed' 
                    ? 'rgba(16, 185, 129, 0.02)' 
                    : 'transparent',
                minWidth: '150px',
                opacity: status === 'idle' ? 0.4 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {status === 'active' && <div className="node-pulse" />}
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: status === 'active' 
                  ? 'var(--primary-glow)' 
                  : status === 'completed' 
                    ? 'var(--success-glow)' 
                    : 'rgba(255, 255, 255, 0.03)',
                color: status === 'active' 
                  ? 'var(--primary)' 
                  : status === 'completed' 
                    ? 'var(--success)' 
                    : 'var(--text-secondary)',
              }}>
                <IconComponent size={18} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: status === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  {stage.label}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {stage.desc}
                </span>
              </div>

              {status === 'completed' && (
                <div style={{ marginLeft: 'auto', color: 'var(--success)' }}>
                  <CheckCircle2 size={14} />
                </div>
              )}
            </div>

            {/* Connection Arrow */}
            {idx < stages.length - 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: status === 'completed' ? 'var(--success)' : 'var(--border-color)',
                opacity: status === 'idle' ? 0.3 : 1,
                padding: '0 4px'
              }}>
                <ArrowRight size={16} style={{
                  animation: status === 'active' ? 'pulse-arrow 1.5s infinite' : 'none'
                }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
