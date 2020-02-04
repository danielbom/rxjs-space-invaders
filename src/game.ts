import { Input, State, MutateState } from "./interfaces";
import { EMPTY, PLAYER, INVADER, SHOT, NO_INVADERS } from "./constants";

const throwsError = (message: string) => {
  throw new Error(message);
};

// Utils
const ArrayOfKeys = (n: number) => Array.from(Array(n).keys());
const RandomInt = (end: number) => Math.floor(Math.random() * end);
const RandomFrom: <T>(array: T[]) => T = array =>
  array.length > 0
    ? array[RandomInt(array.length)]
    : throwsError("Array empty");

// Game object
class GameObject {
  constructor(public x: number, public y: number) {}

  collision(other: GameObject) {
    return this.x === other.x && this.y === other.y;
  }

  duplicate() {
    return new GameObject(this.x, this.y);
  }
}

// Game base
const gameSize = 20;
const clearGame = () =>
  Array(gameSize)
    .fill(EMPTY)
    .map(e => Array(gameSize).fill(EMPTY));

const createRowOfInvaders = (row: number): GameObject[] =>
  ArrayOfKeys(gameSize / 2)
    .filter(e => (row % 2 === 0 ? e % 2 === 0 : e % 2 !== 0))
    .map(e => new GameObject(row, e));
const createInvaders = () =>
  ArrayOfKeys(NO_INVADERS).reduce(
    (invaders: GameObject[], row) => [...invaders, ...createRowOfInvaders(row)],
    []
  );

// State
const updateGame: MutateState<number[][]> = state => (
  (state.shipY = state.shipY < 0 ? 0 : state.shipY),
  (state.shipY = state.shipY >= gameSize - 1 ? gameSize - 1 : state.shipY),
  (state.game = clearGame()),
  (state.game[state.game.length - 1][state.shipY] = PLAYER),
  state.invaders.forEach(o => (state.game[o.x][o.y] = INVADER)),
  state.invadersShoots.forEach(o => (state.game[o.x][o.y] = SHOT)),
  state.shoots.forEach(o => (state.game[o.x][o.y] = SHOT)),
  state.game
);
const updatePlayerLives: MutateState<number> = state =>
  state.invadersShoots.some(e => e.x === gameSize - 1 && e.y === state.shipY)
    ? state.playerLives - 1
    : state.playerLives;
const isGameOver: MutateState<boolean> = state =>
  state.playerLives <= 0 ||
  (state.invaders.length
    ? state.invaders[state.invaders.length - 1].x >= gameSize - 1
    : false);
const updateScore: MutateState<number> = state =>
  state.shoots.find((s: GameObject) => state.invaders.find(i => s.collision(i)))
    ? state.score + 1
    : state.score;
const updateInvadersDirection: MutateState<number> = state =>
  state.invaders.length > 0 && state.invaders[0].y <= 0
    ? 1
    : state.invaders.length > 0 &&
      state.invaders[state.invaders.length - 1].y >= gameSize - 1
    ? -1
    : state.invadersDirY;
const filterColisions: (a1: GameObject[], a2: GameObject[]) => GameObject[] = (
  a1,
  a2
) => a1.filter(e1 => !a2.find(e2 => e1.collision(e2)));
const updateInvaders: MutateState<GameObject[]> = state =>
  state.invaders.length === 0
    ? createInvaders()
    : filterColisions(state.invaders, state.shoots).map(e =>
        state.delta % 10 === 0
          ? new GameObject(
              e.x + (state.delta % (state.shootFrequency + 10) === 0 ? 1 : 0),
              e.y + state.invadersDirY
            )
          : e
      );
const updateInvadersShoot: MutateState<GameObject[]> = state => (
  console.log(state),
  (state.invadersShoots =
    state.delta % state.shootFrequency === 0
      ? [...state.invadersShoots, RandomFrom(state.invaders).duplicate()]
      : state.invadersShoots),
  state.invadersShoots
    .filter(e => e.x < gameSize - 1)
    .map(o => new GameObject(o.x + 1, o.y))
);
const updateShoots: MutateState<GameObject[]> = state =>
  filterColisions(state.shoots, state.invaders)
    .filter(e => e.x > 0)
    .map(e => new GameObject(e.x - 1, e.y));
const updateShootFrequency: MutateState<number> = state =>
  state.invaders.length === 0 ? state.shootFrequency - 5 : state.shootFrequency;

const updateState: MutateState<State> = state => ({
  delta: state.delta,
  game: updateGame(state),
  shipY: state.shipY,
  playerLives: updatePlayerLives(state),
  isGameOver: isGameOver(state),
  score: updateScore(state),

  invadersDirY: updateInvadersDirection(state),

  invaders: updateInvaders(state),
  invadersShoots: updateInvadersShoot(state),
  shoots: updateShoots(state),
  shootFrequency: updateShootFrequency(state)
});

export const initialState: State = {
  delta: 0,
  game: clearGame(),
  shipY: 10,
  playerLives: 3,
  isGameOver: false,
  score: 0,

  invadersDirY: 1,
  invaders: createInvaders(),
  invadersShoots: [],
  shoots: [],
  shootFrequency: 20
};

// User iteration
const updateShipY = (state: State, { key }: Input) =>
  (state.shipY -= key === "ArrowLeft" ? 1 : key === "ArrowRight" ? -1 : 0);
const addShots = (state: State, input: Input) =>
  (state.shoots =
    input.key === "Space"
      ? [...state.shoots, new GameObject(gameSize - 2, state.shipY)]
      : state.shoots);
const restartGame = (state: State, input: Input): State =>
  input.key !== "KeyR" ? state : (
  state.delta = 0,
  state.game = clearGame(),
  state.shipY = 10,
  state.playerLives = 3,
  state.isGameOver = false,
  state.score = 0,
  state.invaders = createInvaders(),
  state.invadersShoots = [],
  state.shoots = [],
  state.shootFrequency = 20,
  state
);
const processInput = (state: State, input: Input) => (
  updateShipY(state, input), addShots(state, input), restartGame(state, input)
);

export const gameUpdate = (state: State, input: Input): State => (
  (state.delta = isGameOver(state) ? 0 : input.delta),
  processInput(state, input),
  !state.isGameOver ? updateState(state) : state
);
