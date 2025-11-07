import React, { useState, useRef } from 'react';
import type { Group } from '../types.ts';
import { DocumentIcon, PlusIcon, ChatBubbleLeftRightIcon, UploadIcon } from './icons.tsx';

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
                    // Fix: Changed ref callback to have a block body to ensure it returns void.
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

export default AdminDashboard;