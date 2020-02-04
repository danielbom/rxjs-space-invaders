import { paint } from "./html-render";
import { gameUpdate, initialState } from "./game";
import { Input } from "./interfaces";
import { fromEvent, interval } from "rxjs";
import {
  tap,
  repeat,
  takeUntil,
  startWith,
  withLatestFrom,
  map,
  scan
} from "rxjs/operators";

type MapEventOnInterval = [number, KeyboardEvent | any];

interval(100)
  .pipe(
    withLatestFrom(
      fromEvent(document, "keydown").pipe(
        startWith({ code: "" }),
        takeUntil(fromEvent(document, "keyup")),
        repeat()
      )
    ),
    map(([delta, e]: MapEventOnInterval): Input => ({ delta, key: e.code })),
    scan(gameUpdate, initialState),
    tap(e => paint(e.game, e.playerLives, e.score, e.isGameOver))
  )
  .subscribe();
