declare type GameObject = {
  x: number;
  y: number;
  collision: (other: GameObject) => boolean,
  duplicate: () => GameObject,
};

export interface State {
  delta: number;
  game: number[][];
  shipY: number;
  playerLives: number;
  isGameOver: boolean;
  score: number;

  invadersDirY: number;
  invaders: GameObject[];
  invadersShoots: GameObject[];
  shoots: GameObject[];
  shootFrequency: number;
}

export type MutateState<T> = (state: State) => T;

export interface Input {
  delta: number;
  key: string;
}
