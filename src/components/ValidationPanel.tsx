import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Cpu, 
  Shield, 
  Zap,
  Lock
} from 'lucide-react';
import type { ValidationReport } from '../services/agentRunner';

interface ValidationPanelProps {
  report: ValidationReport | null;
  scenarioChecklist: any[];
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ 
  report, 
  scenarioChecklist 
}) => {
  if (!report) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '24px',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ fontSize: '14px' }}>No execution trace found.</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Run Agent Workflow" to compile code and perform evaluations.</p>
      </div>
    );
  }

  const { success, assertions, durationMs, ast, score, checklistResults } = report;

  // Complexity Grade
  const getComplexityGrade = (val: number) => {
    if (val <= 6) return { label: 'Optimal', color: 'var(--success)' };
    if (val <= 12) return { label: 'Moderate', color: 'var(--warning)' };
    return { label: 'High Risk', color: 'var(--danger)' };
  };

  const cyclomaticGrade = getComplexityGrade(ast.cyclomaticComplexity);

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Header Dashboard Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        {/* Score Card */}
        <div className="glass-panel" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Quality Score
          </span>
          <div style={{
            fontSize: '36px',
            fontWeight: 800,
            color: success ? 'var(--success)' : 'var(--warning)',
            margin: '8px 0',
            textShadow: success ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
            {score}%
          </div>
          <span className={`badge ${success ? 'badge-success' : 'badge-danger'}`}>
            {success ? 'Passed QA Gate' : 'Failed QA Gate'}
          </span>
        </div>

        {/* Exec Timer */}
        <div className="glass-panel" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Execution Time
          </span>
          <div style={{
            fontSize: '36px',
            fontWeight: 800,
            color: 'var(--info)',
            margin: '8px 0',
            textShadow: '0 0 15px rgba(6, 182, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Zap size={24} color="var(--info)" />
            {durationMs} <span style={{ fontSize: '16px', fontWeight: 500 }}>ms</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Sandbox compile & runtime
          </span>
        </div>
      </div>

      {/* Unit Tests Output */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <Shield size={14} color="var(--primary)" />
          Test Assertion Harness ({assertions.filter(a => a.passed).length}/{assertions.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assertions.map((assertion, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px',
                background: 'rgba(255,255,255,0.01)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              {assertion.passed ? (
                <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
              ) : (
                <XCircle size={16} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}>
                  {assertion.description}
                </span>
                {assertion.message && !assertion.passed && (
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--danger)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {assertion.message}
                  </span>
                )}
                {assertion.error && (
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--danger)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Runtime Error: {assertion.error}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Metrics (AST) */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <Cpu size={14} color="var(--purple)" />
          AST Code Quality Analytics
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cyclomatic Complexity</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: cyclomaticGrade.color }}>
              {ast.cyclomaticComplexity} 
              <span style={{ fontSize: '11px', fontWeight: 500, marginLeft: '6px', opacity: 0.8 }}>
                ({cyclomaticGrade.label})
              </span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.01)',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cognitive Complexity</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {ast.cognitiveComplexity}
            </div>
          </div>
        </div>

        {/* Comment Density & nesting */}
        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Comment Density ({Math.round((ast.commentLines / (ast.linesOfCode + ast.commentLines || 1)) * 100)}%)</span>
              <span>{ast.commentLines} / {ast.linesOfCode + ast.commentLines} lines</span>
            </div>
            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
              <div style={{ 
                height: '100%', 
                background: 'var(--purple)', 
                width: `${(ast.commentLines / (ast.linesOfCode + ast.commentLines || 1)) * 100}%`,
                borderRadius: '2px'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Maximum Nesting Depth</span>
            <span style={{ fontWeight: 600, color: ast.maxNestingDepth > 3 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {ast.maxNestingDepth} (limit: 4)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Functions Count</span>
            <span style={{ fontWeight: 600 }}>{ast.functionsCount}</span>
          </div>
        </div>

        {/* Banned patterns / Security audits */}
        {ast.bannedPatterns.length > 0 ? (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>
              Governance Security Warnings
            </div>
            {ast.bannedPatterns.map((warning, i) => (
              <div key={i} style={{ fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                ⚠ {warning}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            marginTop: '12px',
            padding: '8px 10px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--success)',
            fontWeight: 500
          }}>
            ✓ Clean Governance Scan: Zero banned statement tags detected.
          </div>
        )}
      </div>

      {/* Compliance Checklist */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <h4 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <Lock size={14} color="var(--warning)" />
          AI compliance checklists
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scenarioChecklist.map(chk => {
            const chkResult = checklistResults.find(r => r.id === chk.id);
            const passed = chkResult ? chkResult.passed : false;

            return (
              <div 
                key={chk.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}
              >
                {passed ? (
                  <span style={{ color: 'var(--success)', fontWeight: 800 }}>✓</span>
                ) : (
                  <span style={{ color: 'var(--danger)', fontWeight: 800 }}>✗</span>
                )}
                <div>
                  <div style={{ fontWeight: 600, color: passed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {chk.rule}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {chk.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
