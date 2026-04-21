export const BRAND_NAME = "Caregiver'sFriend™";
export const BRAND_NAME_PLAIN = "Caregiver'sFriend";
// App Store subtitle friendly version (also used in-app under the title)
export const BRAND_TAGLINE = "A caregiver's toolkit";

// Brand logo used throughout the app
export const BRAND_LOGO_URL =
  "https://ucarecdn.com/4fe5c086-8c64-41b7-b9fe-9213896845e4/-/format/auto/";

// Brand wordmark used throughout the app (generated to match the logo colors)
export const BRAND_WORDMARK_URL =
<<<<<<< ours
  "https://raw.createusercontent.com/d3dcc884-5dc2-4db3-969f-b819f4705205/";
=======
  "https://raw.createusercontent.com/73428539-e267-4140-ad6b-98162eb2a70a/";
>>>>>>> theirs

export function applyTrademark(value) {
  if (value === null || value === undefined) {
    return value;
  }

  const input = String(value);
  const protectedToken = "__BRAND_TM__";

  // Protect already-correct uses so we don't double-apply the symbol.
  const protectedInput = input
    .replace(/Caregiver'sFriend™/g, protectedToken)
    .replace(/Caregiver Friend™/g, protectedToken)
    .replace(/Caretakers Friend™/g, protectedToken)
    .replace(/Caretaker's Friend™/g, protectedToken)
    .replace(/Caregiver Ally™/g, protectedToken);

  // Replace any legacy brand references with the current brand.
  const replaced = protectedInput
    .replace(/Caregiver'sFriend/g, BRAND_NAME)
    .replace(/Caregiver Friend/g, BRAND_NAME)
    .replace(/Caretakers Friend/g, BRAND_NAME)
    .replace(/Caretaker's Friend/g, BRAND_NAME)
    .replace(/Caregiver Ally/g, BRAND_NAME);

  return replaced.replace(new RegExp(protectedToken, "g"), BRAND_NAME);
}
