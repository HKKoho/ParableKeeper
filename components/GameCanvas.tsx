import * as React from 'react';
import { Visitor, VisitorState, SoilType, RoleType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import * as LucideReact from 'lucide-react';

const { useRef } = React;

// Robust icon extraction to prevent "Element type is invalid" crashes
const LucideRaw = LucideReact as any;
const Icons = LucideRaw.icons || LucideRaw.default || LucideRaw || {};

const getIcon = (name: string) => {
  const IconComponent = Icons[name];
  if (!IconComponent) {
    return (props: any) => <div className={`w-6 h-6 bg-stone-700 flex items-center justify-center text-[10px] text-stone-500 ${props.className}`} title={name}>?</div>;
  }
  return IconComponent;
};

const User = getIcon('User');
const Sprout = getIcon('Sprout');
const Mountain = getIcon('Mountain');
const Footprints = getIcon('Footprints');
const Heart = getIcon('Heart');
const BookOpen = getIcon('BookOpen');
const HandHeart = getIcon('HandHeart');
const MessageCircle = getIcon('MessageCircle');

interface GameCanvasProps {
  visitors: Visitor[];
  playerPos: { x: number; y: number };
  role: RoleType;
  onVisitorClick: (id: string) => void;
  onMove: (x: number, y: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  visitors, 
  playerPos, 
  role,
  onVisitorClick,
  onMove
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked a visitor
    // Simple hitbox check
    const clickedVisitor = visitors.find(v => 
      Math.abs(v.x - x) < 30 && Math.abs(v.y - y) < 30 && v.state !== VisitorState.LEAVING_SAD
    );

    if (clickedVisitor) {
      onVisitorClick(clickedVisitor.id);
    } else {
      onMove(x, y);
    }
  };

  const getSoilIcon = (visitor: Visitor) => {
    if (!visitor.revealed) return <User className="text-white" size={24} />;
    
    switch (visitor.soilType) {
      case SoilType.PATH: return <Footprints className="text-gray-400" size={24} />;
      case SoilType.ROCK: return <Mountain className="text-stone-300" size={24} />;
      case SoilType.THORNS: return <Sprout className="text-green-600" size={24} />; // Thorns look like plants initially
      case SoilType.GOOD: return <Heart className="text-amber-500" size={24} />;
      default: return <User className="text-white" size={24} />;
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case RoleType.PASTOR: return <BookOpen className="text-amber-400" fill="currentColor" size={32} />;
      case RoleType.DEACON: return <HandHeart className="text-blue-400" fill="currentColor" size={32} />;
      case RoleType.MEMBER: return <User className="text-green-400" fill="currentColor" size={32} />;
    }
  };

  const getNeedIcon = (need: 'GREET' | 'TEACH' | 'SERVICE' | 'NONE') => {
    switch (need) {
      case 'GREET': return <MessageCircle size={20} className="text-green-400" fill="currentColor" />;
      case 'TEACH': return <BookOpen size={20} className="text-amber-400" fill="currentColor" />;
      case 'SERVICE': return <HandHeart size={20} className="text-blue-400" fill="currentColor" />;
      default: return null;
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="relative bg-stone-800 rounded-lg overflow-hidden shadow-2xl border-4 border-stone-700 cursor-pointer"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onClick={handleCanvasClick}
    >
      <style>{`
        .visitor-smooth {
          transition: top 120ms linear, left 120ms linear;
        }
        @keyframes walk-bob {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-3deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(3deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-walk {
          animation: walk-bob 0.6s infinite linear;
        }
      `}</style>

      {/* Background Decor - Pews */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         {[...Array(6)].map((_, row) => (
           <div key={row} className="flex justify-center gap-8 mt-16">
              <div className="w-64 h-4 bg-stone-200 rounded"></div>
              <div className="w-64 h-4 bg-stone-200 rounded"></div>
           </div>
         ))}
         {/* Altar */}
         <div className="absolute bottom-0 w-full flex justify-center pb-8">
            <div className="w-96 h-24 bg-amber-900 rounded-t-xl opacity-40"></div>
         </div>
         {/* Carpet */}
         <div className="absolute inset-0 flex justify-center">
            <div className="w-24 h-full bg-red-900 opacity-20"></div>
         </div>
      </div>

      {/* Visitors */}
      {visitors.map(visitor => {
        if (visitor.state === VisitorState.LEAVING_SAD) return null;
        
        const isMoving = visitor.state === VisitorState.ENTERING;

        return (
          <div 
            key={visitor.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 visitor-smooth`}
            style={{ left: visitor.x, top: visitor.y }}
          >
            <div className={`flex flex-col items-center ${isMoving ? 'animate-walk' : ''}`}>
              {/* Needs Indicator */}
              {visitor.needs !== 'NONE' && (
                <div className="absolute -top-10 animate-bounce z-20">
                   <div className="bg-stone-900 rounded-full p-1.5 border border-stone-600 shadow-lg shadow-black/50 flex items-center justify-center">
                      {getNeedIcon(visitor.needs)}
                   </div>
                   {/* Little Arrow pointing down */}
                   <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-stone-600 mx-auto"></div>
                </div>
              )}
              
              {/* Visitor Icon */}
              <div className={`p-2 rounded-full ${visitor.revealed ? 'bg-stone-900' : 'bg-stone-600'} shadow-md border border-stone-500 relative`}>
                {getSoilIcon(visitor)}
              </div>

              {/* Bars */}
              <div className="mt-1 w-12 h-1 bg-gray-700 rounded overflow-hidden">
                <div 
                  className={`h-full ${visitor.patience < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${visitor.patience}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Player */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-linear z-10"
        style={{ left: playerPos.x, top: playerPos.y }}
      >
        <div className="p-2 bg-stone-900 rounded-full border-2 border-amber-500 shadow-xl shadow-amber-500/20">
          {getRoleIcon()}
        </div>
      </div>
    </div>
  );
};