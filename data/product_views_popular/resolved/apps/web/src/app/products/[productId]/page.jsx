"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SiteHeader from "@/components/SiteHeader";
import useCartStore from "@/utils/cartStore";
import useUpload from "@/utils/useUpload";
import { useProductOptions } from "@/hooks/useProductOptions";
import { useProductPrice } from "@/hooks/useProductPrice";
import { ProductNotFound } from "@/components/ProductDetail/ProductNotFound";
import { ProductBreadcrumb } from "@/components/ProductDetail/ProductBreadcrumb";
import { ProductImage } from "@/components/ProductDetail/ProductImage";
import { ProductHeader } from "@/components/ProductDetail/ProductHeader";
import { AlertMessage } from "@/components/ProductDetail/AlertMessage";
import { ProductCustomization } from "@/components/ProductDetail/ProductCustomization";
import { PriceDisplay } from "@/components/ProductDetail/PriceDisplay";
import { ProductDetailsInfo } from "@/components/ProductDetail/ProductDetailsInfo";

async function fetchProduct(slug) {
  const response = await fetch(`/api/products/${slug}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `When fetching /api/products/${slug}, the response was [${response.status}] ${response.statusText}: ${text}`,
    );
  }
  return response.json();
}

async function fetchDesigns() {
  const response = await fetch("/api/designs");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `When fetching /api/designs, the response was [${response.status}] ${response.statusText}: ${text}`,
    );
  }
  return response.json();
}

async function recordProductView(slug) {
  const response = await fetch("/api/product-views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `When posting /api/product-views, the response was [${response.status}] ${response.statusText}: ${text}`,
    );
  }

  return response.json();
}

function safeParseOptions(options) {
  if (!options) {
    return {};
  }
  if (typeof options === "object") {
    return options;
  }
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
      return {};
    } catch (e) {
      return {};
    }
  }
  return {};
}

function normalizeProduct(dbProduct) {
  if (!dbProduct) {
    return null;
  }

  const optionsRaw = safeParseOptions(dbProduct.options);

  const baseQuantity = Number(dbProduct.base_quantity ?? 1);
  const safeBaseQuantity =
    Number.isFinite(baseQuantity) && baseQuantity > 0 ? baseQuantity : 1;

  const makeSingle = (label) => [
    { value: "default", label, priceMultiplier: 1 },
  ];

  const sizes =
    Array.isArray(optionsRaw.sizes) && optionsRaw.sizes.length > 0
      ? optionsRaw.sizes
      : makeSingle("Default");
  const paperTypes =
    Array.isArray(optionsRaw.paperTypes) && optionsRaw.paperTypes.length > 0
      ? optionsRaw.paperTypes
      : makeSingle("Standard");
  const finishes =
    Array.isArray(optionsRaw.finishes) && optionsRaw.finishes.length > 0
      ? optionsRaw.finishes
      : makeSingle("Standard");
  const turnaround =
    Array.isArray(optionsRaw.turnaround) && optionsRaw.turnaround.length > 0
      ? optionsRaw.turnaround
      : makeSingle("Standard");

  const quantities =
    Array.isArray(optionsRaw.quantities) && optionsRaw.quantities.length > 0
      ? optionsRaw.quantities
      : [safeBaseQuantity];

  const allowedDesignSlugs = Array.isArray(optionsRaw.allowedDesignSlugs)
    ? optionsRaw.allowedDesignSlugs
        .map((s) => String(s || "").trim())
        .filter(Boolean)
    : [];

  return {
    slug: dbProduct.slug,
    name: dbProduct.name,
    category: dbProduct.category,
    description: dbProduct.description,
    image: dbProduct.image_url,
    basePrice: Number(dbProduct.base_price ?? 0),
    baseQuantity: safeBaseQuantity,
    allowedDesignSlugs,
    options: {
      sizes,
      paperTypes,
      finishes,
      quantities,
      turnaround,
    },
  };
}

export default function ProductDetailPage({ params }) {
  const { productId } = params; // slug

  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    retry: false,
  });

  const currentProduct = useMemo(() => {
    const dbProduct = productQuery.data?.product || null;
    return normalizeProduct(dbProduct);
  }, [productQuery.data]);

  useEffect(() => {
    // Track product views for "most viewed" popularity.
    // We throttle client-side so refresh spam doesn't dominate.
    if (typeof window === "undefined") {
      return;
    }

    if (!productId) {
      return;
    }

    const throttleMs = 30 * 60 * 1000; // 30 minutes
    const storageKey = `productView:last:${productId}`;

    try {
      const now = Date.now();
      const lastRaw = window.localStorage.getItem(storageKey);
      const last = Number(lastRaw);

      if (Number.isFinite(last) && now - last < throttleMs) {
        return;
      }

      window.localStorage.setItem(storageKey, String(now));

      recordProductView(productId).catch((error) => {
        console.error(error);
      });
    } catch (error) {
      // If storage is blocked (private mode, etc), just attempt once.
      recordProductView(productId).catch((err) => console.error(err));
    }
  }, [productId]);

  const wantsDesigns = useMemo(() => {
    const slugs = currentProduct?.allowedDesignSlugs;
    return Array.isArray(slugs) && slugs.length > 0;
  }, [currentProduct]);

  const designsQuery = useQuery({
    queryKey: ["designs"],
    queryFn: fetchDesigns,
    enabled: !!currentProduct && wantsDesigns,
  });

  const allowedDesigns = useMemo(() => {
    const slugs = currentProduct?.allowedDesignSlugs;
    const allDesigns = designsQuery.data?.designs || [];

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [];
    }

    const allow = new Set(slugs);
    const filtered = allDesigns.filter((d) => allow.has(d?.slug));
    filtered.sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
    return filtered;
  }, [currentProduct, designsQuery.data]);

  const [upload, { loading: uploading }] = useUpload();

  const addItem = useCartStore((s) => s.addItem);
  const hydrated = useCartStore((s) => s.hydrated);
  const hydrate = useCartStore((s) => s.hydrate);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  const [selectedOptions, setSelectedOptions] =
    useProductOptions(currentProduct);

  const calculatedPrice = useProductPrice(currentProduct, selectedOptions);
  const calculatedPriceLabel = calculatedPrice.toFixed(2);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = await upload({ base64: e.target.result });

      if (result.error) {
        setError("Failed to upload file. Please try again.");
        return;
      }

      setUploadedFile({
        name: file.name,
        url: result.url,
        mimeType: result.mimeType,
      });
    };

    reader.onerror = () => {
      setError("Could not read the selected file.");
    };

    reader.readAsDataURL(file);
  };

  const handleAddToCart = () => {
    setError(null);
    setSuccess(null);

    if (!currentProduct || !selectedOptions) {
      setError("Please wait for the product options to load.");
      return;
    }

    const cartItemId = `${currentProduct.slug}-${Date.now()}-${Math.random()}`;

    const sizeObj = currentProduct.options.sizes.find(
      (s) => s.value === selectedOptions.size,
    );
    const paperObj = currentProduct.options.paperTypes.find(
      (p) => p.value === selectedOptions.paperType,
    );
    const finishObj = currentProduct.options.finishes.find(
      (f) => f.value === selectedOptions.finish,
    );
    const turnaroundObj = currentProduct.options.turnaround.find(
      (t) => t.value === selectedOptions.turnaround,
    );

    const selectedDesignSlug = selectedOptions.designSlug || "";
    const selectedDesign = allowedDesigns.find(
      (d) => d?.slug === selectedDesignSlug,
    );

    addItem({
      id: cartItemId,
      productId, // slug
      name: currentProduct.name,
      image: currentProduct.image,
      lineTotal: Number(calculatedPriceLabel),
      artwork: uploadedFile,
      options: {
        size: selectedOptions.size,
        sizeLabel: sizeObj?.label,
        paperType: selectedOptions.paperType,
        paperTypeLabel: paperObj?.label,
        finish: selectedOptions.finish,
        finishLabel: finishObj?.label,
        quantity: selectedOptions.quantity,
        turnaround: selectedOptions.turnaround,
        turnaroundLabel: turnaroundObj?.label,
        designSlug: selectedDesignSlug,
        designName: selectedDesign?.name,
        designImage: selectedDesign?.image_url,
      },
    });

    setSuccess("Added to cart. You can check out any time.");
  };

  const isNotFound =
    !!productQuery.error &&
    String(productQuery.error?.message || "").includes("[404]");

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="bg-white rounded-lg p-8">Loading product…</div>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <SiteHeader />
        <ProductNotFound />
      </div>
    );
  }

  if (productQuery.error) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <p className="text-red-700">Could not load product.</p>
            <a href="/products" className="underline text-gray-700">
              Back to products
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct || !selectedOptions) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="bg-white rounded-lg p-8">Preparing options…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <ProductBreadcrumb productName={currentProduct.name} />

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <ProductImage image={currentProduct.image} name={currentProduct.name} />

          <div className="bg-white rounded-lg p-8">
            <ProductHeader
              category={currentProduct.category}
              name={currentProduct.name}
              description={currentProduct.description}
            />

            {success && (
              <AlertMessage
                type="success"
                message={success}
                linkText="View cart"
                linkHref="/cart"
              />
            )}
            {error && <AlertMessage type="error" message={error} />}

            <ProductCustomization
              product={currentProduct}
              designs={allowedDesigns}
              selectedOptions={selectedOptions}
              onOptionChange={setSelectedOptions}
              uploadedFile={uploadedFile}
              uploading={uploading}
              onFileUpload={handleFileUpload}
            />

            <div className="border-t border-gray-200 pt-6">
              <PriceDisplay
                price={calculatedPriceLabel}
                quantity={selectedOptions.quantity}
              />

              <button
                onClick={handleAddToCart}
                className="w-full bg-[#E07A7A] hover:bg-[#d06666] text-white font-semibold py-4 px-6 rounded-lg transition-colors"
              >
                Add to Cart
              </button>

              <div className="mt-4 text-sm text-gray-600">
                Prefer to keep shopping?{" "}
                <a href="/products" className="underline">
                  Back to products
                </a>
              </div>
            </div>
          </div>
        </div>

        <ProductDetailsInfo />
      </div>
    </div>
  );
}
