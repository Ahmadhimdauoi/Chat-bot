// Fix: The original content of this file was invalid. It has been replaced with a complete and functional React application for a PDF-based chat interface.
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Correct import for GoogleGenAI.
import { GoogleGenAI } from '@google/genai';

// --- Type Definitions (formerly types.ts) ---
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Gemini API Service (formerly services/geminiService.ts) ---
// Fix: Use a supported model name, 'gemini-2.5-flash'. 'gemini-1.5-flash' is prohibited.
const MODEL_NAME = 'gemini-2.5-flash';

async function generateContentWithGemini(prompt: string, fileData?: { mimeType: string; data: string }): Promise<string> {
  try {
    // Fix: Initialize GoogleGenAI with a named apiKey parameter from process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const request = {
      model: MODEL_NAME,
      contents: fileData
        ? { parts: [{ text: prompt }, { inlineData: { data: fileData.data, mimeType: fileData.mimeType } }] }
        : prompt,
    };

    // Fix: Use ai.models.generateContent for API calls, which is the correct and current method.
    const response = await ai.models.generateContent(request);
    
    // Fix: Directly access the 'text' property from the response for the generated content.
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

// --- File Utility (formerly utils/fileUtils.ts) ---
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const result = reader.result.split(',')[1];
        resolve(result);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

// --- UI Components (formerly components folder) ---
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const LoadingSpinner = () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            animation: 'spin 1s linear infinite'
        }}></div>
    </div>
);

interface PdfUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  clearFile: () => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onFileSelect, selectedFile, clearFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (selectedFile) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f0f0f0' }}>
            <FileIcon />
            <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
            <button onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', padding: '0 4px', fontSize: '1.2em' }}>&times;</button>
        </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="application/pdf"
      />
      <button onClick={handleUploadClick} title="Upload PDF" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
        <UploadIcon />
      </button>
    </>
  );
};

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '10px'
    }}>
      <div style={{
        backgroundColor: isUser ? '#dcf8c6' : '#fff',
        padding: '10px',
        borderRadius: '10px',
        maxWidth: '70%',
        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}>
        {message.text}
      </div>
    </div>
  );
};

// --- Main App Component (formerly App.tsx and ChatWindow.tsx) ---
const App = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMessageText = input.trim();
    const userMessage: ChatMessage = { role: 'user', text: userMessageText || `Analyzing file: ${selectedFile?.name}` };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    let fileData: { mimeType: string, data: string } | undefined;
    let prompt = userMessageText;
    const currentFile = selectedFile;
    setSelectedFile(null); // Clear file from UI immediately

    if (currentFile) {
        try {
            const base64Data = await fileToBase64(currentFile);
            fileData = { mimeType: currentFile.type, data: base64Data };
            if (!prompt) {
                prompt = "Summarize this document.";
            }
        } catch (error) {
            console.error("Error processing file:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I couldn't process the file." };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }
    }

    try {
        const aiResponse = await generateContentWithGemini(prompt, fileData);
        const modelMessage: ChatMessage = { role: 'model', text: aiResponse };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error("Failed to get response from AI", error);
        const errorMessage: ChatMessage = { role: 'model', text: "Sorry, something went wrong with the AI." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <div style={{ width: '100%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <header style={{ padding: '16px', borderBottom: '1px solid #ccc', fontWeight: 'bold', backgroundColor: '#f7f7f7', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
          Gemini PDF Chat
        </header>
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#e5ddd5' }}>
            {messages.map((msg, index) => (
                <ChatMessageComponent key={index} message={msg} />
            ))}
            {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '10px', maxWidth: '70%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                        <LoadingSpinner />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </main>
        <footer style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
          <PdfUploader 
            onFileSelect={setSelectedFile} 
            selectedFile={selectedFile}
            clearFile={() => setSelectedFile(null)}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '20px', marginRight: '8px', outline: 'none' }}
            disabled={isLoading}
          />
          <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !selectedFile)} style={{ padding: '8px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
            <SendIcon />
          </button>
        </footer>
      </div>
    </div>
  );
};

// --- React App Entry Point ---
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);