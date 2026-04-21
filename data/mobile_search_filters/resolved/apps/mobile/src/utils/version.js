export const LAST_WORKING_VERSION = "xx.xx.xx.xxx.aft_mod_techs.03";

// NEW: hard snapshot tag — "save this before carousel work"
// Use this to refer to the exact code state before we start touching the carousel UI.
export const PRE_CAROUSEL_SNAPSHOT = "SNAP-01.2.10.famefix.02.songpull.25";

// --- START-CHAT-MESSAGE-RULE (pinned) ---
// 1) Bump version if app is modded, unless admin gives a specific version number to use.
// 2) Look to employ modular programming techniques in both backend and frontend code.
// 3) Do not make arbitrary changes on my own. Suggest ancillary possibilities or upgrades
//    but never implement without approval.
// 4) If a new backend process is introduced, I must tell you why I could not use modular
//    techniques rather than building a new backend process.
// ---

// NOTE: do NOT include a leading "v" here; the UI adds it where needed.
// Bumped for:
// - ensure song-card taps from Year/Decade/Genre/Generation lists route through buildSongDetailParams (prevents "blank" Song Details on M-DETAILS-SONG-201 when params are missing)
// - (if enabled elsewhere) show route path next to each Screen ID in Admin screen/card reports
export const APP_VERSION = "01.01.06.005.presentation_redesign.032";
