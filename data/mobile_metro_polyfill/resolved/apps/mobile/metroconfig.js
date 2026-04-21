// Metro configuration forwarder for this repo.
//
// In this Anything project, the Metro config that actually contains our settings
// (including the early Reflect.construct prelude) lives at:
//   /apps/mobile/src/metro.config.js
//
// Some tooling in this environment loads /apps/mobile/metroconfig.js,
// so this file must be valid JS and should forward to the real config.

module.exports = require("./src/metro.config.js");
