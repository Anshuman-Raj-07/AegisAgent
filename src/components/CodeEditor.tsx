import React, { useEffect, useState } from 'react';
import { Save, Lock, Edit3 } from 'lucide-react';

interface CodeEditorProps {
  fileName: string;
  code: string;
  onChangeCode: (newCode: string) => void;
  onSave: () => void;
  readOnly: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  fileName,
  code,
  onChangeCode,
  onSave,
  readOnly
}) => {
  const [localCode, setLocalCode] = useState(code);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalCode(e.target.value);
    onChangeCode(e.target.value);
  };

  const lineCount = localCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Editor Tab Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '40px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          fontWeight: 600
        }}>
          {readOnly ? <Lock size={12} color="var(--text-muted)" /> : <Edit3 size={12} color="var(--primary)" />}
          <span>{fileName}</span>
          {readOnly && (
            <span style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              Read-Only
            </span>
          )}
        </div>

        {!readOnly && (
          <button 
            onClick={onSave}
            className="btn btn-primary"
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              height: '28px'
            }}
          >
            <Save size={12} />
            <span>Apply & Run</span>
          </button>
        )}
      </div>

      {/* Editor Body */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Line Numbers */}
        <div style={{
          width: '45px',
          padding: '16px 8px',
          textAlign: 'right',
          color: 'var(--text-muted)',
          fontSize: '12px',
          background: 'rgba(12, 14, 20, 0.4)',
          borderRight: '1px solid var(--border-color)',
          userSelect: 'none',
          overflowY: 'hidden',
          lineHeight: '1.6'
        }}>
          {lineNumbers.map(num => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={localCode}
          onChange={handleChange}
          readOnly={readOnly}
          spellCheck={false}
          style={{
            flex: 1,
            padding: '16px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: '1.6',
            resize: 'none',
            whiteSpace: 'pre',
            overflow: 'auto',
            tabSize: 2
          }}
        />
      </div>
    </div>
  );
};
