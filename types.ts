export enum SoilType {
  PATH = 'PATH',     // Needs quick greeting, leaves fast
  ROCK = 'ROCK',     // High joy initially, crashes hard on "Testing" events
  THORNS = 'THORNS', // Needs constant maintenance/service
  GOOD = 'GOOD',     // Stable, needs deep teaching to max out
  UNKNOWN = 'UNKNOWN' // Initial state
}

export enum RoleType {
  PASTOR = 'PASTOR',
  DEACON = 'DEACON',
  MEMBER = 'MEMBER'
}

export enum VisitorState {
  ENTERING = 'ENTERING',
  SEATED = 'SEATED',
  LEAVING_SAD = 'LEAVING_SAD',
  SAVED = 'SAVED' // Successfully kept until end
}

export interface Visitor {
  id: string;
  soilType: SoilType;
  revealed: boolean;
  patience: number; // 0-100. If 0, they leave.
  satisfaction: number; // 0-100. Determines score.
  state: VisitorState;
  x: number;
  y: number;
  laneX: number; // Original X lane for swaying reference
  speed: number; // Walking speed
  targetY: number; // Destination seat Y coordinate
  spawnTime: number;
  needs: 'GREET' | 'TEACH' | 'SERVICE' | 'NONE';
  testTimer: number; // For Rock type
}

export interface Challenge {
  id: string;
  distractionText: string;
  distractionTextZh: string;
  bibleStatement: string;
  bibleStatementZh: string;
  isRealVerse: boolean;
  role: RoleType;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  timeRemaining: number;
  score: number;
  visitors: Visitor[];
  selectedRole: RoleType | null;
  playerPos: { x: number; y: number };
  sermonSummary: string | null;
  savedCount: number;
  lostCount: number;
  currentChallenge: Challenge | null;
  speedBoost: number; // Accumulated permanent speed boost
  correctAnswers: number;
}

export interface RoleStats {
  name: string;
  speed: number; // Movement speed
  teachPower: number; // Boosts Good/Rock
  servicePower: number; // Boosts Thorns
  greetPower: number; // Boosts Path
  description: string;
}