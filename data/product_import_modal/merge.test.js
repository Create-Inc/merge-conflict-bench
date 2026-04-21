import { describe, it, expect } from "vitest";
import {
  normalizeHeaderKey,
  getCanonicalKey,
  toBoolean,
  toNumber,
} from "./resolved/apps/web/src/components/InventoryPage/Modals/ImportProductsModal/utils.js";

// ---------------------------------------------------------------------------
// BASE behaviors (existed before either branch)
// ---------------------------------------------------------------------------
describe("base behaviors", () => {
  describe("normalizeHeaderKey", () => {
    it("lowercases, strips whitespace and non-alphanumeric chars", () => {
      expect(normalizeHeaderKey("  Unit Cost ")).toBe("unitcost");
      expect(normalizeHeaderKey("Item #")).toBe("item");
      expect(normalizeHeaderKey("Static Price (USD)")).toBe("staticpriceusd");
      expect(normalizeHeaderKey(null)).toBe("");
      expect(normalizeHeaderKey(undefined)).toBe("");
    });
  });

  describe("getCanonicalKey – shared is_active", () => {
    it.each(["isActive", "Active", "Enabled", "Status"])(
      "maps %s to is_active for any target",
      (header) => {
        expect(getCanonicalKey("products", header)).toBe("is_active");
        expect(getCanonicalKey("pricebook", header)).toBe("is_active");
      }
    );
  });

  describe("getCanonicalKey – products target", () => {
    it("maps common name headers", () => {
      expect(getCanonicalKey("products", "Name")).toBe("name");
      expect(getCanonicalKey("products", "Product Name")).toBe("name");
      expect(getCanonicalKey("products", "Item Name")).toBe("name");
    });

    it("maps SKU headers", () => {
      expect(getCanonicalKey("products", "SKU")).toBe("sku");
      expect(getCanonicalKey("products", "Item No")).toBe("sku");
      expect(getCanonicalKey("products", "UPC")).toBe("sku");
      expect(getCanonicalKey("products", "Barcode")).toBe("sku");
      expect(getCanonicalKey("products", "Code")).toBe("sku");
    });

    it("maps category headers", () => {
      expect(getCanonicalKey("products", "Category")).toBe("category");
      expect(getCanonicalKey("products", "Category ID")).toBe("category_id");
    });

    it("maps stock/reorder headers", () => {
      expect(getCanonicalKey("products", "Stock On Hand")).toBe("stock_on_hand");
      expect(getCanonicalKey("products", "Reorder Level")).toBe(
        "reorder_level"
      );
    });

    it("maps price headers", () => {
      expect(getCanonicalKey("products", "Price")).toBe("price");
      expect(getCanonicalKey("products", "Unit Price")).toBe("price");
      expect(getCanonicalKey("products", "Sales Price")).toBe("price");
      expect(getCanonicalKey("products", "Retail Price")).toBe("price");
    });

    it("maps image headers", () => {
      expect(getCanonicalKey("products", "Image URL")).toBe("image_url");
      expect(getCanonicalKey("products", "Photo")).toBe("image_url");
    });

    it("maps item type headers", () => {
      expect(getCanonicalKey("products", "Item Type")).toBe("item_type");
      expect(getCanonicalKey("products", "Type")).toBe("item_type");
    });
  });

  describe("getCanonicalKey – pricebook static pricing fuzzy matchers", () => {
    it("maps static price headers with suffixes", () => {
      expect(getCanonicalKey("pricebook", "UseStaticPriceUSD")).toBe(
        "use_static_price"
      );
      expect(getCanonicalKey("pricebook", "StaticPrice (USD)")).toBe(
        "static_price"
      );
    });

    it("maps static member price headers", () => {
      expect(getCanonicalKey("pricebook", "UseStaticMemberPrice")).toBe(
        "use_static_member_price"
      );
      expect(getCanonicalKey("pricebook", "StaticMemberPrice")).toBe(
        "static_member_price"
      );
    });

    it("maps static addon price headers", () => {
      expect(getCanonicalKey("pricebook", "UseStaticAddonPrice")).toBe(
        "use_static_add_on_price"
      );
      expect(getCanonicalKey("pricebook", "StaticAddonPrice")).toBe(
        "static_add_on_price"
      );
    });

    it("maps static addon member price headers", () => {
      expect(
        getCanonicalKey("pricebook", "UseStaticAddOnMemberPrice")
      ).toBe("use_static_add_on_member_price");
      expect(getCanonicalKey("pricebook", "StaticAddOnMemberPrice")).toBe(
        "static_add_on_member_price"
      );
    });

    it("maps membership price fuzzy", () => {
      expect(getCanonicalKey("pricebook", "MembershipPrice")).toBe(
        "membership_price"
      );
      expect(getCanonicalKey("pricebook", "MemberPrice")).toBe(
        "membership_price"
      );
    });

    it("maps addon price fuzzy", () => {
      expect(getCanonicalKey("pricebook", "AddonPrice")).toBe("add_on_price");
      expect(getCanonicalKey("pricebook", "AddOnPrice")).toBe("add_on_price");
    });

    it("maps standard/base/retail/flatrate/total price to default_price", () => {
      expect(getCanonicalKey("pricebook", "StandardPrice")).toBe(
        "default_price"
      );
      expect(getCanonicalKey("pricebook", "BasePrice")).toBe("default_price");
      expect(getCanonicalKey("pricebook", "FlatRatePrice")).toBe(
        "default_price"
      );
      expect(getCanonicalKey("pricebook", "TotalPrice")).toBe("default_price");
    });
  });

  describe("getCanonicalKey – pricebook strict map (base entries)", () => {
    it("maps name/item headers", () => {
      expect(getCanonicalKey("pricebook", "Name")).toBe("name");
      expect(getCanonicalKey("pricebook", "Item")).toBe("name");
      expect(getCanonicalKey("pricebook", "Item Name")).toBe("name");
    });

    it("maps code/sku headers", () => {
      expect(getCanonicalKey("pricebook", "Code")).toBe("sku");
      expect(getCanonicalKey("pricebook", "SKU")).toBe("sku");
      expect(getCanonicalKey("pricebook", "Item Code")).toBe("sku");
    });

    it("maps description headers", () => {
      expect(getCanonicalKey("pricebook", "Description")).toBe("description");
      expect(getCanonicalKey("pricebook", "Long Description")).toBe(
        "description"
      );
    });

    it("maps type to st_type", () => {
      expect(getCanonicalKey("pricebook", "Type")).toBe("st_type");
    });

    it("maps category headers", () => {
      expect(getCanonicalKey("pricebook", "Category")).toBe("category");
      expect(getCanonicalKey("pricebook", "Pricebook Category")).toBe(
        "category"
      );
    });

    it("maps price headers to default_price", () => {
      expect(getCanonicalKey("pricebook", "Default Price")).toBe(
        "default_price"
      );
      expect(getCanonicalKey("pricebook", "Price")).toBe("default_price");
      expect(getCanonicalKey("pricebook", "Unit Price")).toBe("default_price");
      expect(getCanonicalKey("pricebook", "Rate")).toBe("default_price");
      expect(getCanonicalKey("pricebook", "Amount")).toBe("default_price");
    });
  });

  describe("toBoolean", () => {
    it("recognizes truthy strings", () => {
      expect(toBoolean("true")).toBe(true);
      expect(toBoolean("1")).toBe(true);
      expect(toBoolean("yes")).toBe(true);
      expect(toBoolean("active")).toBe(true);
    });

    it("recognizes falsy strings", () => {
      expect(toBoolean("false")).toBe(false);
      expect(toBoolean("0")).toBe(false);
      expect(toBoolean("no")).toBe(false);
      expect(toBoolean("inactive")).toBe(false);
      expect(toBoolean("disabled")).toBe(false);
    });

    it("uses provided default for unrecognized values", () => {
      expect(toBoolean("maybe", false)).toBe(false);
      expect(toBoolean("", true)).toBe(true);
    });
  });

  describe("toNumber", () => {
    it("passes through finite numbers", () => {
      expect(toNumber(42)).toBe(42);
      expect(toNumber(0)).toBe(0);
    });

    it("parses string numbers", () => {
      expect(toNumber("123.45")).toBe(123.45);
    });

    it("handles US currency format", () => {
      expect(toNumber("$1,234.56")).toBe(1234.56);
    });

    it("handles EU format", () => {
      expect(toNumber("1.234,56")).toBe(1234.56);
    });

    it("handles accounting negatives", () => {
      expect(toNumber("(100.00)")).toBe(-100);
    });

    it("returns default for non-parseable values", () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber("abc")).toBe(0);
      expect(toNumber("", 5)).toBe(5);
    });
  });
});

// ---------------------------------------------------------------------------
// OURS behaviors – cost/unit fuzzy matchers and strict map entries
// ---------------------------------------------------------------------------
describe("ours behaviors – cost/unit fields for ServiceTitan Materials/Equipment", () => {
  describe("pricebook fuzzy matchers for cost/unit", () => {
    it("fuzzy matches unitcost variants (with suffixes) to cost", () => {
      expect(getCanonicalKey("pricebook", "UnitCostUSD")).toBe("cost");
      expect(getCanonicalKey("pricebook", "Unit Cost (USD)")).toBe("cost");
    });

    it("exact matches cost to cost via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "Cost")).toBe("cost");
    });

    it("exact matches uom and unit to unit via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "UOM")).toBe("unit");
      expect(getCanonicalKey("pricebook", "Unit")).toBe("unit");
    });
  });

  describe("pricebook strict map cost/unit entries", () => {
    it("maps cost strict keys", () => {
      expect(getCanonicalKey("pricebook", "Cost")).toBe("cost");
      expect(getCanonicalKey("pricebook", "UnitCost")).toBe("cost");
      expect(getCanonicalKey("pricebook", "ItemCost")).toBe("cost");
      expect(getCanonicalKey("pricebook", "COGS")).toBe("cost");
    });

    it("maps unit strict keys", () => {
      expect(getCanonicalKey("pricebook", "UOM")).toBe("unit");
      expect(getCanonicalKey("pricebook", "Unit")).toBe("unit");
    });
  });
});

// ---------------------------------------------------------------------------
// THEIRS behaviors – IDs, variants, retailprice in pricebook
// ---------------------------------------------------------------------------
describe("theirs behaviors – IDs, variants, and retailprice for pricebook", () => {
  describe("pricebook fuzzy matchers for IDs and variants", () => {
    it("maps id and *itemid to st_id via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "ID")).toBe("st_id");
      expect(getCanonicalKey("pricebook", "ServiceItemID")).toBe("st_id");
      expect(getCanonicalKey("pricebook", "MaterialItemID")).toBe("st_id");
    });

    it("maps serviceid/materialid/equipmentid to st_parent_id via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "ServiceID")).toBe("st_parent_id");
      expect(getCanonicalKey("pricebook", "MaterialID")).toBe("st_parent_id");
      expect(getCanonicalKey("pricebook", "EquipmentID")).toBe("st_parent_id");
    });

    it("maps parentid to st_parent_id via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "ParentID")).toBe("st_parent_id");
    });

    it("maps variantname to variant_name via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "Variant Name")).toBe("variant_name");
      expect(getCanonicalKey("pricebook", "VariantNameCustom")).toBe(
        "variant_name"
      );
    });

    it("maps isdefault/isdefaultvariant/isprimary to is_default_variant via fuzzy", () => {
      expect(getCanonicalKey("pricebook", "IsDefault")).toBe(
        "is_default_variant"
      );
      expect(getCanonicalKey("pricebook", "IsDefaultVariant")).toBe(
        "is_default_variant"
      );
      expect(getCanonicalKey("pricebook", "IsPrimary")).toBe(
        "is_default_variant"
      );
    });
  });

  describe("pricebook strict map variant/ID entries", () => {
    it("maps id to st_id in strict map", () => {
      expect(getCanonicalKey("pricebook", "ID")).toBe("st_id");
    });

    it("maps serviceid, materialid, equipmentid, parentid to st_parent_id", () => {
      expect(getCanonicalKey("pricebook", "ServiceID")).toBe("st_parent_id");
      expect(getCanonicalKey("pricebook", "MaterialID")).toBe("st_parent_id");
      expect(getCanonicalKey("pricebook", "EquipmentID")).toBe("st_parent_id");
      expect(getCanonicalKey("pricebook", "ParentID")).toBe("st_parent_id");
    });

    it("maps variantname to variant_name in strict map", () => {
      expect(getCanonicalKey("pricebook", "VariantName")).toBe("variant_name");
    });

    it("maps isdefault and isprimary to is_default_variant in strict map", () => {
      expect(getCanonicalKey("pricebook", "IsDefault")).toBe(
        "is_default_variant"
      );
      expect(getCanonicalKey("pricebook", "IsPrimary")).toBe(
        "is_default_variant"
      );
    });
  });

  describe("pricebook retailprice maps to default_price in strict map", () => {
    it("maps RetailPrice to default_price", () => {
      expect(getCanonicalKey("pricebook", "RetailPrice")).toBe("default_price");
    });
  });
});

// ---------------------------------------------------------------------------
// End-to-end: simulated CSV header row mapping for pricebook
// ---------------------------------------------------------------------------
describe("end-to-end header mapping for a combined ServiceTitan pricebook export", () => {
  const csvHeaders = [
    "ID",
    "Code",
    "Name",
    "Description",
    "Type",
    "Category",
    "ServiceID",
    "VariantName",
    "IsDefault",
    "Unit Cost",
    "UOM",
    "DefaultPrice",
    "StaticPriceUSD",
    "UseStaticPrice",
    "MemberPrice",
    "RetailPrice",
    "IsActive",
  ];

  const expected = {
    ID: "st_id",
    Code: "sku",
    Name: "name",
    Description: "description",
    Type: "st_type",
    Category: "category",
    ServiceID: "st_parent_id",
    VariantName: "variant_name",
    IsDefault: "is_default_variant",
    "Unit Cost": "cost",
    UOM: "unit",
    DefaultPrice: "default_price",
    StaticPriceUSD: "static_price",
    UseStaticPrice: "use_static_price",
    MemberPrice: "membership_price",
    RetailPrice: "default_price",
    IsActive: "is_active",
  };

  it("maps every header to its expected canonical key", () => {
    const mapped = {};
    for (const h of csvHeaders) {
      mapped[h] = getCanonicalKey("pricebook", h);
    }
    expect(mapped).toEqual(expected);
  });
});
