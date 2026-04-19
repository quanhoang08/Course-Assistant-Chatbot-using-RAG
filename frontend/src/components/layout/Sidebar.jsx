import React from 'react';

const Sidebar = () => {
    return (
        <aside className="w-72 bg-[#111422] border-r border-slate-800 flex flex-col h-full shrink-0">
            <div className="p-5 flex items-center gap-3 border-b border-slate-800/50">
                <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">EA</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-white font-bold text-lg leading-tight">EduAssistant</h1>
                    <p className="text-slate-400 text-xs font-medium">Giảng viên</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3">
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Khóa học của tôi</h3>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600/20 text-white border border-blue-600/30">
                    <span className="text-sm font-medium">Kỹ thuật phần mềm</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;