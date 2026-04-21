// This file is designed to run BEFORE the main app module (via metro.config.js).
// It must be plain JS (CommonJS-friendly) so Metro can include it as a prelude.
//
// Fixes: "[runtime not ready]: TypeError: undefined is not a function" from
// @babel/runtime/helpers/construct.js when Expo's metro runtime/devtools create
// Error subclasses.

(function ensureReflectConstructPrelude() {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : global;

    // We have seen environments where `Reflect` exists but can't be extended
    // or where `Reflect.construct` exists but is NOT a function.
    // In those cases, the Babel helper can end up doing `Reflect.construct.apply(...)`
    // and crash with "undefined is not a function".
    const existing =
      g.Reflect && typeof g.Reflect === "object" ? g.Reflect : {};

<<<<<<< ours
    const makeSafeConstruct = () => {
      // Always use a JS implementation (so we can attach properties like `sham` and `apply`).
      return function construct(Target, args, newTarget) {
=======
    let reflectObj = existing;

    // If construct is missing OR not a function, create a safe replacement Reflect object
    // and assign it back onto the global.
    if (typeof existing.construct !== "function") {
      const next = {};
      try {
        for (const k in existing) {
          next[k] = existing[k];
        }
      } catch (_e) {
        // ignore copy failures
      }

      next.construct = function construct(Target, args, newTarget) {
>>>>>>> theirs
        const nt = newTarget || Target;
        const proto =
          (nt && nt.prototype) ||
          (Target && Target.prototype) ||
          Object.prototype;
        const obj = Object.create(proto);

        const res = Target.apply(obj, args || []);
        const isObj =
          res && (typeof res === "object" || typeof res === "function");
        return isObj ? res : obj;
      };
<<<<<<< ours
    };

    // If Reflect.construct exists but is missing `.apply` (can happen if Function.prototype.apply
    // is not available in the runtime), Babel helpers can crash at Reflect.construct.apply(...).
    // Easiest, safest fix: replace with our own JS construct.
    const needsReplacement =
      typeof g.Reflect.construct !== "function" ||
      typeof g.Reflect.construct.apply !== "function";

    if (needsReplacement) {
      g.Reflect.construct = makeSafeConstruct();
=======

      try {
        g.Reflect = next;
      } catch (_e) {
        // If we can't replace the global Reflect, fall back to mutating the existing object.
        try {
          existing.construct = next.construct;
        } catch (_e2) {
          // ignore
        }
      }

      reflectObj =
        g.Reflect && typeof g.Reflect === "object" ? g.Reflect : existing;
>>>>>>> theirs
    }

    // IMPORTANT:
    // Tell Babel helpers this is NOT a native Reflect.construct implementation.
    // This forces them down the safe fallback path (no Reflect.construct.apply).
    try {
      reflectObj.construct.sham = true;
    } catch (_e) {
      // ignore
    }

    // Also ensure `.apply` exists directly on the function (belt + suspenders).
    try {
      if (typeof g.Reflect.construct.apply !== "function") {
        g.Reflect.construct.apply = function (_thisArg, argsLike) {
          const a0 = argsLike && argsLike[0];
          const a1 = argsLike && argsLike[1];
          const a2 = argsLike && argsLike[2];
          return g.Reflect.construct(a0, a1, a2);
        };
      }
    } catch (_e) {
      // ignore
    }

    // Best-effort lock. If it fails, we still at least have the function.
    try {
      Object.defineProperty(reflectObj, "construct", {
        value: reflectObj.construct,
        writable: false,
        configurable: false,
        enumerable: true,
      });
    } catch (_e) {
      // ignore
    }

    try {
      const desc = Object.getOwnPropertyDescriptor(g, "Reflect");
      const canDefine = !desc || desc.configurable || desc.writable;
      if (canDefine) {
        Object.defineProperty(g, "Reflect", {
          value: reflectObj,
          writable: false,
          configurable: false,
          enumerable: true,
        });
      }
    } catch (_e) {
      // ignore
    }
  } catch (_err) {
    // ignore
  }
})();

module.exports = true;
