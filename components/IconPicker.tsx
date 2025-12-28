import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import * as FaIcons from 'react-icons/fa';
import * as SiIcons from 'react-icons/si';

const AllIcons = { ...LucideIcons, ...FaIcons, ...SiIcons };
const IconKeys = Object.keys(AllIcons);

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const iconList = IconKeys.filter((name) => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon = (AllIcons as any)[value] || LucideIcons.Link;

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white hover:border-indigo-500 transition-colors w-full justify-between"
      >
        <div className="flex items-center gap-2">
            <SelectedIcon size={18} />
            <span className="text-sm text-gray-300 truncate max-w-[100px]">{value}</span>
        </div>
        <LucideIcons.ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 flex flex-col">
            <div className="p-2 border-b border-white/10 sticky top-0 bg-[#1a1a1a]">
                <div className="relative">
                    <LucideIcons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search icons (e.g. discord)..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        autoFocus
                    />
                </div>
            </div>
            
            <div className="overflow-y-auto p-2 grid grid-cols-4 gap-2">
                {iconList.slice(0, 100).map((iconName) => {
                    const Icon = (AllIcons as any)[iconName];
                    if (!Icon) return null;
                    return (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                                onChange(iconName);
                                setIsOpen(false);
                            }}
                            className={`p-2 rounded-lg flex flex-col items-center gap-1 hover:bg-white/10 transition-colors ${value === iconName ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                            title={iconName}
                        >
                            <Icon size={20} />
                        </button>
                    );
                })}
                {iconList.length === 0 && (
                    <div className="col-span-4 text-center py-4 text-gray-500 text-xs">No icons found</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
