import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useProduct } from "../hooks/useProduct";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSelector } from "react-redux";

const SellerProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { handleGetProductById, handleAddVariant, handleUpdateVariantDetails, handleDeleteVariant, handleUpdateStock, handleUpdateProduct, handleDeleteProduct } = useProduct();
  const { handleLogout } = useAuth();
  const user = useSelector((state) => state.auth?.user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Edit Product State
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriceAmount, setEditPriceAmount] = useState("");

  // Edit Variant State & Modal
  const [editingVariant, setEditingVariant] = useState(null);
  const [editVariantPrice, setEditVariantPrice] = useState("");
  const [editVariantStock, setEditVariantStock] = useState("");
  const [editVariantSku, setEditVariantSku] = useState("");
  const [editVariantExistingImages, setEditVariantExistingImages] = useState([]);
  const [editVariantImageFiles, setEditVariantImageFiles] = useState([]);
  const [editVariantImagePreviews, setEditVariantImagePreviews] = useState([]);

  // Stock edit state map
  const [stockInputs, setStockInputs] = useState({});

  // New variant state
  const [newVariant, setNewVariant] = useState({
    sku: "",
    size: "M",
    color: "Champagne",
    stock: 10,
    priceAmount: "",
  });

  // Variant Image Files & Previews for creation
  const [variantImageFiles, setVariantImageFiles] = useState([]);
  const [variantImagePreviews, setVariantImagePreviews] = useState([]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await handleGetProductById(productId);
      const fetched = data?.product || data;
      setProduct(fetched);
      if (fetched) {
        setEditTitle(fetched.title || "");
        setEditDescription(fetched.description || "");
        setEditPriceAmount(fetched.price?.amount || "");
      }
    } catch (err) {
      console.error("Failed to load product for variant management:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchProduct();
  }, [productId]);

  const handleStockInputChange = (variantId, val) => {
    setStockInputs((prev) => ({ ...prev, [variantId]: val }));
  };

  const handleSaveStock = async (variantId) => {
    const qty = Number(stockInputs[variantId]);
    if (isNaN(qty) || qty < 0) {
      alert("Please enter a valid non-negative stock count.");
      return;
    }
    try {
      await handleUpdateStock({ productId, variantId, stock: qty });
      setSuccessMsg("Stock updated successfully!");
      setTimeout(() => setSuccessMsg(""), 2500);
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update stock.");
    }
  };

  const handleDeleteVariantSubmit = async (v) => {
    const label = `${v.attributes?.color || v.color || "Variant"} ${v.attributes?.size || v.size || ""}`.trim();
    if (!window.confirm(`Are you sure you want to delete variant "${label}"?`)) {
      return;
    }
    try {
      await handleDeleteVariant(productId, v._id);
      setSuccessMsg(`Variant "${label}" deleted successfully!`);
      setTimeout(() => setSuccessMsg(""), 2500);
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete variant.");
    }
  };

  const openEditVariantModal = (v) => {
    setEditingVariant(v);
    const p = typeof v.price === "object" ? v.price?.amount : v.price;
    setEditVariantPrice(p !== undefined ? p : product?.price?.amount || "");
    setEditVariantStock(v.stock !== undefined ? v.stock : 10);
    setEditVariantSku(v.sku || "");
    
    const existingList = Array.isArray(v.images)
      ? v.images.map((img) => (typeof img === "string" ? img : img?.url || "")).filter(Boolean)
      : [];
    setEditVariantExistingImages(existingList);
    setEditVariantImageFiles([]);
    setEditVariantImagePreviews([]);
  };

  const removeExistingVariantImage = (index) => {
    setEditVariantExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditVariantImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = [...editVariantImageFiles, ...files];
    setEditVariantImageFiles(newFiles);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setEditVariantImagePreviews(newPreviews);
  };

  const removeEditVariantImage = (index) => {
    const updatedFiles = editVariantImageFiles.filter((_, i) => i !== index);
    const updatedPreviews = editVariantImagePreviews.filter((_, i) => i !== index);
    setEditVariantImageFiles(updatedFiles);
    setEditVariantImagePreviews(updatedPreviews);
  };

  const handleEditVariantSubmit = async (e) => {
    e.preventDefault();
    if (!editingVariant) return;
    try {
      const formData = new FormData();
      if (editVariantPrice) formData.append("price", Number(editVariantPrice));
      if (editVariantStock !== undefined) formData.append("stock", Number(editVariantStock));
      if (editVariantSku) formData.append("sku", editVariantSku.trim());
      formData.append("existingImages", JSON.stringify(editVariantExistingImages));

      editVariantImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await handleUpdateVariantDetails(productId, editingVariant._id, formData);
      setSuccessMsg("Variant price, stock & images updated!");
      setTimeout(() => setSuccessMsg(""), 2500);
      setEditingVariant(null);
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update variant details.");
    }
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleUpdateProduct(productId, {
        title: editTitle,
        description: editDescription,
        priceAmount: editPriceAmount,
      });
      setSuccessMsg("Product listing updated!");
      setTimeout(() => setSuccessMsg(""), 2500);
      setShowEditProductModal(false);
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update product.");
    }
  };

  const handleDeleteProductSubmit = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${product.title}"?`)) {
      return;
    }
    try {
      await handleDeleteProduct(productId);
      alert(`"${product.title}" has been deleted.`);
      navigate("/seller/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleVariantImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = [...variantImageFiles, ...files];
    setVariantImageFiles(newFiles);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setVariantImagePreviews(newPreviews);
  };

  const removeVariantImage = (index) => {
    const updatedFiles = variantImageFiles.filter((_, i) => i !== index);
    const updatedPreviews = variantImagePreviews.filter((_, i) => i !== index);
    setVariantImageFiles(updatedFiles);
    setVariantImagePreviews(updatedPreviews);
  };

  const handleAddVariantSubmit = async (e) => {
    e.preventDefault();
    if (!newVariant.sku.trim() || !newVariant.size.trim() || !newVariant.color.trim()) {
      alert("Please fill in SKU, Size, and Color.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("sku", newVariant.sku.trim());
      formData.append("stock", Number(newVariant.stock) || 0);
      formData.append(
        "attributes",
        JSON.stringify({
          color: newVariant.color.trim(),
          size: newVariant.size.trim(),
          colorName: newVariant.color.trim(),
          sizeName: newVariant.size.trim(),
        })
      );
      if (newVariant.priceAmount) {
        formData.append("price", Number(newVariant.priceAmount));
        formData.append("currency", product?.price?.currency || "INR");
      }

      variantImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await handleAddVariant(productId, formData);

      setShowAddVariantModal(false);
      setNewVariant({ sku: "", size: "M", color: "Champagne", stock: 10, priceAmount: "" });
      setVariantImageFiles([]);
      setVariantImagePreviews([]);
      setSuccessMsg("New variant created with images!");
      setTimeout(() => setSuccessMsg(""), 2500);
      fetchProduct();
    } catch (err) {
      console.error("Variant Creation Error:", err);
      alert(err.response?.data?.message || "Failed to create variant.");
    }
  };

  const formatCurrency = (amount, currency = "INR") => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
    const symbol = symbols[currency] || "₹";
    return `${symbol}${Number(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-slate-600 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#000613] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading Seller Center...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center text-slate-800 font-sans space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <button
          onClick={() => navigate("/seller/dashboard")}
          className="bg-[#000613] text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Return to Seller Dashboard
        </button>
      </div>
    );
  }

  const variants = product.variants || [];
  const filteredVariants = variants.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const colorVal = v.attributes?.color || v.color || "";
    const sizeVal = v.attributes?.size || v.size || "";
    return (
      v.sku?.toLowerCase().includes(q) ||
      colorVal.toLowerCase().includes(q) ||
      sizeVal.toLowerCase().includes(q)
    );
  });

  const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  const mainImage =
    Array.isArray(product.images) && product.images.length > 0
      ? typeof product.images[0] === "string"
        ? product.images[0]
        : product.images[0]?.url || ""
      : "";

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-[#f8f9fa] text-[#191c1d] font-sans antialiased">
      
      {/* Side Navigation Bar */}
      <aside className="hidden md:flex h-full w-64 flex-col bg-[#f3f4f5] border-r border-slate-200 transition-all duration-300 shrink-0">
        <div className="p-4 flex flex-col h-full gap-2">
          
          {/* Header Profile */}
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#001f3f] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {(user?.fullname || user?.email || "M")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-[#000613] tracking-tight truncate">
                Seller Center
              </h1>
              <p className="text-slate-500 text-[11px] font-semibold truncate">
                {user?.fullname || "Premium Merchant"}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-grow">
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all font-semibold text-xs text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/seller/dashboard")}
              className="flex items-center gap-3 px-4 py-3 bg-[#ff851b] text-white rounded-xl font-bold text-xs text-left shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products & Variants</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all font-semibold text-xs text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>View Storefront</span>
            </button>
          </nav>

          <div className="mt-auto space-y-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => navigate("/seller/create-product")}
              className="w-full bg-[#000613] hover:bg-[#001f3f] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Product</span>
            </button>

            <button
              onClick={async () => {
                await handleLogout();
                navigate("/login");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold text-xs text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#f8f9fa]">
        
        {/* Top App Bar Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md w-full border-b border-slate-200 px-6 sm:px-10 py-3 flex justify-between items-center">
          <nav className="flex items-center text-xs text-slate-500 gap-2">
            <span
              onClick={() => navigate("/seller/dashboard")}
              className="hover:text-slate-900 cursor-pointer font-medium"
            >
              Products
            </span>
            <span>›</span>
            <span className="font-semibold text-slate-900 truncate max-w-[160px]">{product.title}</span>
            <span>›</span>
            <span className="text-[#000613] font-bold">Variant Management</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search variants..."
                className="bg-slate-100 border border-slate-200 rounded-full pl-4 pr-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#001f3f] w-56"
              />
            </div>
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Back to Catalog
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-6 space-y-6">
          
          {/* Notification Toast */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Header Spec Canvas */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                {mainImage ? (
                  <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Photo
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    MASTER CATALOG ITEM
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {product._id?.slice(-8)}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#000613] tracking-tight">
                  {product.title}
                </h1>
                <p className="text-xs text-[#964900] font-extrabold mt-0.5">
                  Base Price: {formatCurrency(product.price?.amount, product.price?.currency)} • {variants.length} Variants Configured
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowEditProductModal(true)}
                className="px-4 py-2.5 bg-amber-50 text-[#964900] border border-amber-200 hover:bg-amber-100 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>✏️</span>
                <span>Edit Product</span>
              </button>

              <button
                onClick={handleDeleteProductSubmit}
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>

              <button
                onClick={() => setShowAddVariantModal(true)}
                className="px-5 py-2.5 bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>+</span>
                <span>Add Variant</span>
              </button>
            </div>
          </div>

          {/* Asymmetric Split: Left Specs, Right Variants Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Attribute Summaries */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Variant Stat Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-[#000613]">Variant Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ACTIVE VARIANTS</p>
                    <p className="text-2xl font-extrabold text-[#000613] mt-1">{variants.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">TOTAL UNITS</p>
                    <p className="text-2xl font-extrabold text-[#ff851b] mt-1">{totalStock}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Individual Variant Details Table */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-extrabold text-base text-[#000613]">Generated Variants Table</h3>
                  <span className="text-xs font-bold text-slate-500">
                    Showing {filteredVariants.length} of {variants.length} items
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-3">Variant Specification</th>
                        <th className="px-5 py-3">SKU</th>
                        <th className="px-5 py-3">Price</th>
                        <th className="px-5 py-3">Stock Units</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVariants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                            No variants created yet. Click "+ Add New Variant" to add inventory specs.
                          </td>
                        </tr>
                      ) : (
                        filteredVariants.map((v) => {
                          const currentStock = stockInputs[v._id] ?? v.stock;

                          const variantImg =
                            Array.isArray(v.images) && v.images.length > 0
                              ? typeof v.images[0] === "string" ? v.images[0] : v.images[0]?.url || ""
                              : Array.isArray(product.images) && product.images.length > 0
                              ? typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url || ""
                              : "";

                          const colorName = v.attributes?.color || v.color || "Default";
                          const sizeName = v.attributes?.size || v.size || "";

                          const hexColor =
                            String(colorName).toLowerCase().includes("black") ? "#1a1a1a" :
                            String(colorName).toLowerCase().includes("white") ? "#ffffff" :
                            String(colorName).toLowerCase().includes("red") || String(colorName).toLowerCase().includes("bordeaux") ? "#8b0000" :
                            String(colorName).toLowerCase().includes("champagne") ? "#f5e6cc" :
                            String(colorName).toLowerCase().includes("brown") || String(colorName).toLowerCase().includes("brwon") ? "#653818" :
                            String(colorName).toLowerCase().includes("blue") ? "#001f3f" : "#cbd5e1";

                          return (
                            <tr key={v._id} className="hover:bg-slate-50/80 transition-colors text-xs">
                              <td className="px-5 py-4 font-bold text-[#000613]">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    {variantImg ? (
                                      <img src={variantImg} alt={colorName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-[8px]">
                                        No Image
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                        style={{ backgroundColor: hexColor }}
                                      />
                                      <p className="font-extrabold text-[#000613] capitalize">
                                        {colorName} {sizeName ? `/ ${sizeName}` : ""}
                                      </p>
                                    </div>
                                    <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                                      {v.attributes ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(" • ") : "Apparel Specs"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 font-mono font-bold text-slate-700">
                                {v.sku}
                              </td>

                              <td className="px-5 py-4 font-extrabold text-[#964900]">
                                {formatCurrency(v.price?.amount || (typeof v.price === 'number' ? v.price : product.price?.amount), v.price?.currency || product.price?.currency)}
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentStock}
                                    onChange={(e) => handleStockInputChange(v._id, e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs w-20 outline-none focus:border-[#000613] font-bold"
                                  />
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      currentStock > 10
                                        ? "bg-emerald-500"
                                        : currentStock > 0
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                </div>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                  <button
                                    onClick={() => openEditVariantModal(v)}
                                    className="bg-amber-50 text-[#964900] border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all shrink-0"
                                    title="Edit Variant Price & Manage Variant Photos"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleSaveStock(v._id)}
                                    className="bg-[#000613] hover:bg-[#001f3f] text-white px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all shrink-0"
                                  >
                                    Save Stock
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVariantSubmit(v)}
                                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all shrink-0"
                                    title="Delete Variant"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Modal: Edit Variant (Photos & Price Management) */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#000613]">Edit Variant Details</h3>
                <p className="text-xs text-slate-500">Update price, stock & edit variant photos</p>
              </div>
              <button
                onClick={() => setEditingVariant(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditVariantSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Variant SKU</label>
                <input
                  type="text"
                  value={editVariantSku}
                  onChange={(e) => setEditVariantSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Variant Price (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editVariantPrice}
                    onChange={(e) => setEditVariantPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Stock Units *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editVariantStock}
                    onChange={(e) => setEditVariantStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-bold"
                  />
                </div>
              </div>

              {/* Existing Variant Photos Section (Edit / Delete Photos) */}
              {editVariantExistingImages.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-slate-700">
                      Existing Variant Photos ({editVariantExistingImages.length})
                    </label>
                    <span className="text-[10px] text-red-600 font-bold">Click × to delete photo</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {editVariantExistingImages.map((src, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 group shrink-0 shadow-sm">
                        <img src={src} alt={`Variant Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingVariantImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-extrabold flex items-center justify-center shadow-md transition-all"
                          title="Delete this photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload/Add New Variant Photos Dropzone */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold uppercase text-[#964900] flex items-center justify-between">
                  <span>Upload New Variant Photos</span>
                  <span className="text-[10px] text-slate-400 font-normal">Add photo for this color/variant</span>
                </label>

                <div className="relative border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-4 text-center hover:border-[#ff851b] transition-colors cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditVariantImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 pointer-events-none">
                    <span className="text-2xl">📸</span>
                    <p className="text-xs font-bold text-slate-700">Click or drag images to upload for this variant</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </div>

                {editVariantImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editVariantImagePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={src} alt="Variant edit preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditVariantImage(idx)}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-90 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="w-1/3 bg-slate-100 text-slate-700 text-xs font-bold py-3 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ff851b] hover:bg-[#e07010] text-white text-xs font-extrabold py-3 rounded-xl shadow-md transition-all"
                >
                  Save Variant Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Create Variant */}
      {showAddVariantModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#000613]">Add Product Variant</h3>
                <p className="text-xs text-slate-500">Configure size, color, stock & variant photos</p>
              </div>
              <button
                onClick={() => setShowAddVariantModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddVariantSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Variant SKU *</label>
                <input
                  type="text"
                  required
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                  placeholder="e.g. LUX-CHAMP-S"
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Size *</label>
                  <select
                    value={newVariant.size}
                    onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-bold"
                  >
                    {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Color *</label>
                  <input
                    type="text"
                    required
                    value={newVariant.color}
                    onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                    placeholder="Champagne"
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Price Override</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={newVariant.priceAmount}
                    onChange={(e) => setNewVariant({ ...newVariant, priceAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613]"
                  />
                </div>
              </div>

              {/* Variant Images Uploader */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold uppercase text-[#964900] flex items-center justify-between">
                  <span>Variant Image(s)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional photo for this variant</span>
                </label>

                <div className="relative border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-4 text-center hover:border-[#ff851b] transition-colors cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleVariantImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 pointer-events-none">
                    <span className="text-2xl">📸</span>
                    <p className="text-xs font-bold text-slate-700">Click or drag images to upload for this variant</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </div>

                {variantImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {variantImagePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={src} alt="Variant preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(idx)}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center opacity-90 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVariantModal(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 text-xs font-bold py-3 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ff851b] hover:bg-[#e07010] text-white text-xs font-extrabold py-3 rounded-xl shadow-md transition-all"
                >
                  Create Variant
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Edit Product Listing */}
      {showEditProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#000613]">Edit Product Listing</h3>
                <p className="text-xs text-slate-500">Update main product details</p>
              </div>
              <button
                onClick={() => setShowEditProductModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Base Price (INR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editPriceAmount}
                  onChange={(e) => setEditPriceAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(false)}
                  className="w-1/3 bg-slate-100 text-slate-700 text-xs font-bold py-3 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#ff851b] hover:bg-[#e07010] text-white text-xs font-extrabold py-3 rounded-xl shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerProductDetails;