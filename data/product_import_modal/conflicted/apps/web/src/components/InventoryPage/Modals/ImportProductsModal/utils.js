export const normalizeHeaderKey = (key) => {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
};

export const getCanonicalKey = (target, rawKey) => {
  const k = normalizeHeaderKey(rawKey);

  // Shared-ish
  if (k === "isactive" || k === "active" || k === "enabled" || k === "status") {
    return "is_active";
  }

  if (target === "products") {
    const map = {
      // name
      name: "name",
      productname: "name",
      itemname: "name",
      description: "name",
      desc: "name",
      productdescription: "name",
      itemdescription: "name",

      // sku
      sku: "sku",
      item: "sku",
      part: "sku",
      itemno: "sku",
      partno: "sku",
      itemnumber: "sku",
      partnumber: "sku",
      productno: "sku",
      productnumber: "sku",
      productcode: "sku",
      itemsku: "sku",
      upc: "sku",
      barcode: "sku",

      // sku (add common "Code" header)
      code: "sku",

      // category
      category: "category",
      categoryname: "category",
      cat: "category",
      categoryid: "category_id",

      // misc
      unit: "unit",
      uom: "unit",

      stockonhand: "stock_on_hand",
      qtyonhand: "stock_on_hand",
      quantityonhand: "stock_on_hand",
      onhand: "stock_on_hand",
      stock: "stock_on_hand",

      reorderlevel: "reorder_level",
      reorder: "reorder_level",
      min: "reorder_level",
      minimumstock: "reorder_level",

      cost: "cost",
      unitcost: "cost",
      cogs: "cost",

      price: "price",
      unitprice: "price",
      salesprice: "price",
      retailprice: "price",
      defaultprice: "price",

      location: "location",
      bin: "location",
      shelf: "location",

      imageurl: "image_url",
      imagelink: "image_url",
      image: "image_url",
      photo: "image_url",

      // NEW: inventory item type
      itemtype: "item_type",
      item_type: "item_type",
      type: "item_type",
    };

    return map[k] || null;
  }

  // pricebook
  //
  // NOTE: Real ServiceTitan exports often add suffixes like "USD", "($)", or "(Retail)" to
  // headers (e.g. "StaticPriceUSD"). Our normalizeHeaderKey strips punctuation but leaves
  // suffixes. To avoid prices importing as 0, we add a few safe fuzzy matches before the
  // strict map.
<<<<<<< ours
  //
  // ALSO: ServiceTitan exports for Materials/Equipment often include cost/unit columns.
  // We map these too so ServiceTitan imports can mirror the file more closely.

  // Fuzzy matches for cost/unit/unit price fields
  if (k.includes("unitcost") || k === "cost") return "cost";
  if (k === "uom" || k === "unit") return "unit";

=======

  // NEW: IDs + variants (used to merge prices from *Variants sheets)
  if (k === "id" || k.endsWith("itemid")) return "st_id";
  if (k === "serviceid" || k === "materialid" || k === "equipmentid") {
    // On *Variants sheets these are the parent item IDs.
    return "st_parent_id";
  }
  if (k === "parentid") return "st_parent_id";

  if (k.includes("variantname")) return "variant_name";
  if (k === "isdefault" || k === "isdefaultvariant" || k === "isprimary") {
    return "is_default_variant";
  }

  // ServiceTitan static pricing columns
>>>>>>> theirs
  if (k.includes("usestaticaddonmemberprice"))
    return "use_static_add_on_member_price";
  if (k.includes("staticaddonmemberprice")) return "static_add_on_member_price";

  if (k.includes("usestaticaddonprice")) return "use_static_add_on_price";
  if (k.includes("staticaddonprice")) return "static_add_on_price";

  if (k.includes("usestaticmemberprice")) return "use_static_member_price";
  if (k.includes("staticmemberprice")) return "static_member_price";

  if (k.includes("usestaticprice")) return "use_static_price";
  // Be careful: this must come AFTER the addon/member static matches above.
  if (k.includes("staticprice")) return "static_price";

  // Some exports use "MemberPrice" instead of "MembershipPrice".
  if (
    k.includes("membershipprice") ||
    k === "memberprice" ||
    k.includes("memberprice")
  ) {
    return "membership_price";
  }

  // Some exports use "AddOn" vs "Addon".
  if (
    k.includes("addonprice") ||
    (k.includes("addon") && k.includes("price"))
  ) {
    return "add_on_price";
  }

  // "StandardPrice" / "BasePrice" / "TotalPrice" / "RetailPrice" should map to default_price.
  if (
    k.includes("standardprice") ||
    k.includes("baseprice") ||
    k.includes("retailprice") ||
    k.includes("flatrateprice") ||
    (k.includes("totalprice") && !k.includes("subtotal"))
  ) {
    return "default_price";
  }

  const map = {
    // name
    name: "name",
    item: "name",
    itemname: "name",

    // code / identifier
    // ServiceTitan and many systems export a code (Item # / Code / SKU) that we want to preserve.
    // We'll map these to `sku` and then derive a display `name` from Description when possible.
    code: "sku",
    sku: "sku",
    itemno: "sku",
    itemnumber: "sku",
    partno: "sku",
    partnumber: "sku",

    // Some exports use explicit columns like "Item Code" or "Item #"
    itemcode: "sku",

    // description (human readable label / long description)
    description: "description",
    desc: "description",
    details: "description",
    longdescription: "description",
    itemdescription: "description",

    // IMPORTANT: ServiceTitan exports include BOTH "Type" and "Category".
    // "Type" is usually the item kind (Service/Material/Equipment/Discount), not a category.
    // If we map it to category, it will override the real Category column (because it appears earlier).
    type: "st_type",
    servicetype: "service_type",

    // category
    category: "category",
    categoryname: "category",
    group: "category",

    // common ServiceTitan-ish headers
    pricebookcategory: "category",
    categorypath: "category",
    itemcategory: "category",

    // ServiceTitan static pricing columns
    usestaticprice: "use_static_price",
    staticprice: "static_price",

    usestaticmemberprice: "use_static_member_price",
    staticmemberprice: "static_member_price",

    usestaticaddonprice: "use_static_add_on_price",
    staticaddonprice: "static_add_on_price",

    // Some exports include "StaticAddOnMemberPrice"
    usestaticaddonmemberprice: "use_static_add_on_member_price",
    staticaddonmemberprice: "static_add_on_member_price",

    membershipprice: "membership_price",
    addonprice: "add_on_price",

    // NEW: allow ServiceTitan "Cost" to come through so Materials/Equipment import correctly.
    cost: "cost",
    unitcost: "cost",
    itemcost: "cost",
    cogs: "cost",

    // prices
    defaultprice: "default_price",
    default_price: "default_price",
    price: "default_price",
    unitprice: "default_price",
    unit_price: "default_price",
    rate: "default_price",
    amount: "default_price",
<<<<<<< ours

    // inventory-ish fields (for ServiceTitan materials/equipment tabs)
    cost: "cost",
    unitcost: "cost",
    uom: "unit",
    unit: "unit",
=======

    // Some exports use RetailPrice as the standard price field.
    retailprice: "default_price",

    // variants / ids (strict mappings)
    id: "st_id",
    serviceid: "st_parent_id",
    materialid: "st_parent_id",
    equipmentid: "st_parent_id",
    parentid: "st_parent_id",
    variantname: "variant_name",
    isdefault: "is_default_variant",
    isprimary: "is_default_variant",
>>>>>>> theirs
  };

  return map[k] || null;
};

export const toBoolean = (val, def = true) => {
  if (typeof val === "boolean") return val;
  const s = String(val || "")
    .trim()
    .toLowerCase();
  if (
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "y" ||
    s === "t" ||
    s === "x" ||
    s === "checked" ||
    s === "active"
  ) {
    return true;
  }
  if (
    s === "false" ||
    s === "0" ||
    s === "no" ||
    s === "n" ||
    s === "f" ||
    s === "inactive" ||
    s === "disabled"
  ) {
    return false;
  }
  return def; // default to active
};

export const toNumber = (val, def = 0) => {
  // Accept real numbers as-is
  if (typeof val === "number" && Number.isFinite(val)) {
    return val;
  }

  if (val === null || val === undefined) {
    return def;
  }

  let raw = String(val).trim();
  if (!raw) {
    return def;
  }

  // Handle accounting-style negatives like "(123.45)"
  const isParenNegative = /^\(.*\)$/.test(raw);
  if (isParenNegative) {
    raw = raw.slice(1, -1);
  }

  // Normalize common currency/number formats.
  // - US: 1,234.56
  // - EU: 1.234,56
  // - With symbols/words: "$1,234.56 USD"
  let cleaned = raw.replace(/\s+/g, " ").trim();

  // Strip currency symbols but keep separators for now.
  cleaned = cleaned.replace(/[$£€]/g, "");

  // If it looks like EU format (comma decimal AFTER dot thousand), convert to standard.
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1 && lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else {
    // Otherwise treat commas as thousands separators.
    cleaned = cleaned.replace(/,/g, "");
  }

  cleaned = cleaned.trim();
  if (!cleaned) {
    return def;
  }

  // Some exports include values like "123.45 USD" or "USD 123.45".
  // Extract the first number-ish token.
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return def;
  }

  let n = Number(match[0]);
  if (!Number.isFinite(n)) {
    return def;
  }

  if (isParenNegative && n > 0) {
    n *= -1;
  }

  return n;
};
