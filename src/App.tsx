import { useState, useEffect } from 'react';
import { 
  Play, 
  RefreshCw, 
  Settings, 
  Terminal, 
  ShieldCheck, 
  MessageSquare, 
  Info
} from 'lucide-react';
import { scenarios } from './services/mockData';
import type { Scenario } from './services/mockData';
import { runSandbox, runLiveAgentWorkflow } from './services/agentRunner';
import type { ValidationReport } from './services/agentRunner';
import { AgentGraph } from './components/AgentGraph';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { FirstPrinciplesChat } from './components/FirstPrinciplesChat';

export default function App() {
  // Scenarios & State
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [workspaceFiles, setWorkspaceFiles] = useState<{ [path: string]: string }>({});
  const [selectedFile, setSelectedFile] = useState<string>('spec.md');
  const [currentStage, setCurrentStage] = useState<'idle' | 'architect' | 'developer' | 'tester' | 'executor' | 'validator' | 'complete'>('idle');
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'validator' | 'chat' | 'console'>('console');
  
  // Settings & Keys
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aegisagent_gemini_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  
  // Exec logs & Validation
  const [consoleLogs, setConsoleLogs] = useState<{ time: string; stage: string; msg: string; details?: string }[]>([]);
  const [report, setReport] = useState<ValidationReport | null>(null);

  // Initialize workspace files on scenario switch
  useEffect(() => {
    setWorkspaceFiles({
      'spec.md': selectedScenario.spec,
      'src/index.js': '',
      'tests/index.test.js': '',
      'logs/mcp-trace.json': '{\n  "status": "awaiting_generation"\n}'
    });
    setSelectedFile('spec.md');
    setCurrentStage('idle');
    setConsoleLogs([]);
    setReport(null);
    setActiveTab('console');
  }, [selectedScenario]);

  // Run the multi-agent workflow (Mock or Live)
  const runWorkflow = async () => {
    if (isWorkflowRunning) return;
    setIsWorkflowRunning(true);
    setConsoleLogs([]);
    setReport(null);
    setActiveTab('console');

    // 1. Initial State
    setConsoleLogs(prev => [
      ...prev, 
      { time: new Date().toLocaleTimeString(), stage: 'System', msg: `Initializing generation context in ${apiKey ? 'Live Gemini mode' : 'Demo mode'}...` }
    ]);

    if (apiKey) {
      // LIVE GEMINI PIPELINE
      try {
        const generatedFiles = await runLiveAgentWorkflow(
          apiKey, 
          selectedScenario.spec, 
          (log) => {
            setCurrentStage(log.stage);
            setConsoleLogs(prev => [
              ...prev,
              { 
                time: new Date().toLocaleTimeString(), 
                stage: log.stage.toUpperCase(), 
                msg: log.message, 
                details: log.details 
              }
            ]);
          }
        );

        // Update files in workspace
        const finalFiles = {
          'spec.md': selectedScenario.spec,
          'src/index.js': generatedFiles['src/index.js'],
          'tests/index.test.js': generatedFiles['tests/index.test.js'],
          'logs/mcp-trace.json': JSON.stringify({
            engine: 'Gemini-3.5-Flash',
            timestamp: new Date().toISOString(),
            toolCalls: [
              { tool: 'read_spec', args: { path: 'spec.md' } },
              { tool: 'write_file', args: { path: 'src/index.js' } },
              { tool: 'write_file', args: { path: 'tests/index.test.js' } }
            ]
          }, null, 2)
        };

        setWorkspaceFiles(finalFiles);
        setSelectedFile('src/index.js');

        // Sandbox execution phase
        setCurrentStage('executor');
        setConsoleLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'SANDBOX', msg: 'Executing developer code against synthesized assertions...' }]);
        await new Promise(r => setTimeout(r, 600));

        const evaluation = runSandbox(finalFiles['src/index.js'], finalFiles['tests/index.test.js'], selectedScenario.checklist);
        
        setCurrentStage('validator');
        setConsoleLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'VALIDATOR', msg: 'Running static inspections and compliance score calculation...' }]);
        await new Promise(r => setTimeout(r, 600));

        setReport(evaluation);
        setCurrentStage('complete');
        setActiveTab('validator');

        setConsoleLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'SYSTEM', msg: `Agentic execution validation finished with score: ${evaluation.score}%` }]);
      } catch (err: any) {
        setConsoleLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'SYSTEM', msg: `Execution crashed: ${err.message}` }]);
        setCurrentStage('idle');
      } finally {
        setIsWorkflowRunning(false);
      }
    } else {
      // MOCK PIPELINE
      try {
        const demoStages = selectedScenario.logs;
        for (const item of demoStages) {
          setCurrentStage(item.stage);
          setConsoleLogs(prev => [
            ...prev,
            { 
              time: item.timestamp || new Date().toLocaleTimeString(), 
              stage: item.stage.toUpperCase(), 
              msg: item.message, 
              details: item.details 
            }
          ]);

          // Incrementally load mock file code outputs to simulate writing
          if (item.stage === 'developer') {
            setWorkspaceFiles(prev => ({
              ...prev,
              'src/index.js': selectedScenario.files['src/index.js']
            }));
          }
          if (item.stage === 'tester') {
            setWorkspaceFiles(prev => ({
              ...prev,
              'tests/index.test.js': selectedScenario.files['tests/index.test.js']
            }));
            setWorkspaceFiles(prev => ({
              ...prev,
              'logs/mcp-trace.json': JSON.stringify({
                engine: 'AegisAgent-Simulated-Agent',
                timestamp: new Date().toISOString(),
                toolCalls: [
                  { tool: 'read_spec', args: { path: 'spec.md' } },
                  { tool: 'write_file', args: { path: 'src/index.js' } },
                  { tool: 'write_file', args: { path: 'tests/index.test.js' } }
                ]
              }, null, 2)
            }));
          }

          // Delay to make visual nodes look active
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Run validation sandbox locally
        const evaluation = runSandbox(
          selectedScenario.files['src/index.js'], 
          selectedScenario.files['tests/index.test.js'], 
          selectedScenario.checklist
        );

        setReport(evaluation);
        setCurrentStage('complete');
        setActiveTab('validator');
      } catch (err: any) {
        setConsoleLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'SYSTEM', msg: `Simulation error: ${err.message}` }]);
      } finally {
        setIsWorkflowRunning(false);
      }
    }
  };

  // Re-run sandbox when the developer edits files manually
  const runCustomTests = () => {
    if (!workspaceFiles['src/index.js'] || !workspaceFiles['tests/index.test.js']) return;
    
    setConsoleLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), stage: 'MANUAL', msg: 'Developer triggered code rebuild. Re-executing assertions...' }
    ]);
    
    const evaluation = runSandbox(
      workspaceFiles['src/index.js'],
      workspaceFiles['tests/index.test.js'],
      selectedScenario.checklist
    );

    setReport(evaluation);
    setActiveTab('validator');
    setConsoleLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), stage: 'MANUAL', msg: `Re-run assertions complete. New score: ${evaluation.score}%` }
    ]);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('aegisagent_gemini_key', key);
    setShowSettings(false);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header style={{
        height: 'var(--header-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10
      }}>
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--primary)',
            color: '#fff',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 0 10px var(--primary-glow)'
          }}>
            AA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em' }}>
              AEGISAGENT
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              AI-Native Sandbox & Quality Gate
            </span>
          </div>
        </div>

        {/* Workspace Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Select Problem Spec */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Spec:</span>
            <select
              value={selectedScenario.id}
              onChange={(e) => setSelectedScenario(scenarios.find(s => s.id === e.target.value) || scenarios[0])}
              disabled={isWorkflowRunning}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Generate Agent Pipeline */}
          <button 
            className="btn btn-primary"
            onClick={runWorkflow}
            disabled={isWorkflowRunning}
          >
            <Play size={14} fill="currentColor" />
            <span>{isWorkflowRunning ? 'Executing Agents...' : 'Run Agent Workflow'}</span>
          </button>

          {/* Re-run Local Tests */}
          <button 
            className="btn"
            onClick={runCustomTests}
            disabled={isWorkflowRunning || !workspaceFiles['src/index.js']}
          >
            <RefreshCw size={14} />
            <span>Re-run Tests</span>
          </button>

          {/* Config Settings */}
          <button 
            className="btn" 
            style={{ padding: '8px' }}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '0 24px 20px 24px',
        overflow: 'hidden'
      }}>
        {/* Node Graph Visualizer */}
        <AgentGraph currentStage={currentStage} />

        {/* Split Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'var(--sidebar-width) minmax(0, 1fr) 420px',
          flex: 1,
          gap: '16px',
          overflow: 'hidden'
        }}>
          {/* File Browser Sidebar */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <FileExplorer 
              files={workspaceFiles} 
              selectedFile={selectedFile} 
              onSelectFile={(f) => setSelectedFile(f)} 
            />
          </div>

          {/* Editor Center Container */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <CodeEditor
              fileName={selectedFile}
              code={workspaceFiles[selectedFile] || ''}
              onChangeCode={(newCode) => {
                setWorkspaceFiles(prev => ({
                  ...prev,
                  [selectedFile]: newCode
                }));
              }}
              onSave={runCustomTests}
              readOnly={selectedFile === 'spec.md' || selectedFile.endsWith('.json') || isWorkflowRunning}
            />
          </div>

          {/* Evaluation & QA Panels Right */}
          <div className="glass-panel" style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Tab Control */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              height: '40px'
            }}>
              <button 
                onClick={() => setActiveTab('console')}
                style={{
                  flex: 1,
                  background: activeTab === 'console' ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'console' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'console' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Terminal size={12} />
                Agent Console
              </button>
              <button 
                onClick={() => setActiveTab('validator')}
                style={{
                  flex: 1,
                  background: activeTab === 'validator' ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'validator' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'validator' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={12} />
                Validation Gate
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                style={{
                  flex: 1,
                  background: activeTab === 'chat' ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'chat' ? '2px solid var(--primary)' : 'none',
                  color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <MessageSquare size={12} />
                First-Principles QA
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {activeTab === 'console' && (
                <div style={{
                  height: '100%',
                  overflowY: 'auto',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {consoleLogs.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-muted)',
                      textAlign: 'center'
                    }}>
                      <Terminal size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>Agent event streams will print here.</p>
                    </div>
                  ) : (
                    consoleLogs.map((log, index) => (
                      <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>[{log.time}]</span>
                          <span style={{ 
                            color: log.stage === 'SYSTEM' || log.stage === 'System' 
                              ? 'var(--info)' 
                              : log.stage === 'ARCHITECT' 
                                ? 'var(--primary)' 
                                : log.stage === 'DEVELOPER' 
                                  ? 'var(--purple)' 
                                  : log.stage === 'TESTER' 
                                    ? 'var(--warning)' 
                                    : 'var(--success)', 
                            fontWeight: 700 
                          }}>
                            {log.stage}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>{log.msg}</div>
                        {log.details && (
                          <pre style={{
                            marginTop: '6px',
                            padding: '8px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '150px',
                            overflowY: 'auto'
                          }}>
                            {log.details}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'validator' && (
                <ValidationPanel report={report} scenarioChecklist={selectedScenario.checklist} />
              )}

              {activeTab === 'chat' && (
                <FirstPrinciplesChat
                  code={workspaceFiles['src/index.js'] || ''}
                  spec={selectedScenario.spec}
                  scenarioQa={selectedScenario.qa}
                  apiKey={apiKey}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{
            width: '400px',
            padding: '24px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Orchestrator Settings</h3>
            
            <div style={{
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              display: 'flex',
              gap: '8px'
            }}>
              <Info size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                Add your Gemini API Key below to run <strong>Live Mode</strong>. If empty, AegisAgent runs high-fidelity mock cycles.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Google Gemini API Key</label>
              <input
                type="password"
                defaultValue={apiKey}
                placeholder="AIzaSy..."
                id="apiKeyInput"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button 
                className="btn" 
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const input = document.getElementById('apiKeyInput') as HTMLInputElement;
                  handleSaveApiKey(input.value);
                }}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
