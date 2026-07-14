import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  FileCode, 
  FileJson,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface FileExplorerProps {
  files: { [path: string]: string };
  selectedFile: string;
  onSelectFile: (path: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  selectedFile, 
  onSelectFile 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({
    'src': true,
    'tests': true,
    'logs': true
  });

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const getFileIcon = (filePath: string) => {
    if (filePath.endsWith('.md')) return <FileText size={14} color="#38bdf8" />;
    if (filePath.endsWith('.js')) return <FileCode size={14} color="#fbbf24" />;
    if (filePath.endsWith('.json')) return <FileJson size={14} color="#f472b6" />;
    return <FileText size={14} color="#94a3b8" />;
  };

  // Group files into standard folder structure
  const folders: { [key: string]: string[] } = {};
  const rootFiles: string[] = [];

  Object.keys(files).forEach(filePath => {
    if (filePath.includes('/')) {
      const parts = filePath.split('/');
      const folderName = parts[0];
      if (!folders[folderName]) {
        folders[folderName] = [];
      }
      folders[folderName].push(filePath);
    } else {
      rootFiles.push(filePath);
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      userSelect: 'none'
    }}>
      {/* Explorer Header */}
      <div style={{
        padding: '12px 16px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        Workspace Files
      </div>

      {/* Directory Tree */}
      <div style={{
        flex: 1,
        padding: '12px 8px',
        overflowY: 'auto',
        fontSize: '13px'
      }}>
        {/* Root Files */}
        {rootFiles.map(filePath => (
          <div 
            key={filePath}
            onClick={() => onSelectFile(filePath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              color: selectedFile === filePath ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: selectedFile === filePath ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              fontWeight: selectedFile === filePath ? 600 : 400,
              transition: 'background 0.15s ease'
            }}
          >
            {getFileIcon(filePath)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filePath}
            </span>
          </div>
        ))}

        {/* Folders */}
        {Object.keys(folders).map(folderName => {
          const isExpanded = !!expandedFolders[folderName];
          return (
            <div key={folderName} style={{ marginTop: '4px' }}>
              {/* Folder Row */}
              <div 
                onClick={() => toggleFolder(folderName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  transition: 'background 0.15s ease'
                }}
              >
                {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                {isExpanded ? <FolderOpen size={14} color="#60a5fa" /> : <Folder size={14} color="#60a5fa" />}
                <span style={{ fontSize: '13px' }}>{folderName}</span>
              </div>

              {/* Folder Children */}
              {isExpanded && (
                <div style={{ paddingLeft: '20px' }}>
                  {folders[folderName].map(filePath => {
                    const fileName = filePath.split('/').slice(1).join('/');
                    return (
                      <div 
                        key={filePath}
                        onClick={() => onSelectFile(filePath)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: selectedFile === filePath ? 'var(--text-primary)' : 'var(--text-secondary)',
                          background: selectedFile === filePath ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                          fontWeight: selectedFile === filePath ? 600 : 400,
                          transition: 'background 0.15s ease',
                          marginTop: '2px'
                        }}
                      >
                        {getFileIcon(filePath)}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fileName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
