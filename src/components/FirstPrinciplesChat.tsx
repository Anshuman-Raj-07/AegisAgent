import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, HelpCircle, MessageSquare } from 'lucide-react';
import { callGemini } from '../services/agentRunner';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

interface FirstPrinciplesChatProps {
  code: string;
  spec: string;
  scenarioQa: { id: string; question: string; answer: string; category: string }[];
  apiKey: string;
}

export const FirstPrinciplesChat: React.FC<FirstPrinciplesChatProps> = ({
  code,
  spec,
  scenarioQa,
  apiKey
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'agent', 
      text: 'I have generated and verified the implementation. Feel free to challenge my architectural choices, Big-O complexity, or safety boundaries.' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setIsTyping(true);

    try {
      // Check if it's a pre-baked question
      const mockMatch = scenarioQa.find(q => q.question.toLowerCase() === text.toLowerCase());
      
      if (mockMatch) {
        // Simulate thinking for a bit
        await new Promise(resolve => setTimeout(resolve, 800));
        setMessages(prev => [...prev, { sender: 'agent', text: mockMatch.answer }]);
      } else if (apiKey) {
        // Live mode
        const systemPrompt = `You are a Senior Software Engineer defending your code in a technical interview. 
The interviewer is grilling you about your code design choices. Explain and justify your decisions using strict first-principles engineering concepts.
Keep your response concise (under 250 words), focused, and highly technical.

CODE UNDER DISCUSSION:
\`\`\`javascript
${code}
\`\`\`

SPECIFICATION:
${spec}`;

        const answer = await callGemini(apiKey, text, systemPrompt);
        setMessages(prev => [...prev, { sender: 'agent', text: answer }]);
      } else {
        // Mock mode custom question fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMessages(prev => [
          ...prev, 
          { 
            sender: 'agent', 
            text: `I am currently running in Showcase Mode. To submit custom questions, please add your Google Gemini API Key in the settings dialog (⚙ top-right) and run a live workflow. Alternatively, feel free to ask me one of the pre-baked architectural challenges above!` 
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'agent', text: `Failed to fetch response: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg-primary)'
    }}>
      {/* Question Templates Sidebar/Header */}
      <div style={{
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          <HelpCircle size={14} color="var(--primary)" />
          Challenge the Agent's Decisions
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {scenarioQa.map(qa => (
            <button
              key={qa.id}
              onClick={() => handleSendMessage(qa.question)}
              disabled={isTyping}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              className="qa-template-chip"
            >
              <MessageSquare size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {qa.question}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Panel */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            style={{
              display: 'flex',
              gap: '10px',
              maxWidth: '85%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: msg.sender === 'user' ? 'var(--primary-glow)' : 'var(--purple-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: msg.sender === 'user' ? 'var(--primary)' : 'var(--purple)',
              border: '1px solid',
              borderColor: msg.sender === 'user' ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
              flexShrink: 0
            }}>
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.5',
              background: msg.sender === 'user' ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              borderColor: msg.sender === 'user' ? 'rgba(255, 255, 255, 0.08)' : 'var(--border-color)',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--purple-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--purple)',
              border: '1px solid rgba(139,92,246,0.2)'
            }}>
              <Bot size={14} />
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span className="terminal-cursor" style={{ margin: 0, width: '6px', height: '12px' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Agent formulating defense...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isTyping}
          placeholder="Ask why a specific pattern or algorithm was used..."
          style={{
            flex: 1,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={isTyping || !inputText.trim()}
          className="btn btn-primary"
          style={{ padding: '8px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};
