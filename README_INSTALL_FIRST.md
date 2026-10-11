# THE LAST BIRTHDAY · V1.6 — SOLO JUNE / CINEMATIC GAME OVER

## READY-TO-UPLOAD GITHUB PAGES PATCH

This is an **additive update** for the existing repository **daniellejulian1011/The-Last-Birthday-Version1**. It is not a separate playable game or a replacement for the entire original repository.

**Install:** Keep every existing original game file. Back up the repo, then upload the **contents** of this ZIP into the repository root (not a parent folder). Allow replacement of `index.html` and any previous `immersive.css` / `js/immersive.js`. Add new `js/boot.js`, `js/solo-story.js`, and `tests/solo-survival.mjs`. Keep the original `js/story.js`, `js/app.js`, `js/engine.js`, `styles.css`, all original `assets/*.webp` files, etc. The patched index loads `js/boot.js` so solo story changes happen *before* the original engine/UI initializes. This works whether v1.5 was installed or not.

This patch uses the existing **`assets/morrow.webp`** render for the stalking mascot, violent jumpscare, and game-over screen. **Do not remove that original file.** It does not package or use any uploaded reference gameplay images.

When GitHub Pages publishes your commit, hard-refresh your site at https://daniellejulian1011.github.io/The-Last-Birthday-Version1/.

## STORY CHANGES

- Ellis Ward and Nora Bell no longer appear as characters, dialogue speakers, helper voices, ending participants, or choices offered to the player.
- June goes into Candlewick’s alone and must learn the exit-relay sequence, operate the broken service door, and secure the original fire records herself.
- The radio-helper path becomes a service-gate warning; the meeting path becomes an exit-mechanism inspection.
- All eight story ending categories remain. The full-record ending now requires June to bring original evidence to the sheriff herself, and the sacrifice ending involves a street-facing evidence-delivery hatch.
- Robin's death in the October 1973 fire remains certain. Ruth Hale appears in archival material only. Edwin is the venue owner. Mr. Morrow is **completely mute in 1983**, although his mechanical movement and the player's scream produce audio.
- Stable internal node IDs are intentionally kept for **compatibility with existing save files**. They are not shown as character names or dialogue.

## GAME OVER: INTERACTIVE, NOT A CONCEPT IMAGE

The new survival-death sequence runs: alarming pursuit → aggressive animated mascot close-up + red vignette + camera shake + synthesized scream → interactive Game Over screen with the *original* detailed Mr. Morrow render.

- **RETRY:** Reset the threat to a safe position in the current story scene and continue without losing the current chapter.
- **LOAD LAST SAVE:** Call the original autosave loader through the game's real Save/Load menu. The game remains in the existing save architecture.
- **MAIN MENU:** Return to the live original interactive main menu.
- **SETTINGS:** Open functional Easy, Normal, and Nightmare selectors and adjustable audio, sensitivity, and motion. Closing Settings returns to Game Over.
- **EVIDENCE / PHOTOGRAPHS:** View June's captured photos; the story journal remains available through the normal story controls.
- **STATISTICS:** Real elapsed play time, room, evidence count, photos captured, times the enemy entered pursuit, and selected difficulty.
- Unique death messages for the Stage, Arcade, Tunnel, Workshop and Archive, plus a general death variant.

## CONTROLS

| Input | Effect |
| --- | --- |
| WASD / thumbstick | Walk freely in connected 2.5D rooms |
| Mouse / touch drag | Look around (360° horizontal rotation) |
| Shift / RUN | Sprint, louder but faster |
| F | Equip flashlight |
| C | Equip camera; Space / USE captures a photograph |
| Camera flash | Can stun Mr. Morrow if facing him within range |
| P | Equip a collected photograph / open album |
| H / HIDE | Hide when near hiding furniture |
| E / USE | Inspect a nearby object; select choices in the story panel |
| G / ⚙ | Difficulty / survival settings |
| J / M / ESC | Journal / map / pause |

The photographic look is limited by the real-time 2.5D world renderer; the enemy is a high-resolution textured sprite, **not** a fully animated polygonal 3D model. All gameplay artwork used by the patch is original project art, not reference screenshot cutouts.

## TESTING

Run from the complete repository after upload:

```bash
node --check js/solo-story.js
node --check js/immersive.js
node tests/solo-survival.mjs
npm test
```

Browser smoke tests were performed on desktop and mobile viewport sizes for the new Game Over overlay, functional difficulty selector, and returning from Settings. Full end-to-end testing with the hosted project (including every route, device audio permissions, saving, and original bundled offline build) is still required. The GitHub connection was read-only for this action, so the live website has NOT been updated automatically.

**Old offline build:** `PLAY_OFFLINE.html` in the existing repository is a prebuilt standalone copy and does not get modified by uploading this patch. To bring its content up to date, run the project's original `node tests/bundle.mjs` after uploading these files and commit the rebuilt copy. Until rebuilt, use the new hosted `index.html` edition rather than the legacy standalone edition.
