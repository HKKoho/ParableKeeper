import * as React from 'react';
import { RoleType } from '../types';
import { ROLE_CONFIG } from '../constants';
import { useLanguage } from '../LanguageContext';
import * as LucideReact from 'lucide-react';

// Robust icon extraction to prevent "Element type is invalid" crashes
const LucideRaw = LucideReact as any;
const Icons = LucideRaw.icons || LucideRaw.default || LucideRaw || {};

const getIcon = (name: string) => {
  const IconComponent = Icons[name];
  if (!IconComponent) {
    // Fallback component if icon is missing
    return (props: any) => <div className={`w-8 h-8 bg-stone-700 flex items-center justify-center text-xs text-stone-500 ${props.className}`} title={name}>?</div>;
  }
  return IconComponent;
};

const User = getIcon('User');
const BookOpen = getIcon('BookOpen');
const HandHeart = getIcon('HandHeart');
const Languages = getIcon('Languages');

interface RoleSelectProps {
  onSelect: (role: RoleType) => void;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({ onSelect }) => {
  const { language, setLanguage, t } = useLanguage();
  const icons = {
    [RoleType.PASTOR]: <BookOpen size={48} className="mb-4 text-amber-400" />,
    [RoleType.DEACON]: <HandHeart size={48} className="mb-4 text-blue-400" />,
    [RoleType.MEMBER]: <User size={48} className="mb-4 text-green-400" />,
  };

  const getRoleName = (role: RoleType) => {
    const roleKey = role.toLowerCase() as 'pastor' | 'deacon' | 'member';
    return t.roles[roleKey].name;
  };

  const getRoleDescription = (role: RoleType) => {
    const roleKey = role.toLowerCase() as 'pastor' | 'deacon' | 'member';
    return t.roles[roleKey].description;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-stone-100 p-8 relative">
      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
        className="absolute top-8 right-8 bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-stone-700"
      >
        <Languages size={20} />
        <span>{language === 'en' ? '中文' : 'English'}</span>
      </button>

      <h1 className="text-5xl mb-4 text-amber-500 font-bold">{t.gameTitle}</h1>
      <p className="text-xl mb-12 text-stone-400 max-w-2xl text-center whitespace-pre-line">
        {t.gameSubtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {(Object.values(RoleType) as RoleType[]).map((role) => (
          <button
            key={role}
            onClick={() => onSelect(role)}
            className="flex flex-col items-center p-8 bg-stone-800 rounded-lg border-2 border-stone-700 hover:border-amber-500 hover:bg-stone-750 transition-all duration-300 group"
          >
            <div className="group-hover:scale-110 transition-transform duration-300">
              {icons[role]}
            </div>
            <h2 className="text-2xl font-bold mb-2">{getRoleName(role)}</h2>
            <p className="text-stone-400 text-center mb-4 text-sm h-12">{getRoleDescription(role)}</p>

            <div className="w-full space-y-2 text-xs font-mono text-stone-500">
              <div className="flex justify-between">
                <span>{t.stats.speed}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full ${i < ROLE_CONFIG[role].speed / 2 ? 'bg-amber-500' : 'bg-stone-700'}`} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span>{t.stats.teach}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full ${i < ROLE_CONFIG[role].teachPower / 3 ? 'bg-amber-500' : 'bg-stone-700'}`} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span>{t.stats.service}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-2 w-2 rounded-full ${i < ROLE_CONFIG[role].servicePower / 3 ? 'bg-amber-500' : 'bg-stone-700'}`} />
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};