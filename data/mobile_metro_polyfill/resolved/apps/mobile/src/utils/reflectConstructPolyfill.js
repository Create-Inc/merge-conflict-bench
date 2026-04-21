// This tiny polyfill guards against environments where `Reflect.construct` is not usable.
//
// Why we need it:
// Some of Expo's dev/runtime logging creates an Error subclass using Babel helpers.
// Those helpers rely on `Reflect.construct`. If it's missing or if `Reflect.construct.apply`
// is not a function, you can get: "TypeError: undefined is not a function" from
// @babel/runtime/helpers/construct.js.

(function ensureReflectConstruct() {
  try {
    const g = typeof globalThis !== "undefined" ? globalThis : global;

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

    // Tell Babel helpers this is NOT native.
    try {
      reflectObj.construct.sham = true;
    } catch (_e) {
      // ignore
    }

    // Ensure `.apply` exists directly.
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
