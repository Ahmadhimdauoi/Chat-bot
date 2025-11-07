import React, { useState, useCallback } from 'react';
import type { ChatMessage, Group } from './types';
import { getAnswerFromFiles } from './services/geminiService';
import AdminDashboard from './components/AdminDashboard';
import ChatWindow from './components/ChatWindow';

// Define a type for the active file selection
export type ActiveFile = File | 'all';

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeFile, setActiveFile] = useState<ActiveFile>('all');

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
