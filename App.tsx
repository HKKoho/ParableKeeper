import * as React from 'react';
import {
  GameState,
  RoleType,
  SoilType,
  Visitor,
  VisitorState
} from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_DURATION,
  ROLE_CONFIG,
  SOIL_CONFIG,
  TICK_RATE_MS,
  SPAWN_RATE_MS
} from './constants';
import { RoleSelect } from './components/RoleSelect';
import { GameCanvas } from './components/GameCanvas';
import { generateSermon, generateChallenge } from './services/geminiService';
import { useLanguage } from './LanguageContext';
import * as LucideReact from 'lucide-react';

// Robust icon extraction to prevent "Element type is invalid" crashes
const LucideRaw = LucideReact as any;
const Icons = LucideRaw.icons || LucideRaw.default || LucideRaw || {};

const getIcon = (name: string) => {
  const IconComponent = Icons[name];
  if (!IconComponent) {
    return (props: any) => <div className={`w-5 h-5 bg-stone-700 rounded-full inline-block ${props.className}`} title={name} />;
  }
  return IconComponent;
};

const Timer = getIcon('Timer');
const Heart = getIcon('Heart');
const Users = getIcon('Users');
const Activity = getIcon('Activity');
const Info = getIcon('Info');
const User = getIcon('User');
const Footprints = getIcon('Footprints');
const Mountain = getIcon('Mountain');
const Sprout = getIcon('Sprout');
const BookOpen = getIcon('BookOpen');
const HandHeart = getIcon('HandHeart');
const MessageCircle = getIcon('MessageCircle');
const X = getIcon('X');
const Languages = getIcon('Languages');
const AlertCircle = getIcon('AlertCircle');
const CheckCircle = getIcon('CheckCircle');

const { useState, useEffect, useRef, useCallback } = React;

const App: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    timeRemaining: GAME_DURATION,
    score: 0,
    visitors: [],
    selectedRole: null,
    playerPos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 }, // Start at altar
    sermonSummary: null,
    savedCount: 0,
    lostCount: 0,
    currentChallenge: null,
    speedBoost: 0,
    correctAnswers: 0,
  });

  const [showLegend, setShowLegend] = useState(false);
  const challengeTimerRef = useRef<number>(0);

  const playerTarget = useRef<{ x: number, y: number } | null>(null);

  // --- Logic Helpers ---

  const spawnVisitor = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying || prev.isGameOver) return prev;

      const id = Math.random().toString(36).substr(2, 9);
      const types = Object.values(SoilType).filter(t => t !== SoilType.UNKNOWN);
      const type = types[Math.floor(Math.random() * types.length)];
      const spawnX = Math.random() * (CANVAS_WIDTH - 100) + 50;
      
      const newVisitor: Visitor = {
        id,
        soilType: type as SoilType,
        revealed: false,
        patience: 100,
        satisfaction: 20,
        state: VisitorState.ENTERING,
        x: spawnX,
        laneX: spawnX,
        y: -50, // Start off-screen
        speed: Math.random() * 3 + 4, // Speed between 4 and 7
        targetY: Math.random() * (CANVAS_HEIGHT - 250) + 150, // Random seat row between 150 and Height-100
        spawnTime: Date.now(),
        needs: 'GREET',
        testTimer: 0
      };

      return {
        ...prev,
        visitors: [...prev.visitors, newVisitor]
      };
    });
  }, []);

  const spawnChallenge = useCallback(async () => {
    if (!gameState.selectedRole || gameState.currentChallenge) return;

    const challenge = await generateChallenge(gameState.selectedRole);
    setGameState(prev => ({
      ...prev,
      currentChallenge: challenge
    }));
  }, [gameState.selectedRole, gameState.currentChallenge]);

  const handleChallengeAnswer = useCallback((answer: boolean) => {
    setGameState(prev => {
      if (!prev.currentChallenge) return prev;

      const isCorrect = answer === prev.currentChallenge.isRealVerse;
      const newSpeedBoost = isCorrect ? prev.speedBoost + 0.5 : prev.speedBoost;
      const newCorrectAnswers = isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers;

      return {
        ...prev,
        currentChallenge: null,
        speedBoost: newSpeedBoost,
        correctAnswers: newCorrectAnswers
      };
    });

    // Reset challenge timer
    challengeTimerRef.current = 0;
  }, []);

  const movePlayer = useCallback(() => {
    setGameState(prev => {
      if (!prev.selectedRole || !playerTarget.current) return prev;

      const baseSpeed = ROLE_CONFIG[prev.selectedRole].speed * 2.5;
      const speed = baseSpeed * (1 + prev.speedBoost);
      const dx = playerTarget.current.x - prev.playerPos.x;
      const dy = playerTarget.current.y - prev.playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < speed) {
        playerTarget.current = null;
        return { ...prev, playerPos: { x: playerTarget.current?.x || prev.playerPos.x, y: playerTarget.current?.y || prev.playerPos.y } };
      }

      const angle = Math.atan2(dy, dx);
      return {
        ...prev,
        playerPos: {
          x: prev.playerPos.x + Math.cos(angle) * speed,
          y: prev.playerPos.y + Math.sin(angle) * speed
        }
      };
    });
  }, []);

  const updateVisitors = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying) return prev;
      
      let newScore = prev.score;
      let saved = prev.savedCount;
      let lost = prev.lostCount;
      const now = Date.now();

      const newVisitors = prev.visitors.map(v => {
        // Skip already processed leavers
        if (v.state === VisitorState.LEAVING_SAD) return v;

        let newY = v.y;
        let newX = v.x;
        let newState = v.state;

        // Move Entering visitors to seats
        if (v.state === VisitorState.ENTERING) {
          const dist = v.targetY - v.y;
          
          if (dist <= v.speed) {
            newY = v.targetY;
            newX = v.laneX; // Centered when seated
            newState = VisitorState.SEATED;
          } else {
            newY += v.speed;
            // Add gentle sway
            newX = v.laneX + Math.sin(now / 200 + parseInt(v.id, 36)) * 6;
          }
        }

        // Decay Logic based on Soil Type
        let decay = SOIL_CONFIG[v.soilType].decayRate;
        
        // Specific Mechanic: Path leaves VERY fast if not greeted
        if (v.soilType === SoilType.PATH && !v.revealed) decay *= 2.5;

        // Specific Mechanic: Thorns require Service occasionally ("cares of life")
        if (v.soilType === SoilType.THORNS && v.needs === 'NONE' && Math.random() < 0.015) {
            v.needs = 'SERVICE';
        }

        // Specific Mechanic: Rock crashes if "Testing" occurs
        if (v.soilType === SoilType.ROCK && v.needs === 'NONE' && Math.random() < 0.008) {
           v.needs = 'TEACH'; // Needs teaching to survive test
        }

        // Punishment for unmet needs
        if (v.needs !== 'NONE') {
            decay *= 3.0; // Urgent!
        }

        let newPatience = v.patience - decay;

        // If satistifed, generate score
        if (v.satisfaction > 80) newScore += 1;

        // Check loss condition
        if (newPatience <= 0) {
          lost += 1;
          newState = VisitorState.LEAVING_SAD;
          newPatience = 0;
        }

        return { ...v, state: newState, patience: newPatience, y: newY, x: newX };
      }).filter(v => v.state !== VisitorState.LEAVING_SAD || v.patience > -50); // Keep leavers briefly for visual effect then remove

      return {
        ...prev,
        visitors: newVisitors,
        score: newScore,
        savedCount: saved,
        lostCount: lost
      };
    });
  }, []);

  // --- Game Loop ---
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    const tick = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 0) {
          handleGameOver();
          return { ...prev, isGameOver: true, isPlaying: false, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - (TICK_RATE_MS / 1000) };
      });

      movePlayer();
      updateVisitors();

      // Challenge timer (15-30 seconds)
      if (!gameState.currentChallenge) {
        challengeTimerRef.current += TICK_RATE_MS;
        const challengeInterval = 15000 + Math.random() * 15000; // 15-30s
        if (challengeTimerRef.current >= challengeInterval) {
          spawnChallenge();
          challengeTimerRef.current = 0;
        }
      }

    }, TICK_RATE_MS);

    const spawner = setInterval(spawnVisitor, SPAWN_RATE_MS);

    return () => {
      clearInterval(tick);
      clearInterval(spawner);
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameState.currentChallenge, movePlayer, updateVisitors, spawnVisitor, spawnChallenge]);

  const handleGameOver = async () => {
    // Determine final stats
    // Triggers in useEffect, this function manages side effects
    if (!gameState.selectedRole) return;

    const sermon = await generateSermon(
      gameState.score,
      gameState.savedCount + gameState.visitors.filter(v => v.satisfaction > 50).length,
      gameState.lostCount,
      gameState.selectedRole,
      language
    );
    setGameState(prev => ({ ...prev, sermonSummary: sermon }));
  };

  const handleStartGame = (role: RoleType) => {
    challengeTimerRef.current = 0;
    setGameState({
      isPlaying: true,
      isGameOver: false,
      timeRemaining: GAME_DURATION,
      score: 0,
      visitors: [],
      selectedRole: role,
      playerPos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 },
      sermonSummary: null,
      savedCount: 0,
      lostCount: 0,
      currentChallenge: null,
      speedBoost: 0,
      correctAnswers: 0,
    });
  };

  const handlePlayerMove = (x: number, y: number) => {
    playerTarget.current = { x, y };
  };

  const handleInteraction = (visitorId: string) => {
    setGameState(prev => {
      if (!prev.selectedRole) return prev;
      
      const roleStats = ROLE_CONFIG[prev.selectedRole];
      
      // Calculate distance check
      const visitor = prev.visitors.find(v => v.id === visitorId);
      if (!visitor) return prev;

      const dist = Math.sqrt(
        Math.pow(prev.playerPos.x - visitor.x, 2) + 
        Math.pow(prev.playerPos.y - visitor.y, 2)
      );

      if (dist > 80) {
        // Move towards them if too far
        playerTarget.current = { x: visitor.x, y: visitor.y };
        return prev; 
      }

      // Valid Interaction
      const newVisitors = prev.visitors.map(v => {
        if (v.id !== visitorId) return v;

        let satisfactionGain = 10;
        let patienceGain = 15;

        // Apply Role Bonuses based on NEED
        // If they have a specific need, matching it gives huge bonus
        if (v.needs === 'GREET') {
             satisfactionGain += roleStats.greetPower * 1.5;
             patienceGain += roleStats.greetPower * 1.5;
        } else if (v.needs === 'TEACH') {
             satisfactionGain += roleStats.teachPower * 1.5;
             patienceGain += roleStats.teachPower * 1.5;
        } else if (v.needs === 'SERVICE') {
             satisfactionGain += roleStats.servicePower * 1.5;
             patienceGain += roleStats.servicePower * 1.5;
        } else {
            // General maintenance interaction
            if (v.soilType === SoilType.PATH) satisfactionGain += roleStats.greetPower;
            if (v.soilType === SoilType.ROCK) satisfactionGain += roleStats.teachPower;
            if (v.soilType === SoilType.THORNS) satisfactionGain += roleStats.servicePower;
            if (v.soilType === SoilType.GOOD) satisfactionGain += roleStats.teachPower;
        }

        // Reveal type on interaction
        return {
          ...v,
          revealed: true,
          satisfaction: Math.min(100, v.satisfaction + satisfactionGain),
          patience: Math.min(100, v.patience + patienceGain),
          needs: 'NONE' as const // Clear need
        };
      });

      return { ...prev, visitors: newVisitors };
    });
  };

  // --- Renders ---

  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-stone-100 p-8">
        <div className="bg-stone-800 p-8 rounded-lg border-2 border-amber-600 max-w-2xl w-full text-center relative">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="absolute top-4 right-4 bg-stone-700 hover:bg-stone-600 text-stone-300 px-3 py-2 rounded flex items-center gap-2 transition-colors"
          >
            <Languages size={16} />
            <span>{language === 'en' ? '中文' : 'EN'}</span>
          </button>

          <h1 className="text-4xl font-serif text-amber-500 mb-6">{t.gameOver.title}</h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-stone-900 p-4 rounded">
              <span className="block text-stone-400 text-sm">{t.gameOver.seedsRooted}</span>
              <span className="text-3xl text-green-500 font-bold">{gameState.savedCount + gameState.visitors.length}</span>
            </div>
            <div className="bg-stone-900 p-4 rounded">
              <span className="block text-stone-400 text-sm">{t.gameOver.lostToWorld}</span>
              <span className="text-3xl text-red-500 font-bold">{gameState.lostCount}</span>
            </div>
          </div>

          <div className="mb-8">
             <h2 className="text-xl text-stone-300 mb-2">{t.gameOver.pastoralWord}</h2>
             <div className="p-6 bg-stone-900 italic font-serif border-l-4 border-amber-500 min-h-[100px] flex items-center justify-center">
                {gameState.sermonSummary ? (
                   <p>"{gameState.sermonSummary}"</p>
                ) : (
                   <div className="flex items-center gap-2 text-stone-500">
                     <Activity size={16} className="animate-spin"/> {t.gameOver.reflecting}
                   </div>
                )}
             </div>
          </div>

          <button
            onClick={() => setGameState(prev => ({ ...prev, isGameOver: false, isPlaying: false, selectedRole: null }))}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded font-bold uppercase tracking-widest transition-colors"
          >
            {t.gameOver.playAgain}
          </button>
        </div>
      </div>
    );
  }

  if (!gameState.isPlaying || !gameState.selectedRole) {
    return <RoleSelect onSelect={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center p-4">
      {/* HUD */}
      <div className="w-full max-w-[800px] flex justify-between items-center mb-4 bg-stone-800 p-4 rounded-lg border border-stone-700 text-stone-100 shadow-lg relative">
         <div className="flex items-center gap-4">
            <div className="bg-stone-700 px-3 py-1 rounded text-amber-400 font-bold">
               {language === 'en' ? ROLE_CONFIG[gameState.selectedRole].name : t.roles[gameState.selectedRole.toLowerCase() as 'pastor' | 'deacon' | 'member'].name}
            </div>
            <div className="flex items-center gap-2">
               <Heart size={20} className="text-red-500" fill="currentColor" />
               <span className="text-xl font-bold">{gameState.score}</span>
            </div>
         </div>

         <div className="absolute left-1/2 transform -translate-x-1/2">
             <div className="flex items-center gap-2 bg-stone-950 px-4 py-2 rounded-full border border-stone-600">
                <Timer size={20} className={gameState.timeRemaining < 20 ? 'text-red-500 animate-pulse' : 'text-stone-300'} />
                <span className="font-mono text-xl">{Math.ceil(gameState.timeRemaining)}s</span>
             </div>
         </div>

         <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-stone-400">
                <Users size={20} />
                <span>{gameState.visitors.length} {t.hud.visitorsInService}</span>
             </div>
             {/* Language Toggle */}
             <button
               onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
               className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded flex items-center gap-1 transition-colors text-sm"
             >
               <Languages size={14} />
               <span>{language === 'en' ? '中文' : 'EN'}</span>
             </button>
         </div>
      </div>

      {/* Game Area */}
      <GameCanvas 
        visitors={gameState.visitors} 
        playerPos={gameState.playerPos} 
        role={gameState.selectedRole}
        onMove={handlePlayerMove}
        onVisitorClick={handleInteraction}
      />

      <div className="mt-4 text-stone-500 text-sm max-w-[800px] text-center flex items-center justify-center gap-4">
         <span>
           {t.instructions}
         </span>
         <button
           onClick={() => setShowLegend(true)}
           className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-3 py-1 rounded flex items-center gap-2 transition-colors whitespace-nowrap"
         >
           <Info size={16} /> {t.legendButton}
         </button>
      </div>

      {/* Legend Modal */}
      {showLegend && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowLegend(false)}>
          <div className="bg-stone-800 rounded-lg border-2 border-amber-600 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-amber-500">{t.legend.title}</h2>
              <button onClick={() => setShowLegend(false)} className="text-stone-400 hover:text-stone-200">
                <X size={24} />
              </button>
            </div>

            <div className="grid gap-6">
              {/* Visitor Types (Soil Types) */}
              <div>
                <h3 className="text-lg text-amber-400 mb-3 font-bold">{t.legend.visitorTypes.title}</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 rounded-full bg-stone-600">
                      <User className="text-white" size={24} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorTypes.unknown.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorTypes.unknown.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 rounded-full bg-stone-900">
                      <Footprints className="text-gray-400" size={24} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorTypes.path.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorTypes.path.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 rounded-full bg-stone-900">
                      <Mountain className="text-stone-300" size={24} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorTypes.rock.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorTypes.rock.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 rounded-full bg-stone-900">
                      <Sprout className="text-green-600" size={24} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorTypes.thorns.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorTypes.thorns.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 rounded-full bg-stone-900">
                      <Heart className="text-amber-500" size={24} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorTypes.good.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorTypes.good.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Roles */}
              <div>
                <h3 className="text-lg text-amber-400 mb-3 font-bold">{t.legend.playerRoles.title}</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 bg-stone-900 rounded-full border-2 border-amber-500">
                      <BookOpen className="text-amber-400" fill="currentColor" size={32} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.playerRoles.pastor.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.playerRoles.pastor.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 bg-stone-900 rounded-full border-2 border-amber-500">
                      <HandHeart className="text-blue-400" fill="currentColor" size={32} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.playerRoles.deacon.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.playerRoles.deacon.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="p-2 bg-stone-900 rounded-full border-2 border-amber-500">
                      <User className="text-green-400" fill="currentColor" size={32} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.playerRoles.member.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.playerRoles.member.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visitor Needs */}
              <div>
                <h3 className="text-lg text-amber-400 mb-3 font-bold">{t.legend.visitorNeeds.title}</h3>
                <p className="text-stone-400 text-sm mb-2">{t.legend.visitorNeeds.description}</p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <MessageCircle size={20} className="text-green-400" fill="currentColor" />
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorNeeds.greet.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorNeeds.greet.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <BookOpen size={20} className="text-amber-400" fill="currentColor" />
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorNeeds.teach.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorNeeds.teach.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <HandHeart size={20} className="text-blue-400" fill="currentColor" />
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.visitorNeeds.service.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.visitorNeeds.service.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HUD Elements */}
              <div>
                <h3 className="text-lg text-amber-400 mb-3 font-bold">{t.legend.hudElements.title}</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <Heart size={20} className="text-red-500" fill="currentColor" />
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.hudElements.score.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.hudElements.score.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <Timer size={20} className="text-stone-300" />
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.hudElements.time.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.hudElements.time.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <Users size={20} />
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.hudElements.visitors.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.hudElements.visitors.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-stone-900 p-3 rounded">
                    <div className="w-12 h-3 bg-gray-700 rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '70%' }} />
                    </div>
                    <div>
                      <span className="text-stone-200 font-semibold">{t.legend.hudElements.patienceBar.name}</span>
                      <p className="text-stone-400 text-sm">{t.legend.hudElements.patienceBar.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowLegend(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-bold transition-colors"
              >
                {t.legend.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Notification - Inline */}
      {gameState.currentChallenge && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-slide-down">
          <div className="bg-gradient-to-br from-red-900/95 to-stone-900/95 backdrop-blur-sm rounded-xl border-2 border-red-500 shadow-2xl shadow-red-900/50">
            {/* Header */}
            <div className="bg-red-600/20 px-6 py-3 border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-red-400 animate-pulse" />
                <h3 className="text-xl font-bold text-red-400">{t.challenge.title}</h3>
              </div>
              <div className="text-xs text-stone-400 bg-stone-800/50 px-3 py-1 rounded-full">
                ⚡ +{Math.round(gameState.speedBoost * 100)}% | ✓ {gameState.correctAnswers}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-stone-300 text-sm mb-2 opacity-80">
                  📢 {language === 'en' ? gameState.currentChallenge.distractionText : gameState.currentChallenge.distractionTextZh}
                </p>
                <div className="bg-stone-800/50 p-4 rounded-lg border border-amber-600/30">
                  <p className="text-xs text-amber-600 mb-2">{t.challenge.verifyPrompt}</p>
                  <p className="text-lg text-amber-300 italic font-serif leading-relaxed">
                    "{language === 'en' ? gameState.currentChallenge.bibleStatement : gameState.currentChallenge.bibleStatementZh}"
                  </p>
                </div>
              </div>

              {/* Question and Buttons */}
              <div className="flex items-center gap-3 justify-between">
                <p className="text-stone-400 text-sm font-medium">{t.challenge.question}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleChallengeAnswer(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={18} />
                    {t.challenge.yesButton}
                  </button>
                  <button
                    onClick={() => handleChallengeAnswer(false)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                  >
                    <X size={18} />
                    {t.challenge.noButton}
                  </button>
                </div>
              </div>

              {/* Helper Text */}
              <p className="text-stone-500 text-xs mt-3 text-center">{t.challenge.speedInfo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;