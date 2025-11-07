import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- START: Merged from types.ts ---
interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

interface Group {
  id: string;
  name: string;
  files: File[];
}
// --- END: Merged from types.ts ---


// --- START: Merged from App.tsx (type definition needed early) ---
type ActiveFile = File | 'all';
// --- END: Merged from App.tsx (type definition) ---


// --- START: Merged from utils/fileUtils.ts ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the data:mime/type;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
// --- END: Merged from utils/fileUtils.ts ---


// --- START: Merged from services/geminiService.ts ---
const getAiClient = () => {
    const apiKey = localStorage.getItem('gemini-api-key');
    if (!apiKey) {
        throw new Error("API Key not found in local storage.");
    }
    return new GoogleGenAI({ apiKey });
};

const systemInstruction = `
أنت مساعد دراسي ذكي. مهمتك الأساسية هي الإجابة على أسئلة الطلاب بالاعتماد حصرياً على المعلومات الموجودة داخل ملفات PDF المحددة التي يتم تزويدك بها.

القواعد:
1.  مصدر معلوماتك الوحيد والمطلق هو محتوى ملفات الـ PDF. لا تستخدم أي معلومات من الإنترنت أو أي مصادر خارجية أخرى. إجاباتك يجب أن تكون 100% من المستندات.
2.  عندما لا تجد الإجابة في الملفات، يجب أن ترد بشكل مهذب وواضح باللغة العربية: "عذراً، لم أتمكن من العثور على إجابة لهذا السؤال في المستندات المتوفرة. يُفضل طرح السؤال على الأستاذ مباشرة."
3.  إذا طرح الطالب سؤالاً خارج نطاق المادة الدراسية (مثلاً: "كيف حالك؟" أو سؤال عام)، يجب أن تعتذر بلطف وتُذكّر بوظيفتك الأساسية باللغة العربية: "أنا هنا لمساعدتك في الإجابة على الأسئلة المتعلقة بمحتوى المواد الدراسية. هل لديك أي استفسار حولها؟"
4.  إذا كان السؤال غامضاً، اطلب من الطالب إعادة صياغته بشكل أوضح باللغة العربية، مثال: "لم أفهم سؤالك تماماً، هل يمكنك توضيحه أكثر؟"
5.  استخدم لغة عربية فصحى ومبسطة في إجاباتك.
6.  قدّم إجابات مختصرة ومباشرة. إذا كانت المعلومة طويلة، حاول تلخيصها مع الحفاظ على المضمون.
7.  عند تقديم الإجابة، من المفضل أن تذكر اسم الملف أو القسم في ملف الـ PDF الذي استخرجت منه المعلومة لزيادة الموثوقية.
`;

const getAnswerFromFiles = async (
  files: File[],
  question: string,
  activeFile: ActiveFile
): Promise<string> => {
  try {
    const ai = getAiClient(); // Get client with key from localStorage

    let filesToProcess: File[];
    if (activeFile === 'all') {
      filesToProcess = files;
    } else {
      filesToProcess = [activeFile];
    }
    
    const fileParts = await Promise.all(
      filesToProcess.map(async (file) => {
        const base64 = await fileToBase64(file);
        return {
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        };
      })
    );

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          ...fileParts,
          {
            text: question,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API Key not found")) {
            return "لم يتم العثور على مفتاح الواجهة البرمجية (API Key). يرجى التأكد من إضافته في الصفحة الرئيسية.";
        }
        if (error.message.includes('API key not valid')) {
            localStorage.removeItem('gemini-api-key');
            return "مفتاح الواجهة البرمجية (API Key) غير صالح. تم حذفه. يرجى تحديث الصفحة وإدخال مفتاح صحيح.";
        }
    }
    return "حدث خطأ أثناء محاولة الحصول على إجابة. يرجى المحاولة مرة أخرى.";
  }
};
// --- END: Merged from services/geminiService.ts ---


// --- START: Merged from components/icons.tsx ---
const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h18v-3.75M3.75 12.75c0-3.996 3.254-7.25 7.25-7.25s7.25 3.254 7.25 7.25" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

const BotIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.026 3.348 3.97v6.02c0 1.944-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.15l-2.215 2.215a.414.414 0 01-.586 0l-2.215-2.215a.39.39 0 00-.297-.15 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.026-3.348-3.97V6.741c0-1.944 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
    </svg>
);

const DocumentIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 01-1.5 0V6.375a.375.375 0 00-.375-.375H3.375A.375.375 0 003 6.375v3.75a.375.375 0 00.375.375h4.125a.75.75 0 010 1.5H3.375A1.875 1.875 0 011.5 10.125v-3.75z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M8.25 12.375c0-1.036.84-1.875 1.875-1.875h12c1.036 0 1.875.84 1.875 1.875v3.75a1.875 1.875 0 01-1.875 1.875H12.375a.375.375 0 00-.375.375v2.818a.75.75 0 01-1.3.53L7.43 18.22a.75.75 0 00-.53-.22H4.875A1.875 1.875 0 013 15.875v-3.75a1.875 1.875 0 011.875-1.875h3.375zM6 12.375a.375.375 0 00-.375.375v3.125a.375.375 0 00.375.375h2.125a.75.75 0 01.53.22l2.1 2.1V16.5a.75.75 0 01.75-.75h10.125a.375.375 0 00.375-.375v-3a.375.375 0 00-.375-.375H10.125a.375.375 0 00-.375.375v.75a.75.75 0 01-1.5 0v-.75A1.875 1.875 0 0110.125 10.5h10.5a1.875 1.875 0 011.875 1.875v3a1.875 1.875 0 01-1.875 1.875H12.375a.75.75 0 01-.53-.22L8.72 14.03a.75.75 0 00-.53-.22H6z" clipRule="evenodd" />
    </svg>
);
// --- END: Merged from components/icons.tsx ---


// --- START: Merged from components/ChatMessage.tsx ---
interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.role === 'system') {
    return (
      <div className="text-center my-4">
        <p className="text-sm text-red-400 italic bg-slate-800/50 px-3 py-1 rounded-full inline-block">
          {message.text}
        </p>
      </div>
    );
  }
  
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xl p-4 rounded-2xl whitespace-pre-wrap ${
          isUser
            ? 'bg-sky-600 rounded-br-none'
            : 'bg-slate-700 rounded-bl-none'
        }`}
      >
        <p className="text-slate-50">{message.text}</p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};
// --- END: Merged from components/ChatMessage.tsx ---


// --- START: Merged from components/ChatWindow.tsx ---
interface ChatWindowProps {
  chatHistory: ChatMessage[];
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
          <ChatMessageComponent key={index} message={msg} />
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
// --- END: Merged from components/ChatWindow.tsx ---


// --- START: Merged from components/AdminDashboard.tsx ---
interface AdminDashboardProps {
  groups: Group[];
  onAddGroup: (name: string) => void;
  onAddFilesToGroup: (groupId: string, files: File[]) => void;
  onStartChat: (group: Group) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ groups, onAddGroup, onAddFilesToGroup, onStartChat }) => {
  const [newGroupName, setNewGroupName] = useState('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, groupId: string) => {
    if (e.target.files) {
      const pdfFiles = Array.from(e.target.files).filter(file => file.type === "application/pdf");
      if (pdfFiles.length < Array.from(e.target.files).length) {
          alert("تم تجاهل بعض الملفات لأنها ليست بصيغة PDF.");
      }
      if (pdfFiles.length > 0) {
        onAddFilesToGroup(groupId, pdfFiles);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-0">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
        لوحة تحكم المجموعات
      </h1>
      <p className="text-slate-400 text-lg text-center mb-10 max-w-2xl mx-auto">
        قم بإنشاء المجموعات، أضف الملفات لكل مجموعة، ثم ابدأ محادثة مع مساعدك الذكي.
      </p>

      <form onSubmit={handleCreateGroup} className="flex items-center gap-3 mb-12 max-w-lg mx-auto">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="أدخل اسم المجموعة الجديدة..."
          className="flex-1 w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 text-white placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!newGroupName.trim()}
          className="p-3 bg-sky-600 rounded-full text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
          aria-label="إنشاء مجموعة جديدة"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </form>

      <div className="space-y-6">
        {groups.length === 0 ? (
          <div className="text-center py-10 px-6 bg-slate-800/50 rounded-lg">
            <p className="text-slate-400">لا توجد مجموعات حتى الآن. قم بإنشاء مجموعتك الأولى لبدء العمل.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg transition-all hover:border-sky-500/50">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">{group.name}</h2>
              <div className="mb-4">
                {group.files.length > 0 ? (
                  <ul className="space-y-2">
                    {group.files.map((file, index) => (
                      <li key={index} className="flex items-center bg-slate-700/50 p-2 rounded-md text-sm">
                        <DocumentIcon className="w-5 h-5 ml-3 text-sky-400 flex-shrink-0" />
                        <span className="truncate text-slate-300">{file.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm italic">لم يتم إضافة ملفات لهذه المجموعة بعد.</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 mt-6 flex-wrap">
                <button
                    onClick={() => fileInputRefs.current[group.id]?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-300 bg-sky-900/50 border border-sky-800 rounded-lg hover:bg-sky-900 transition-colors"
                >
                    <UploadIcon className="w-5 h-5"/>
                    أضف ملفات PDF
                </button>
                <input
                    type="file"
                    ref={el => {fileInputRefs.current[group.id] = el}}
                    onChange={(e) => handleFileChange(e, group.id)}
                    className="hidden"
                    accept=".pdf"
                    multiple
                />
                <button
                  onClick={() => onStartChat(group)}
                  disabled={group.files.length === 0}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5"/>
                  ابدأ المحادثة
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
// --- END: Merged from components/AdminDashboard.tsx ---


// --- START: Merged from App.tsx ---
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
// --- END: Merged from App.tsx ---


// --- START: Original index.tsx render logic ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// --- END: Original index.tsx render logic ---
