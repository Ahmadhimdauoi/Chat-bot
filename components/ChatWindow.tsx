import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import type { ActiveFile } from '../App';
import ChatMessage from './ChatMessage';
import { SendIcon, DocumentIcon, BotIcon } from './icons';

interface ChatWindowProps {
  chatHistory: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  pdfFiles: File[];
  activeFile: ActiveFile;
  onFileSelect: (selection: ActiveFile) => void;
  onGoBack: () => void;
  chatGroupName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatHistory, isLoading, onSendMessage, pdfFiles, activeFile, onFileSelect, onGoBack, chatGroupName }) => {
  const [query, setQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSendMessage(query);
      setQuery('');
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'all') {
      onFileSelect('all');
    } else {
      const selectedFile = pdfFiles.find(f => f.name === selectedValue);
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    }
  }

  const getSelectValue = () => {
    if (activeFile === 'all') return 'all';
    return activeFile.name;
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-slate-700 bg-slate-800 gap-4">
            <div className="flex items-center">
                <DocumentIcon className="w-6 h-6 text-sky-400 ml-3"/>
                <h2 className="text-lg font-bold text-slate-200 truncate" title={chatGroupName}>
                  محادثة لمجموعة: {chatGroupName}
                </h2>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                value={getSelectValue()}
                onChange={handleSelectChange}
                disabled={pdfFiles.length === 0}
                className="w-full md:w-48 px-3 py-2 text-sm bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              >
                <option value="all">كل الملفات ({pdfFiles.length})</option>
                {pdfFiles.map(file => (
                  <option key={file.name} value={file.name}>{file.name}</option>
                ))}
              </select>
              <button
                onClick={onGoBack}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                العودة للمجموعات
              </button>
            </div>
        </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {chatHistory.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 my-4 justify-start">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
                    <BotIcon className="w-5 h-5 text-white" />
                 </div>
                 <div className="max-w-xl p-4 rounded-2xl bg-slate-700 rounded-bl-none flex items-center space-x-2 space-x-reverse">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                 </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اسأل أي شيء عن الملفات المحددة..."
            className="flex-1 w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-400"
            disabled={isLoading || pdfFiles.length === 0}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim() || pdfFiles.length === 0}
            className="p-3 bg-sky-600 rounded-full text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
