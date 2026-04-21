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
    // or where `Reflect.construct` exists but is NOT usable.
    // In those cases, Babel can crash on `Reflect.construct.apply(...)`.
    const existing =
      g.Reflect && typeof g.Reflect === "object" ? g.Reflect : {};

    let reflectObj = existing;

    const safeConstruct = function construct(Target, args, newTarget) {
      const nt = newTarget || Target;
      const proto =
        (nt && nt.prototype) ||
        (Target && Target.prototype) ||
        Object.prototype;
      const obj = Object.create(proto);

      const res = Target.apply(obj, args || []);
      const isObj = res && (typeof res === "object" || typeof res === "function");
      return isObj ? res : obj;
    };

    const needsReplacement =
      typeof existing.construct !== "function" ||
      typeof existing.construct.apply !== "function";

    if (needsReplacement) {
      const next = {};
      try {
        for (const k in existing) {
          next[k] = existing[k];
        }
      } catch (_e) {
        // ignore copy failures
      }

      next.construct = safeConstruct;

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
    }

    // IMPORTANT:
    // Tell Babel helpers this is NOT a native Reflect.construct implementation.
    // This forces them down the safe fallback path.
    try {
      reflectObj.construct.sham = true;
    } catch (_e) {
      // ignore
    }

    // Ensure `.apply` exists directly on the function (belt + suspenders).
    try {
      if (typeof reflectObj.construct.apply !== "function") {
        reflectObj.construct.apply = function (_thisArg, argsLike) {
          const a0 = argsLike && argsLike[0];
          const a1 = argsLike && argsLike[1];
          const a2 = argsLike && argsLike[2];
          return reflectObj.construct(a0, a1, a2);
        };
      }
    } catch (_e) {
      // ignore
    }

    // Best-effort lock.
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

    // Best-effort prevent replacing Reflect object.
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
