export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Entity {
  id: string;
  pos: Position;
  vel: Velocity;
  width: number;
  height: number;
  color: string;
  markedForDeletion: boolean;
}

export interface Player extends Entity {
  hp: number;
  invulnerableUntil: number;
}

export interface Enemy extends Entity {
  hp: number;
  type: 'scout' | 'fighter' | 'bomber';
  scoreValue: number;
}

export interface Bullet extends Entity {
  owner: 'player' | 'enemy';
  damage: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
}

export enum GameStatus {
  MENU,
  PLAYING,
  GAME_OVER,
}
