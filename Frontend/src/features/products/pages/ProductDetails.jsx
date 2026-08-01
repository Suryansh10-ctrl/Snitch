import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useProduct } from "../hooks/useProduct";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { useCart } from "../../cart/hooks/useCart";
import { addToCart } from "../../cart/state/cart.slice";
import CartDrawer from "../../cart/components/CartDrawer";
import toast from "react-hot-toast";

const STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"];

const matchColorString = (a, b) => {
  if (!a || !b) return false;
  const strA = String(a).toLowerCase().trim();
  const strB = String(b).toLowerCase().trim();
  if (strA === strB) return true;
  const cleanA = strA.replace(/[^a-z0-9]/g, "");
  const cleanB = strB.replace(/[^a-z0-9]/g, "");
  if (cleanA === cleanB || (cleanA && cleanB && (cleanA.includes(cleanB) || cleanB.includes(cleanA)))) return true;
  const isBrownA = cleanA.includes("brow") || cleanA.includes("brwon");
  const isBrownB = cleanB.includes("brow") || cleanB.includes("brwon");
  if (isBrownA && isBrownB) return true;
  return false;
};

const getVariantAttr = (v, key) => {
  if (!v) return null;
  let val = null;
  let attrs = v.attributes;

  if (typeof attrs === "string") {
    try {
      attrs = JSON.parse(attrs);
    } catch (e) {
      // ignore
    }
  }

  if (attrs) {
    if (attrs instanceof Map) {
      val = attrs.get(key) || attrs.get(key.toLowerCase());
      if (!val && key === "color") val = attrs.get("colorName") || attrs.get("colorname");
      if (!val && key === "size") val = attrs.get("sizeName") || attrs.get("sizename");
    } else if (typeof attrs === "object") {
      Object.entries(attrs).forEach(([k, attrVal]) => {
        const lower = String(k).toLowerCase();
        if (key === "color" && (lower === "color" || lower === "colorname")) {
          val = attrVal;
        } else if (key === "size" && (lower === "size" || lower === "sizename")) {
          val = attrVal;
        } else if (key === k || lower === key.toLowerCase()) {
          val = attrVal;
        }
      });
    }
  }

  if (!val) {
    if (key === "size") val = v.size || v.sizeName;
    if (key === "color") val = v.color || v.colorName;
  }
  return val;
};

const getVariantImages = (v) => {
  if (!v) return [];
  let raw = [];
  if (Array.isArray(v.images) && v.images.length > 0) {
    raw = v.images;
  } else if (v.image) {
    raw = [v.image];
  } else if (v.attributes) {
    let attrs = v.attributes;
    if (typeof attrs === "string") {
      try {
        attrs = JSON.parse(attrs);
      } catch (e) {}
    }
    if (attrs && typeof attrs === "object") {
      if (Array.isArray(attrs.images) && attrs.images.length > 0) raw = attrs.images;
      else if (attrs.image) raw = [attrs.image];
    }
  }
  return raw.map((img) => (typeof img === "string" ? img : img?.url || img?.secure_url || "")).filter(Boolean);
};

const ProductDetails = () => {
  const dispatch = useDispatch();
  const { productId } = useParams();
  const navigate = useNavigate();
  const { handleGetProductById } = useProduct();
  const { handleAddItem } = useCart();
  const { handleLogout } = useAuth();
  const user = useSelector((state) => state.auth?.user);
  const cartItems = useSelector((state) => state.cart?.items || []);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // Multi-attribute selection state (e.g. { color: 'Brown', size: 'L' })
  const [selectedAttributes, setSelectedAttributes] = useState({});

  const [addedToBag, setAddedToBag] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [directBuyProduct, setDirectBuyProduct] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        setErrorMsg("");
        const data = await handleGetProductById(productId);
        if (data) {
          console.log("product:", data);
          setProduct(data);
        } else {
          setErrorMsg("Product details could not be found.");
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
        setErrorMsg("Failed to load product details. Product may not exist.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Extract all normalized unique attribute keys across base product and variants
  const attributeKeys = useMemo(() => {
    const keysSet = new Set();
    keysSet.add("color");
    keysSet.add("size");

    if (product?.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        if (v.attributes) {
          if (v.attributes instanceof Map) {
            v.attributes.forEach((_, k) => {
              const lower = k.toLowerCase();
              if (lower === "colorname" || lower === "color") keysSet.add("color");
              else if (lower === "sizename" || lower === "size") keysSet.add("size");
              else keysSet.add(k);
            });
          } else if (typeof v.attributes === "object") {
            Object.keys(v.attributes).forEach((k) => {
              const lower = k.toLowerCase();
              if (lower === "colorname" || lower === "color") keysSet.add("color");
              else if (lower === "sizename" || lower === "size") keysSet.add("size");
              else keysSet.add(k);
            });
          }
        }
      });
    }
    return Array.from(keysSet);
  }, [product]);

  // Extract unique available values for each normalized attribute key (using product.color)
  const attributeOptionsMap = useMemo(() => {
    const map = {};
    attributeKeys.forEach((key) => {
      const valSet = new Set();

      if (key === "color" && product?.color && String(product.color).trim()) {
        valSet.add(String(product.color).trim());
      }

      if (product?.variants && product.variants.length > 0) {
        product.variants.forEach((v) => {
          const val = getVariantAttr(v, key);
          if (val !== null && val !== undefined && String(val).trim()) {
            valSet.add(String(val).trim());
          }
        });
      }

      if (key.toLowerCase() === "size") {
        STANDARD_SIZES.forEach((s) => valSet.add(s));
      }

      map[key] = Array.from(valSet);
    });
    return map;
  }, [product, attributeKeys]);

  // Initialize selectedAttributes with base product color or first variant
  useEffect(() => {
    if (product) {
      const initial = {};

      if (product.color && String(product.color).trim()) {
        initial["color"] = String(product.color).trim();
      }

      if (product.variants && product.variants.length > 0) {
        const firstInStock =
          product.variants.find((v) => (v.stock !== undefined ? Number(v.stock) : 1) > 0) ||
          product.variants[0];

        attributeKeys.forEach((key) => {
          const val = getVariantAttr(firstInStock, key);
          if (val) initial[key] = String(val).trim();
        });
      }

      attributeKeys.forEach((key) => {
        if (!initial[key]) {
          const opts = attributeOptionsMap[key] || [];
          if (opts.length > 0) {
            initial[key] = opts[0];
          }
        }
      });

      setSelectedAttributes(initial);
    }
  }, [product, attributeKeys, attributeOptionsMap]);

  // Helper to check stock status for any option
  const getOptionStockStatus = (key, optionVal) => {
    if (!product?.variants || !product.variants.length) {
      return product?.stock !== undefined ? Number(product.stock) : 10;
    }

    if (key === "color" && product?.color && matchColorString(optionVal, product.color)) {
      return product?.stock !== undefined ? Number(product.stock) : 10;
    }

    const matchingVariants = product.variants.filter((v) => {
      const val = getVariantAttr(v, key);
      if (key === "color") return matchColorString(val, optionVal);
      return val && String(val).toLowerCase() === String(optionVal).toLowerCase();
    });

    if (matchingVariants.length === 0) {
      return product?.stock !== undefined ? Number(product.stock) : 10;
    }

    return matchingVariants.reduce((acc, v) => acc + (v.stock !== undefined ? Number(v.stock) : 10), 0);
  };

  // Find active variant using score matching (combining selected color, size, and other specs)
  const activeVariant = useMemo(() => {
    if (!product?.variants || !product.variants.length) return null;
    const selectedKeys = Object.keys(selectedAttributes).filter((k) => !!selectedAttributes[k]);
    if (selectedKeys.length === 0) return product.variants[0];

    let bestVariant = null;
    let maxScore = -1;

    product.variants.forEach((v) => {
      let score = 0;
      selectedKeys.forEach((key) => {
        const selectedVal = selectedAttributes[key];
        const variantVal = getVariantAttr(v, key);

        if (key === "color") {
          if (matchColorString(variantVal, selectedVal)) score += 3;
        } else if (key === "size") {
          if (variantVal && String(variantVal).toLowerCase() === String(selectedVal).toLowerCase()) score += 2;
        } else if (variantVal && String(variantVal).toLowerCase() === String(selectedVal).toLowerCase()) {
          score += 1;
        }
      });

      if (score > maxScore) {
        maxScore = score;
        bestVariant = v;
      }
    });

    return bestVariant || product.variants[0];
  }, [product, selectedAttributes]);

  // Dynamic Price Amount: Active variant price override > Base product price
  const activePriceAmount = useMemo(() => {
    if (activeVariant) {
      const p = activeVariant.price;
      if (typeof p === "number" && !isNaN(p) && p > 0) return p;
      if (typeof p === "object" && p?.amount !== undefined && Number(p.amount) > 0) return Number(p.amount);
    }
    return product?.price?.amount ?? 0;
  }, [activeVariant, product]);

  const activeCurrency = useMemo(() => {
    if (activeVariant) {
      const p = activeVariant.price;
      if (typeof p === "object" && p?.currency) return p.currency;
      if (activeVariant.currency) return activeVariant.currency;
    }
    return product?.price?.currency ?? "INR";
  }, [activeVariant, product]);

  const inCartQty = useMemo(() => {
    if (!product) return 0;
    const rawProdId = String(product._id).split("_")[0];
    const targetVariantId = activeVariant?._id ? String(activeVariant._id).split("_")[0] : null;
    return cartItems.reduce((acc, item) => {
      const itemProdId = String(item.product?._id || item.product).split("_")[0];
      const itemVariantId = item.variant ? String(item.variant).split("_")[0] : null;
      const isMatch = itemProdId === rawProdId && (targetVariantId ? itemVariantId === targetVariantId : true);
      return isMatch ? acc + Number(item.quantity || 1) : acc;
    }, 0);
  }, [cartItems, product, activeVariant]);

  const totalStock = useMemo(() => {
    if (activeVariant && activeVariant.stock !== undefined && activeVariant.stock !== null) {
      return Number(activeVariant.stock);
    }
    return product?.stock !== undefined ? Number(product.stock) : 10;
  }, [activeVariant, product]);

  const activeStock = Math.max(0, totalStock - inCartQty);
  const isOutOfStock = totalStock <= 0 || activeStock <= 0;

  const formatCurrency = (amount, currency = "INR") => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
    const symbol = symbols[currency] || "₹";
    return `${symbol}${Number(amount || 0).toLocaleString()}`;
  };

  const handleSelectAttribute = (key, val) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [key]: val,
    }));
    setSelectedImageIndex(0);
  };
  // Images Lookup: Active variant images > Color-matched variant images > Color-matched product images > Base product images
  const displayImages = useMemo(() => {
    let rawImages = [];

    // 1. Try active variant images
    const activeVImgs = getVariantImages(activeVariant);
    if (activeVImgs.length > 0) {
      rawImages = activeVImgs;
    }

    // 2. Try images from any variant matching the selected color
    if (rawImages.length === 0 && selectedAttributes.color && product?.variants?.length > 0) {
      const selectedColor = selectedAttributes.color;
      for (const v of product.variants) {
        const vColor = getVariantAttr(v, "color");
        if (matchColorString(vColor, selectedColor)) {
          const vImgs = getVariantImages(v);
          if (vImgs.length > 0) {
            rawImages = vImgs;
            break;
          }
        }
      }
    }

    // 3. Fall back to base product images
    if (rawImages.length === 0 && Array.isArray(product?.images) && product.images.length > 0) {
      const baseImages = product.images.map((img) => (typeof img === "string" ? img : img?.url || img?.secure_url || "")).filter(Boolean);
      
      // If a color is selected, check if any base product images match the color in URL, alt, or color property
      if (selectedAttributes.color) {
        const selectedColor = selectedAttributes.color;
        const colorMatchedProductImgs = product.images.filter((img) => {
          if (typeof img === "object" && img) {
            if (img.color && matchColorString(img.color, selectedColor)) return true;
            if (img.colorName && matchColorString(img.colorName, selectedColor)) return true;
          }
          const urlStr = typeof img === "string" ? img : img?.url || img?.secure_url || "";
          return matchColorString(urlStr, selectedColor);
        }).map((img) => (typeof img === "string" ? img : img?.url || img?.secure_url || "")).filter(Boolean);

        if (colorMatchedProductImgs.length > 0) {
          rawImages = colorMatchedProductImgs;
        } else {
          rawImages = baseImages;
        }
      } else {
        rawImages = baseImages;
      }
    }

    return rawImages
      .map((img) => (typeof img === "string" ? img : img?.url || img?.secure_url || ""))
      .filter(Boolean);
  }, [activeVariant, product, selectedAttributes]);

  const handleAddToCartClick = async () => {
    if (!product) return;
    if (!user) {
      setShowAuthModal(true);
      toast.error("Please log in to add items to your shopping bag.");
      return;
    }

    if (isOutOfStock) {
      toast.error(totalStock <= 0 ? "Sorry, this item is Out of Stock! ❌" : "All available stock for this item is already in your bag! 🎒");
      return;
    }

    const selectedEntries = Object.entries(selectedAttributes).filter(([, v]) => !!v);
    const variantTitleSuffix = selectedEntries.length
      ? ` (${selectedEntries.map(([k, v]) => `${k}: ${v}`).join(" / ")})`
      : "";

    const targetProduct = {
      ...product,
      _id: activeVariant ? `${product._id}_${activeVariant._id}` : product._id,
      title: `${product.title}${variantTitleSuffix}`,
      price: { amount: activePriceAmount, currency: activeCurrency },
      images: displayImages.length > 0 ? displayImages : product.images,
    };

    const rawProductId = String(product._id).split("_")[0];
    const rawVariantId = activeVariant?._id ? String(activeVariant._id).split("_")[0] : null;

    await handleAddItem({
      productId: rawProductId,
      variantId: rawVariantId,
      quantity,
      product: targetProduct,
      attributes: selectedAttributes,
      color: selectedAttributes.color || product.color,
      size: selectedAttributes.size || product.size,
    });

    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (!product) return;
    if (!user) {
      setShowAuthModal(true);
      toast.error("Please log in to proceed to checkout.");
      return;
    }

    if (isOutOfStock) {
      toast.error(totalStock <= 0 ? "Sorry, this item is Out of Stock! ❌" : "All available stock for this item is already in your bag! 🎒");
      return;
    }

    const selectedEntries = Object.entries(selectedAttributes).filter(([, v]) => !!v);
    const variantTitleSuffix = selectedEntries.length
      ? ` (${selectedEntries.map(([k, v]) => `${k}: ${v}`).join(" / ")})`
      : "";

    const targetProduct = {
      ...product,
      _id: activeVariant ? `${product._id}_${activeVariant._id}` : product._id,
      title: `${product.title}${variantTitleSuffix}`,
      price: { amount: activePriceAmount, currency: activeCurrency },
      images: displayImages.length > 0 ? displayImages : product.images,
    };

    setDirectBuyProduct({ product: targetProduct, quantity });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-[#191c1d] font-sans antialiased selection:bg-[#ff851b] selection:text-white flex flex-col justify-between">

      {/* Main Product Showcase Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex-1 w-full flex flex-col justify-center">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
            <div className="lg:col-span-6 h-96 bg-slate-200 rounded-3xl" />
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
              <div className="h-6 bg-slate-200 rounded-xl w-1/2" />
              <div className="h-32 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        ) : errorMsg || !product ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-4 my-auto max-w-lg mx-auto shadow-md">
            <h2 className="text-xl font-bold text-slate-900">Product Unavailable</h2>
            <p className="text-xs text-slate-500">{errorMsg}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#000613] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
            >
              Back to SNITCH. Shop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Vertical Thumbnails Strip + Portrait Main Image (Less Width, More Height) */}
            <div className="lg:col-span-6 flex items-start justify-center gap-3">
              
              {/* Vertical Thumbnail Strip on Left */}
              {displayImages.length > 1 && (
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] py-1 shrink-0">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-18 sm:w-16 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImageIndex === idx
                          ? "border-[#ff851b] scale-105 shadow-md ring-2 ring-[#ff851b]/30"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Portrait Main Image Container */}
              <div
                onClick={() => setShowLightbox(true)}
                className="relative w-full max-w-[340px] sm:max-w-[370px] lg:max-w-[390px] h-[440px] sm:h-[480px] lg:h-[500px] rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-md cursor-pointer group shrink-0"
              >
                {displayImages.length > 0 ? (
                  <img
                    src={displayImages[selectedImageIndex] || displayImages[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No Image Available
                  </div>
                )}

                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#001f3f] text-[#ffdcc7] shadow-sm">
                  SNITCH EDITORIAL
                </div>

                <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  <span>Zoom Photo</span>
                  <span>🔍</span>
                </div>
              </div>

            </div>

            {/* Right Column: Product Specs & Purchase Panel */}
            <div className="lg:col-span-6 space-y-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              
              {/* Product Header */}
              <div className="space-y-1.5 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeStock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${activeStock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    {activeStock > 0
                      ? `IN STOCK (${activeStock} AVAILABLE)`
                      : (inCartQty > 0 ? "ALL ITEMS IN BAG (OUT OF STOCK)" : "OUT OF STOCK")}
                  </div>

                  {product.seller?.fullname && (
                    <span className="text-[11px] font-bold text-slate-400">
                      Seller: {product.seller.fullname}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000613] tracking-tight leading-snug">
                  {product.title}
                </h1>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[#964900]">
                    {formatCurrency(activePriceAmount, activeCurrency)}
                  </span>
                </div>
              </div>

              {/* Dynamic Multi-Attribute Variant Selectors */}
              {attributeKeys.length > 0 && (
                <div className="space-y-3.5 border-b border-slate-100 pb-4">
                  {attributeKeys.map((key) => {
                    const options = attributeOptionsMap[key] || [];
                    const currentSelected = selectedAttributes[key] || (options.length > 0 ? options[0] : "");

                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#964900]">
                            Select {key}: <span className="text-slate-900 font-extrabold capitalize">{currentSelected}</span>
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {options.map((val) => {
                            const isSelected = currentSelected && (key === "color" ? matchColorString(currentSelected, val) : currentSelected.toLowerCase() === val.toLowerCase());
                            const stockCount = getOptionStockStatus(key, val);
                            const isAvailable = stockCount > 0;

                            const hexColor =
                              val.toLowerCase().includes("black") ? "#1a1a1a" :
                              val.toLowerCase().includes("white") ? "#ffffff" :
                              val.toLowerCase().includes("grey") || val.toLowerCase().includes("gray") ? "#808080" :
                              val.toLowerCase().includes("red") || val.toLowerCase().includes("bordeaux") ? "#8b0000" :
                              val.toLowerCase().includes("champagne") ? "#f5e6cc" :
                              val.toLowerCase().includes("brown") || val.toLowerCase().includes("brwon") ? "#653818" :
                              val.toLowerCase().includes("blue") ? "#001f3f" : "#cbd5e1";

                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleSelectAttribute(key, val)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 relative ${
                                  isSelected
                                    ? "bg-[#000613] text-white border-[#000613] shadow-md scale-105"
                                    : isAvailable
                                    ? "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                                    : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-65"
                                }`}
                              >
                                {key.toLowerCase() === "color" && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: hexColor }}
                                  />
                                )}

                                <span className="capitalize">{val}</span>

                                {!isAvailable && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 no-underline ml-1">
                                    Out of stock
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Overview & Craftsmanship Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Overview & Craftsmanship
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {product.description}
                </p>
              </div>

              {/* Quantity Picker & Action CTAs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Quantity:
                  </span>
                  <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-slate-700 hover:bg-slate-200 font-bold text-sm transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-extrabold text-slate-900 min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 text-slate-700 hover:bg-slate-200 font-bold text-sm transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCartClick}
                    disabled={activeStock <= 0}
                    className={`font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                      activeStock <= 0
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-80"
                        : "bg-[#000613] hover:bg-[#001f3f] text-white"
                    }`}
                  >
                    <span>
                      {addedToBag
                        ? "✓ Added to Bag!"
                        : activeStock <= 0
                        ? (inCartQty > 0 ? "All Items in Bag" : "Out of Stock")
                        : "Add to Bag"}
                    </span>
                  </button>

                  <button
                    onClick={handleBuyNowClick}
                    disabled={activeStock <= 0}
                    className={`font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${
                      activeStock <= 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60"
                        : "bg-[#ff851b] hover:bg-[#e07010] text-white"
                    }`}
                  >
                    <span>{activeStock <= 0 ? "Out of Stock" : "Buy Now"}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Sleek Compact Footer */}
      <footer className="bg-[#000613] text-white py-2.5 border-t border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-extrabold tracking-tight text-white text-xs">SNITCH.</span>
          <p>© 2026 SNITCH. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Photo Lightbox */}
      {showLightbox && displayImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 max-w-6xl mx-auto w-full">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#ffdcc7]">
                {product?.title}
              </h3>
              <p className="text-xs text-[#ff851b] font-extrabold">
                {formatCurrency(activePriceAmount, activeCurrency)} • Photo {selectedImageIndex + 1} of {displayImages.length}
              </p>
            </div>

            <button
              onClick={() => setShowLightbox(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors text-base"
            >
              ×
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative my-3 max-w-5xl mx-auto w-full overflow-hidden">
            {displayImages.length > 1 && (
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                className="absolute left-2 sm:left-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/10 hover:bg-[#ff851b] hover:text-white text-white flex items-center justify-center transition-all shadow-xl"
              >
                ‹
              </button>
            )}

            <img
              src={displayImages[selectedImageIndex]}
              alt={product?.title}
              className="max-h-[65vh] max-w-full object-contain rounded-2xl border border-white/10 shadow-2xl transition-all duration-300"
            />

            {displayImages.length > 1 && (
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % displayImages.length)}
                className="absolute right-2 sm:right-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/10 hover:bg-[#ff851b] hover:text-white text-white flex items-center justify-center transition-all shadow-xl"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}

      {/* Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setDirectBuyProduct(null);
        }}
        directBuyProduct={directBuyProduct}
      />

      {/* Authentication Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-4 text-center shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl mx-auto font-bold">
              🔒
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[#000613]">Authentication Required</h3>
              <p className="text-xs text-slate-500">
                Please log in or create an account to add items to your shopping bag and complete your purchase.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-[#000613] hover:bg-[#001f3f] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all"
              >
                Sign In / Register →
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;
