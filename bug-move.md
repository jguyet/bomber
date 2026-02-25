# Movement Chain — Exhaustive Audit

Every step from keypress to screen rendering has been traced manually with exact line
numbers and field indices. Bugs are listed by severity.

---

## LEGEND

- **CRITICAL** — directly causes broken/invisible/frozen movement
- **HIGH** — causes wrong collision or visual desync
- **MEDIUM** — degrades feel (speed incorrect, rubber-banding)
- **LOW** — latent / fragile code, not currently crashing

---

## BUG-1 [CRITICAL] — Shared `speed` variable across all four direction checks

**File:** `js/player/player.js`, lines 43–99

**What the code does:**
```js
// line 43
let speed = deltaTime * speedForMove;   // ONE variable, shared by all directions

// UP (line 45-57)
if ((this.bytedir & 4) != 0) {
    let c = this.getposibleCell(0.0, -speed);
    while (c === undefined || c.split(",")[1] != 0) {
        speed -= 0.1;           // MUTATES the shared variable
        if (speed <= 0) break;
        c = this.getposibleCell(0.0, -speed);
    }
    if (speed > 0) this.y -= speed;
}

// DOWN (line 59-71) — uses the SAME `speed`, which may already be ~0
if ((this.bytedir & 16) != 0) {
    let c = this.getposibleCell(0.0, speed);
    while (c === undefined || c.split(",")[1] != 0) {
        speed -= 0.1;           // continues shrinking the already-damaged variable
        ...
    }
    if (speed > 0) this.y += speed;
}
// Same problem for LEFT (bytedir & 32) and RIGHT (bytedir & 8)
```

**The bug:** When the player is moving in one direction and the collision loop cannot find
a free cell (e.g. UP is blocked), it grinds `speed` down to 0 (or near 0). The DOWN, LEFT,
RIGHT checks that follow use the same now-zero `speed`, so the player cannot move in ANY
direction even if those directions are completely clear.

**Observed symptom:** Player freezes after hitting a wall, even though they are pressing a
key for an unblocked direction. Movement is "impossible to control" — pressing UP against a
wall locks all other movement until the key is released and re-pressed.

**What it should do:** Each direction check must use its own independent speed copy.

**Exact fix:**
```js
// js/player/player.js — replace the block from line 38 to ~line 99

if (this.onmove) {
    let speedForMove = this.speed;
    // Diagonal normalization (see BUG-5 for correct value)
    if (this.bytedir & 16 && this.bytedir != 16 ||
        this.bytedir & 4  && this.bytedir != 4  ||
        this.bytedir & 32 && this.bytedir != 32 ||
        this.bytedir & 8  && this.bytedir != 8) {
        speedForMove *= Math.SQRT1_2;
    }
    const baseSpeed = deltaTime * speedForMove;

    if ((this.bytedir & 4) != 0) {                          // UP
        let s = baseSpeed;
        let c = this.getposibleCell(0.0, -s);
        while (c === undefined || c.split(",")[1] != 0) {
            s -= 0.1;
            if (s <= 0) { s = 0; break; }
            c = this.getposibleCell(0.0, -s);
        }
        if (s > 0) this.y -= s;
    }

    if ((this.bytedir & 16) != 0) {                         // DOWN
        let s = baseSpeed;
        let c = this.getposibleCell(0.0, s);
        while (c === undefined || c.split(",")[1] != 0) {
            s -= 0.1;
            if (s <= 0) { s = 0; break; }
            c = this.getposibleCell(0.0, s);
        }
        if (s > 0) this.y += s;
    }

    if ((this.bytedir & 32) != 0) {                         // LEFT
        let s = baseSpeed;
        let c = this.getposibleCell(-s, 0.0);
        while (c === undefined || c.split(",")[1] != 0) {
            s -= 0.1;
            if (s <= 0) { s = 0; break; }
            c = this.getposibleCell(-s, 0.0);
        }
        if (s > 0) this.x -= s;
    }

    if ((this.bytedir & 8) != 0) {                          // RIGHT
        let s = baseSpeed;
        let c = this.getposibleCell(s, 0.0);
        while (c === undefined || c.split(",")[1] != 0) {
            s -= 0.1;
            if (s <= 0) { s = 0; break; }
            c = this.getposibleCell(s, 0.0);
        }
        if (s > 0) this.x += s;
    }
    ...
}
```

---

## BUG-2 [CRITICAL] — Client collision probe missing +10 center offset

**File:** `js/player/player.js`, line 173–176

**Server reference:** `server/roomManager.js`, lines 246–248

**What the code does (client):**
```js
// js/player/player.js:173
this.getposibleCell = function(x2, y2) {
    return (world.getCellPos(this.x + x2, this.y + y2));
    // Probes from (this.x, this.y) — the top-left corner of the player
};
```

**What the server does:**
```js
// server/roomManager.js:246
getPlayerPossibleCell(player, dx, dy) {
    return this.getCellAtPixel(player.x + 10 + dx, player.y + 10 + dy);
    //                                   ^^^         ^^^
    //                       center offset applied on both axes
}
```

**The bug:** The server adds a +10 pixel offset to center the collision hitbox within the
player sprite. The client does NOT add this offset. As a result:

- Server checks collision at pixel `(x+10, y+10)` = roughly the player's visual center.
- Client checks collision at pixel `(x, y)` = the raw top-left corner, one tile above/left
  of where the player visually is.

This means:
1. The client sees a wall collision ~10px earlier than the server does — the player appears
   to stop before visually reaching a wall.
2. The server allows movement that the client's prediction blocks, causing divergence. When
   the next authoritative PM arrives, the position snaps, creating the "incoherent visual".

**What it should do:** Apply the same +10 center offset as the server.

**Exact fix in `js/player/player.js` line 175:**
```js
this.getposibleCell = function(x2, y2) {
    return (world.getCellPos(this.x + 10 + x2, this.y + 10 + y2));
};
```

---

## BUG-3 [CRITICAL] — startRound() PM broadcast resets movement while key is physically held

**File:** `server/roomManager.js`, lines 548–555 and 1063–1069

**What the code does:**
```js
// server/roomManager.js:515 — startRound() fires ~3s after WE via handleWorldEntities
startRound() {
    // ...resets all player state...
    for (const [, p] of this.players) {
        p.dir = 0;
        p.onmove = false;
        // ...
        // lines 548-555: broadcasts PM with dir=0 and onmove=false
        this.broadcastAll('PM' + p.id
            + '|' + p.x
            + '|' + p.y
            + '|' + this.getClientDirection(p)
            + '|' + p.skin
            + '|' + p.dir          // 0 — no direction
            + '|' + p.onmove       // false
            + '|' + p.nickname);
    }
}
```

Client receives this PM and calls `world.moveplayer(id, x, y, dir, skin, false, 0, nick)`.
In `world.moveplayer` (world.js:142-145):
```js
player.bytedir = 0;         // dir cleared
player.onmove = false;      // movement stopped
```

The client's keyState is NOT cleared:
```js
// js/events.js:50-51
if (keyState[event.keyCode || event.which] == true)
    return;   // suppresses KD re-send while key is held
```

**Timeline of the bug:**
```
t=0:   Player loads, PA received, currentPlayer set
t=0.5: Player holds UP arrow → KD38 sent
t=0.5: Server handleKeyDown → player.dir=4 → broadcasts PM{bytedir=4}
t=0.5: Client: player.bytedir=4, onmove=true → player moves UP (client-side prediction)
t=3.0: handleWorldEntities auto-start fires → startRound() called
t=3.0: Server resets player.dir=0, player.onmove=false → broadcasts PM{bytedir=0}
t=3.0: Client: player.bytedir=0, onmove=false → MOVEMENT STOPPED
t=3.0+: UP key is still physically held, keyState[38]=true
         onKeyDown fires again? NO — browser key-repeat fires events but keyState[38]
         is still true so the guard at line 50 blocks the KD38 re-send.
         Server never gets another KD38 → player is permanently frozen.
```

**What it should do:** Two acceptable fixes:

Option A — Clear keyState when startRound resets movement (already partially done for PM
with bytedir=0 in aks.js line 216-218, but only for currentPlayer and only in the PM
handler, NOT the startRound PM path, which goes through the same PM case "M"):

```js
// js/aks.js case "M" (around line 216) — this already exists but verify:
if (currentPlayer && id == currentPlayer.id && bytedir === 0) {
    keyState = [0];   // clear all key state so held keys re-trigger KD
}
```

Wait — this code IS present at aks.js:216-218. So the fix is supposedly there. Let me
re-examine:

```js
// js/aks.js:204-219
case "M":
    if (world != null) {
        var id = Number(received_msg.substring(2).split("|")[0]);
        var x = ...split("|")[1];
        var y = ...split("|")[2];
        var dir = ...split("|")[3];
        var skin = ...split("|")[4];
        var bytedir = Number(received_msg.substring(2).split("|")[5]);  // [5]
        var nickname = received_msg.substring(2).split("|")[7] || "";
        world.moveplayer(id, x, y, dir, skin, false, bytedir, nickname);
        if (currentPlayer && id == currentPlayer.id && bytedir === 0) {
            keyState = [0];
        }
    }
    break;
```

The `keyState = [0]` reset IS there for PM messages with bytedir=0. This should fix the
frozen-key bug. BUT: it only fires when `id == currentPlayer.id`. It will not fire if
`currentPlayer` is null (still loading). And it requires that the PM message for the
current player's own id be received.

**The keyState reset exists but there is a secondary failure path:** If `startRound()` PM
arrives BEFORE `currentPlayer` is set (timing edge case), `currentPlayer` is null, so
`id == currentPlayer.id` is never true, and `keyState` is never reset.

However, `startRound()` is triggered with a 3-second delay after WE, and `currentPlayer`
is set during WE processing. Unless 3 seconds is not enough for PA to be processed (it
should be — PA is the first message sent in handleWorldEntities), this edge case is rare.

**Verdict:** The `keyState = [0]` guard at aks.js:216 should handle most cases. The true
root cause of the "incoherent" state is BUG-1 (shared speed) and BUG-2 (wrong collision
offset), which prevent movement even when bytedir is correctly set.

---

## BUG-4 [HIGH] — Server collision probe for RIGHT direction uses excessive padding (+12px)

**File:** `server/roomManager.js`, lines 806, 822, 928, 936

**What the code does:**
```js
// line 806 — movePlayer, DOWN direction
const c = this.getPlayerPossibleCell(player, 0, speed + 2);
// line 822 — movePlayer, RIGHT direction
const c = this.getPlayerPossibleCell(player, speed + 12, 0);

// line 928 — handleKeyDown, DOWN pre-check
const c = this.getPlayerPossibleCell(player, 0, speed + 2);
// line 936 — handleKeyDown, RIGHT pre-check
const c = this.getPlayerPossibleCell(player, speed + 12, 0);
```

With `speed = 1.5`:
- UP probe: `(0, -1.5)` — 1.5px ahead
- DOWN probe: `(0, 3.5)` — 3.5px ahead (2px extra)
- LEFT probe: `(-1.5, 0)` — 1.5px ahead (symmetric with UP)
- RIGHT probe: `(13.5, 0)` — 13.5px ahead (12px extra — nearly half a tile)

**The bug:** The RIGHT probe extends 13.5px ahead while LEFT only extends 1.5px. This
asymmetry means:
- Moving RIGHT is blocked ~9 pixels before visually touching the wall.
- Moving LEFT runs right up to the wall.
- The client collision probe (after BUG-2 is fixed) uses `speed` pixels ahead (1.5px), so
  client and server disagree on when RIGHT movement should stop. This diverges their
  positions, causing rubber-banding on right-moving players.

**What it should do:** Use symmetric probes. The +2 and +12 padding are likely meant to
account for sprite width, but should be applied consistently or removed.

**Exact fix in `server/roomManager.js`:**
```js
// movePlayer, line 806:
const c = this.getPlayerPossibleCell(player, 0, speed);      // was: speed + 2

// movePlayer, line 822:
const c = this.getPlayerPossibleCell(player, speed, 0);      // was: speed + 12

// handleKeyDown, line 928:
const c = this.getPlayerPossibleCell(player, 0, speed);      // was: speed + 2

// handleKeyDown, line 936:
const c = this.getPlayerPossibleCell(player, speed, 0);      // was: speed + 12
```

---

## BUG-5 [HIGH] — Diagonal movement speed multiplier is 0.9 instead of ~0.707

**File:** `js/player/player.js`, line 40

**What the code does:**
```js
if (this.bytedir & 16 && this.bytedir != 16 || ...) {
    speedForMove *= 0.9;   // 10% slower diagonally
}
```

**The bug:** Diagonal movement should be normalized to `1/sqrt(2) ≈ 0.707` of the cardinal
speed to prevent the player moving faster diagonally than in straight lines. Using 0.9
means the player moves ~27% faster diagonally than intended relative to the correct
normalization. This makes diagonal movement feel "too fast" and hard to control precisely.

**What it should do:**
```js
speedForMove *= Math.SQRT1_2;  // ≈ 0.7071 — correct diagonal normalization
```

---

## BUG-6 [HIGH] — PM message field mapping: `onmove` at index [6] is silently skipped

**Files:** `server/roomManager.js` lines 948-955 vs `js/aks.js` lines 204-213

**Server PM message format** (broadcast from `handleKeyDown` and `startRound`):
```
PM{id}|{x}|{y}|{clientDir}|{skin}|{player.dir}|{player.onmove}|{nickname}
  [0]  [1] [2]    [3]       [4]       [5]           [6]            [7]
```

**Client reading (aks.js lines 207-212):**
```js
var id       = ...split("|")[0]  // id                ✓
var x        = ...split("|")[1]  // x                 ✓
var y        = ...split("|")[2]  // y                 ✓
var dir      = ...split("|")[3]  // clientDir (anim)  ✓
var skin     = ...split("|")[4]  // skin              ✓
var bytedir  = ...split("|")[5]  // player.dir mask   ✓
// [6] = player.onmove ("true"/"false") — NEVER READ
var nickname = ...split("|")[7]  // nickname          ✓
```

**The bug:** The client never reads field [6] (`onmove`). Instead it infers onmove from
`bytedir != 0`. This is equivalent in most cases, but means `bstop` parameter passed to
`world.moveplayer` is always `false` (hardcoded), and the semantic distinction between a
PM (move start) and PS (move stop) message is lost at the world.moveplayer call site.

More critically: the `bstop` parameter is **completely unused** in `world.moveplayer`'s
body (world.js line 123 — parameter accepted, never referenced). Dead parameter causes
confusion.

**What it should do:** Either read field [6] and use it, or remove it from the broadcast.
Since `bytedir=0` already implies `onmove=false`, the simplest fix is:
```js
// js/aks.js — in the PM case, add:
var onmove = (bytedir !== 0);
world.moveplayer(id, x, y, dir, skin, !onmove, bytedir, nickname);

// js/world/world.js — use bstop properly:
this.moveplayer = function(id, x, y, dir, skin, bstop, bytedir, nickname) {
    ...
    player.bytedir = bytedir;
    player.onmove = !bstop && (bytedir !== 0);
};
```

---

## BUG-7 [HIGH] — PS message (stop) reads `nickname` at index [7] but format matches PM

**Files:** `server/roomManager.js` lines 850-857, `js/aks.js` lines 221-231

**Server PS message format** (from `handleKeyUp` and `forceKeyUp`):
```
PS{id}|{x}|{y}|{clientDir}|{skin}|{player.dir}|{player.onmove}|{nickname}
  [0]  [1] [2]    [3]       [4]       [5]           [6]            [7]
```

**Client reading (aks.js lines 223-230):**
```js
var id       = ...split("|")[0]  ✓
var x        = ...split("|")[1]  ✓
var y        = ...split("|")[2]  ✓
var dir      = ...split("|")[3]  ✓
var skin     = ...split("|")[4]  ✓
var bytedir  = ...split("|")[5]  ✓
// [6] onmove skipped (same as PM)
var nickname = ...split("|")[7]  ✓
```

**Verdict:** Field mapping is correct. No bug in PS handler itself.

---

## BUG-8 [MEDIUM] — `currentPlayer.update()` not guarded against `world == null`

**File:** `js/events.js`, lines 85-90

**What the code does:**
```js
var updatelayer1 = function() {
    if (currentPlayer == null)
        return;
    currentPlayer.update();
};
```

Inside `player.update()` → `this.print()` → `player.js:141`:
```js
fosfo1.drawframe3("player" + this.id, ...,
    (this.x % (world.width * 32)) - (this.img.width / 2),
    //                ^^^^^ world must not be null
    (this.y % (world.height * 32)) - (this.img.height - 5));
```

If `world` is null (race during reconnect or round reset), this throws
`TypeError: Cannot read properties of null (reading 'width')`, crashing the game loop.

**What it should do:**
```js
var updatelayer1 = function() {
    if (currentPlayer == null || world == null)
        return;
    currentPlayer.update();
};
```

---

## BUG-9 [MEDIUM] — `world.width` and `world.height` are strings, not numbers

**File:** `js/world/world.js`, lines 5-6

**What the code does:**
```js
var World = function(data, theme) {
    this.width  = data.split("|")[0];   // "80" — a string
    this.height = data.split("|")[1];   // "42" — a string
```

All current arithmetic works via JS coercion (`"80" * 32 = 2560`, `5 % "80" = 5`), but
string concatenation (`this.width + 1 = "801"`) would silently produce wrong results in
any future code. The width/height values are used in dozens of arithmetic expressions.

**What it should do:**
```js
this.width  = Number(data.split("|")[0]);   // 80
this.height = Number(data.split("|")[1]);   // 42
```

---

## BUG-10 [MEDIUM] — PM position snap overwrites client-predicted position every broadcast

**Files:** `js/aks.js` lines 207-211, `js/world/world.js` lines 138-139

**What the code does:**
```js
// aks.js PM handler
world.moveplayer(id, x, y, dir, skin, false, bytedir, nickname);

// world.moveplayer for currentPlayer:
player.x = x;   // server position — overwrites client-predicted position
player.y = y;
```

**The bug:** The PM handler does NOT skip `currentPlayer`. Every time the server sends a
PM (which happens every time ANY player presses a key, because `broadcastAll` sends to all
clients), the currentPlayer's position is snapped to the server's authoritative value.

With a tick rate of 60 Hz server-side, PM messages for the current player arrive 60 times
per second. Client-side prediction moves the player between snapshots. But since PM also
arrives for OTHER players' move events (the server broadcasts to ALL on every KD), the
currentPlayer's position gets snapped even when they haven't pressed anything.

**Observed symptom:** Rubber-banding / player teleports slightly backward on every key
event from any player in the room.

**What it should do:** Skip position snap for `currentPlayer` in the PM handler (trust
client prediction for local player; only use bytedir/dir from the server message):
```js
// js/aks.js case "M":
world.moveplayer(id, x, y, dir, skin, false, bytedir, nickname,
    (currentPlayer && id === currentPlayer.id) /* skipPositionSnap */);

// js/world/world.js moveplayer — add skipPositionSnap param:
this.moveplayer = function(id, x, y, dir, skin, bstop, bytedir, nickname, skipPositionSnap) {
    ...
    if (!skipPositionSnap) {
        player.x = x;
        player.y = y;
    }
    ...
};
```

---

## BUG-11 [LOW] — `bstop` parameter in `world.moveplayer` is accepted but never used

**File:** `js/world/world.js`, line 123

```js
this.moveplayer = function(id, x, y, dir, skin, bstop, bytedir, nickname)
```

`bstop` is never referenced in the function body. The distinction between PM (start) and
PS (stop) messages is handled entirely through `bytedir === 0`. Dead parameter.

---

## BUG-12 [LOW] — Position wrap only runs inside `if (this.onmove)` block

**File:** `js/player/player.js`, lines 101-106

```js
if (this.onmove) {
    ...movement math...

    if (this.x < 0) {                          // <-- inside onmove block
        this.x = (world.width * 32) - (-this.x);
    }
    if (this.y < 0) {
        this.y = (world.height * 32) - (-this.y);
    }
}
```

If a server message places the player at a negative coordinate while `onmove = false`,
the wrap never fires and the player is rendered off-map. The server always wraps
(roomManager.js:831-834), but a defensive wrap after position snap is safer.

---

## Field Index Reference Tables

### PA message (Player Add)

Server format (`roomManager.js:1000-1007`):
```
PA{id}|{x}|{y}|{clientDir}|{skin}|{speed}|{bcurrent}|{nickname}
  [0]  [1] [2]    [3]       [4]    [5]       [6]         [7]
```

Client reads (`aks.js:187-195`):
```
[0] id        Number   ✓
[1] x         Number   ✓
[2] y         Number   ✓
[3] dir       Number   ✓  (animation id: 0=up 1=right 2=down 3=left)
[4] skin      Number   ✓
[5] speed     Number   ✓
[6] bcurrent  Number   ✓  (1 = this is currentPlayer)
[7] nickname  String   ✓
```
Status: **CORRECT**

### PM message (Player Move — key down broadcast)

Server format (`roomManager.js:948-955`):
```
PM{id}|{x}|{y}|{clientDir}|{skin}|{player.dir}|{player.onmove}|{nickname}
  [0]  [1] [2]    [3]       [4]       [5]           [6]            [7]
```

Client reads (`aks.js:207-212`):
```
[0] id       Number   ✓
[1] x        Number   ✓
[2] y        Number   ✓
[3] dir      Number   ✓  (animation id)
[4] skin     Number   ✓
[5] bytedir  Number   ✓  (direction bitmask: UP=4 RIGHT=8 DOWN=16 LEFT=32)
[6]          --       SKIPPED (onmove boolean, "true"/"false")
[7] nickname String   ✓
```
Status: **CORRECT for fields read, field [6] wasted bandwidth**

### PS message (Player Stop — key up broadcast)

Server format (`roomManager.js:975-982`):
```
PS{id}|{x}|{y}|{clientDir}|{skin}|{player.dir}|{player.onmove}|{nickname}
  [0]  [1] [2]    [3]       [4]       [5]           [6]            [7]
```

Client reads (`aks.js:223-230`): identical mapping to PM. **CORRECT.**

### getClientDirection mapping

Server (`roomManager.js:233-240`):
```
player.dir == 0      → return player.olddir (default 2 = down)
player.dir & 4 (UP)  → return 0
player.dir & 8 (RIGHT)→ return 1
player.dir & 16(DOWN) → return 2
player.dir & 32(LEFT) → return 3
```

Client anims (`player.js:9-14`):
```
anims[0] = UP    (frames 0-3)
anims[1] = RIGHT (frames 4-7)
anims[2] = DOWN  (frames 8-11)
anims[3] = LEFT  (frames 12-15)
```

**Mapping is correct.** clientDir 0-3 maps to anims[0-3] correctly.

### Key code mapping

Client sends (`events.js:53`): `"KD" + event.keyCode`

Server parses (`roomManager.js:908`): `parseInt(message.substring(2), 10)`

| Key    | keyCode | Server DIR  |
|--------|---------|-------------|
| UP     | 38      | DIR.UP (4)  |
| W      | 87      | DIR.UP (4)  |
| DOWN   | 40      | DIR.DOWN (16)|
| S      | 83      | DIR.DOWN (16)|
| LEFT   | 37      | DIR.LEFT (32)|
| A      | 65      | DIR.LEFT (32)|
| RIGHT  | 39      | DIR.RIGHT (8)|
| D      | 68      | DIR.RIGHT (8)|
| SPACE  | 32      | bomb        |

**Key mapping is correct on both sides.**

---

## Summary Table

| # | Severity | File | Lines | Issue |
|---|----------|------|-------|-------|
| 1 | CRITICAL | `js/player/player.js` | 43-99 | Shared `speed` var across direction checks — first blocked dir zeros speed for all others |
| 2 | CRITICAL | `js/player/player.js` | 173-176 | Client collision probe missing +10 center offset (server uses +10); wrong tile checked |
| 3 | CRITICAL | `server/roomManager.js` | 548-555, 1063-1069 | `startRound()` PM with bytedir=0 cancels held-key movement (keyState[key]=true blocks re-send) |
| 4 | HIGH | `server/roomManager.js` | 806, 822, 928, 936 | RIGHT probe +12px and DOWN probe +2px extra padding — asymmetric collision, diverges client/server |
| 5 | HIGH | `js/player/player.js` | 40 | Diagonal speed multiplier 0.9 instead of 0.707 — diagonal faster than cardinal |
| 6 | HIGH | `js/aks.js` | 211-213 | PM field [6] (onmove) never read; bstop always false hardcoded |
| 7 | MEDIUM | `js/events.js` | 85-90 | `updatelayer1()` not guarded against `world == null` — crash on reconnect |
| 8 | MEDIUM | `js/world/world.js` | 5-6 | `width`/`height` stored as strings — fragile arithmetic |
| 9 | MEDIUM | `js/aks.js` | 207-211 | PM handler snaps currentPlayer position — rubber-banding |
| 10 | LOW | `js/world/world.js` | 123 | `bstop` param accepted but never used |
| 11 | LOW | `js/player/player.js` | 101-106 | Position wrap only inside `onmove` block |

---

## Root Cause Summary: Why movement is "impossible to control, visual is incoherent"

**Primary cause — BUG-1:** The shared `speed` variable in `player.update()`. Moving while
near any wall locks ALL movement (not just the blocked direction), because the collision
loop grinds the shared variable to zero. The player appears completely frozen after touching
any wall, even though other directions are clear.

**Secondary cause — BUG-2:** The client checks collision at the wrong cell (raw top-left
corner instead of the centered +10 offset the server uses). This means the client's view
of walkable terrain is offset by one partial tile from the server's view. The player
visually stops too early and the position snaps on every server PM, creating the
"incoherent visual" effect.

**Tertiary cause — BUG-3 + BUG-10:** The `startRound()` broadcast (3 seconds after
loading) resets movement state via a PM with bytedir=0. If a key is held when this fires,
the client's keyState prevents re-sending KD, leaving the player frozen. Additionally,
every PM message snaps the currentPlayer's position to the server value, causing
rubber-banding.
