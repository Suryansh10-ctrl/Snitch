import React, { useState, useRef, useCallback } from "react";
import { useProduct } from "../hooks/useProduct";
import { useAuth } from "../../auth/hooks/useAuth";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const MAX_IMAGES = 7;

const CreateProducts = () => {
  const { handleCreateProduct } = useProduct();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const [formData, setFormData] = useState({
    title: "",
    category: "Shirts",
    description: "",
    color: "Charcoal Grey",
    priceAmount: "",
    priceCurrency: "INR",
    brand: "Snitch",
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const addFiles = (files) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setErrorMsg("Maximum 7 images allowed.");
      return;
    }

    const toAdd = Array.from(files).slice(0, remaining);
    const updatedImages = [...images, ...toAdd];
    setImages(updatedImages);

    const updatedPreviews = updatedImages.map((file) => URL.createObjectURL(file));
    setPreviews(updatedPreviews);
    if (errorMsg) setErrorMsg("");
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [images]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);

    URL.revokeObjectURL(previews[index]);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.title.trim() || !formData.description.trim() || !formData.priceAmount || !formData.color.trim()) {
      const msg = "Please fill out all required fields including product base color.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (images.length === 0) {
      const msg = "Please upload at least 1 image for the product.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("category", formData.category);
      data.append("description", formData.description.trim());
      data.append("color", formData.color.trim());
      data.append("priceAmount", formData.priceAmount);
      data.append("priceCurrency", formData.priceCurrency);

      images.forEach((file) => {
        data.append("images", file);
      });

      await handleCreateProduct(data);
      setSuccessMsg("Product created successfully! Redirecting...");

      setTimeout(() => {
        navigate("/seller/dashboard");
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to create product.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

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
              className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all font-semibold text-xs text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products</span>
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
              className="w-full bg-[#ff851b] hover:bg-[#e07010] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition-all"
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
      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#f8f9fa] pb-12">
        
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
            <span className="text-[#000613] font-bold">New Product Listing</span>
          </nav>

          <button
            onClick={() => navigate("/seller/dashboard")}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to Dashboard
          </button>
        </header>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto px-6 sm:px-10 mt-6 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000613] tracking-tight">
                Create New Apparel Listing
              </h1>
              <p className="text-xs text-slate-500">
                Fill in product details, specify base color, set pricing, and upload high-resolution editorial photos.
              </p>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Form Inputs */}
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Minimalist Oversized Linen Trench Coat"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none focus:border-[#000613]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Product Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none focus:border-[#000613] font-bold cursor-pointer"
                      >
                        <option value="Clothing">Clothing (General)</option>
                        <option value="Shirts">Shirts</option>
                        <option value="Pants">Pants</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Watches">Watches</option>
                        <option value="Shoes">Shoes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Brand Name *
                      </label>
                      <select
                        name="brand"
                        value={formData.brand || "Snitch"}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none focus:border-[#000613] font-bold cursor-pointer"
                      >
                        <option value="Fastrack">Fastrack</option>
                        <option value="Sonata">Sonata</option>
                        <option value="Titan">Titan</option>
                        <option value="Casio">Casio</option>
                        <option value="Fossil">Fossil</option>
                        <option value="Snitch">Snitch</option>
                        <option value="Zara">Zara</option>
                        <option value="Levi's">Levi's</option>
                        <option value="Nike">Nike</option>
                        <option value="Adidas">Adidas</option>
                        <option value="Other">Other Brand</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Product Color *
                      </label>
                      <input
                        type="text"
                        name="color"
                        required
                        value={formData.color}
                        onChange={handleChange}
                        placeholder="e.g. Charcoal Grey, Royal Blue, Brown"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none focus:border-[#000613] font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Description & Craftsmanship *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the silhouette, fit, fabric composition, and luxury details..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none focus:border-[#000613] resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Price Amount *
                      </label>
                      <input
                        type="number"
                        name="priceAmount"
                        required
                        min="1"
                        step="any"
                        value={formData.priceAmount}
                        onChange={handleChange}
                        placeholder="1200"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-3 outline-none focus:border-[#000613]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Currency
                      </label>
                      <select
                        name="priceCurrency"
                        value={formData.priceCurrency}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3 py-3 outline-none focus:border-[#000613] font-bold cursor-pointer"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Drag and Drop Dropzone */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Product Photos *
                    </label>
                    <span className="text-xs font-bold text-[#964900]">
                      {images.length}/{MAX_IMAGES} Uploaded
                    </span>
                  </div>

                  {images.length < MAX_IMAGES && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#ff851b] bg-amber-50'
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-xl shadow-sm">
                        📷
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Drag & drop high-res photos here or{' '}
                          <span className="text-[#ff851b] underline">browse files</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PNG, JPG, or WEBP (Max {MAX_IMAGES} photos)
                        </p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}

                  {previews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                      {previews.map((src, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100"
                        >
                          <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/seller/dashboard")}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Publishing..." : "Publish Product"}
                </button>
              </div>

            </form>

          </div>

        </div>

      </main>

    </div>
  );
};

export default CreateProducts;