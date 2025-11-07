import React, { useState, useCallback } from 'react';
import type { ChatMessage, Group } from './types.ts';
import { getAnswerFromFiles } from './services/geminiService.ts';
import AdminDashboard from './components/AdminDashboard.tsx';
import ChatWindow from './components/ChatWindow.tsx';

// Define a type for the active file selection
export type ActiveFile = File | 'all';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
  const [tempApiKey, setTempApiKey] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeFile, setActiveFile] = useState<ActiveFile>('all');

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      localStorage.setItem('gemini-api-key', tempApiKey.trim());
      setApiKey(tempApiKey.trim());
    }
  };

  const handleAddGroup = useCallback((name: string) => {
    const newGroup: Group = { id: Date.now().toString(), name, files: [] };
    setGroups(prev => [...prev, newGroup]);
  }, []);

  const handleAddFilesToGroup = useCallback((groupId: string, newFiles: File[]) => {
    setGroups(prev =>
      prev.map(group => {
        if (group.id === groupId) {
          const existingFileNames = new Set(group.files.map(f => f.name));
          const uniqueNewFiles = newFiles.filter(f => !existingFileNames.has(f.name));
          return { ...group, files: [...group.files, ...uniqueNewFiles] };
        }
        return group;
      })
    );
  }, []);

  const handleStartChat = useCallback((group: Group) => {
    setActiveGroup(group);
    setActiveFile('all');
    setChatHistory([
      {
        role: 'model',
        text: `مرحباً! أنا مساعدك الدراسي لمجموعة "${group.name}". لقد قمت بتحليل ${group.files.length} ملفات. كيف يمكنني مساعدتك؟`,
      },
    ]);
  }, []);

  const handleSendMessage = useCallback(async (query: string) => {
    if (!activeGroup || activeGroup.files.length === 0) return;

    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setIsLoading(true);

    try {
      const answer = await getAnswerFromFiles(activeGroup.files, query, activeFile);
      setChatHistory(prev => [...prev, { role: 'model', text: answer }]);
    } catch (error) {
      console.error(error);
      const errorMessage = 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.';
      setChatHistory(prev => [...prev, { role: 'system', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  }, [activeGroup, activeFile]);

  const handleGoBack = () => {
    setActiveGroup(null);
    setChatHistory([]);
    setIsLoading(false);
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">مطلوب مفتاح الواجهة البرمجية</h1>
          <p className="text-slate-400 mb-6">
            لاستخدام هذا التطبيق، يرجى إدخال مفتاح Gemini API الخاص بك. سيتم حفظ المفتاح في المتصفح المحلي فقط.
          </p>
          <form onSubmit={handleApiKeySubmit}>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="أدخل مفتاح Gemini API هنا"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-400 text-center"
            />
            <button
              type="submit"
              disabled={!tempApiKey.trim()}
              className="mt-6 w-full px-6 py-3 text-lg font-bold text-white bg-sky-600 rounded-full hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              حفظ ومتابعة
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-4">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-400">
              احصل على مفتاح Gemini API من هنا
            </a>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-500">
      {!activeGroup ? (
        <AdminDashboard
          groups={groups}
          onAddGroup={handleAddGroup}
          onAddFilesToGroup={handleAddFilesToGroup}
          onStartChat={handleStartChat}
        />
      ) : (
        <div className="w-full h-[85vh] md:h-[90vh]">
            <ChatWindow
              chatHistory={chatHistory}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              pdfFiles={activeGroup.files}
              activeFile={activeFile}
              onFileSelect={setActiveFile}
              onGoBack={handleGoBack}
              chatGroupName={activeGroup.name}
            />
        </div>
      )}
    </div>
  );
};

export default App;
