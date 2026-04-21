// This tiny polyfill guards against environments where `Reflect.construct` is not a function.
//
// Why we need it:
// Some of Expo's dev/runtime logging creates an Error subclass using Babel helpers.
// Those helpers rely on `Reflect.construct`. If it's missing or overwritten,
// you can get: "TypeError: undefined is not a function" from @babel/runtime/helpers/construct.js.

(function ensureReflectConstruct() {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : global;

    // We have seen cases where Reflect exists but can't be extended or where
    // Reflect.construct exists but is NOT a function. In those cases Babel can
    // crash on `Reflect.construct.apply(...)`.
    const existing =
      g.Reflect && typeof g.Reflect === "object" ? g.Reflect : {};

    let reflectObj = existing;

    if (typeof existing.construct !== "function") {
      const next = {};
      try {
        for (const k in existing) {
          next[k] = existing[k];
        }
      } catch (_e) {
        // ignore copy failures
      }

<<<<<<< ours
    const makeSafeConstruct = () => {
      return function construct(Target, args, newTarget) {
=======
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

    // Ensure Reflect.construct is a real function.
    // Also: if it exists but is missing `.apply`, Babel's helper can still crash.
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
    // Force Babel helpers to NOT treat Reflect.construct as native.
    // This prevents crashes from Reflect.construct.apply when Reflect is partially/badly shimmed.
    try {
      reflectObj.construct.sham = true;
    } catch (_e) {
      // ignore
    }

    // Ensure `.apply` exists directly (belt + suspenders).
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

    // Try to lock it so it can't be overwritten by a bad polyfill later.
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

    // Also try to prevent replacing the Reflect object itself.
    // (Some bad shims do: globalThis.Reflect = { ... } which would discard our construct.)
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

export default true;
