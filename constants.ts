import { RoleStats, RoleType, SoilType } from './types';

export const GAME_DURATION = 100; // seconds
export const SPAWN_RATE_MS = 3000;
export const TICK_RATE_MS = 100;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const ROLE_CONFIG: Record<RoleType, RoleStats> = {
  [RoleType.PASTOR]: {
    name: "Pastor",
    speed: 5,
    teachPower: 15,
    servicePower: 5,
    greetPower: 8,
    description: "Strong teaching. Good at deeply rooting Good Soil and Rocks."
  },
  [RoleType.DEACON]: {
    name: "Deacon",
    speed: 8,
    teachPower: 5,
    servicePower: 15,
    greetPower: 8,
    description: "Fast mover. Excellent at removing Thorns (cares of life)."
  },
  [RoleType.MEMBER]: {
    name: "Member",
    speed: 6,
    teachPower: 5,
    servicePower: 8,
    greetPower: 15,
    description: "High energy. Best at catching those on the Path before they leave."
  }
};

export const SOIL_CONFIG: Record<SoilType, { decayRate: number; preferredAction: string; color: string }> = {
  [SoilType.PATH]: { decayRate: 0.8, preferredAction: 'GREET', color: 'text-gray-400' },
  [SoilType.ROCK]: { decayRate: 0.2, preferredAction: 'TEACH', color: 'text-stone-300' },
  [SoilType.THORNS]: { decayRate: 0.4, preferredAction: 'SERVICE', color: 'text-green-700' },
  [SoilType.GOOD]: { decayRate: 0.1, preferredAction: 'TEACH', color: 'text-amber-500' },
  [SoilType.UNKNOWN]: { decayRate: 0.2, preferredAction: 'GREET', color: 'text-white' },
};
