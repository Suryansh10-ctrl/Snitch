import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../hooks/useProduct";
import { useAuth } from "../../auth/hooks/useAuth";
import { useNavigate } from "react-router";
import { getSellerOrdersApi, updateOrderStatusApi } from "../../cart/service/cart.api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { handleGetSellerProducts, handleUpdateProduct, handleDeleteProduct } = useProduct();
  const { handleLogout } = useAuth();
  const user = useSelector((state) => state.auth?.user);
  const sellerProducts = useSelector((state) => state.product?.sellerProducts || []);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'products' | 'orders'
  const [stockFilter, setStockFilter] = useState("ALL"); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK'

  // Orders State
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriceAmount, setEditPriceAmount] = useState("");

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      await handleGetSellerProducts();
    } catch (err) {
      console.error("Failed to load seller catalog:", err);
      setErrorMsg("Failed to fetch seller products.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await getSellerOrdersApi();
      if (res?.orders) setSellerOrders(res.orders);
    } catch (err) {
      console.error("Failed to load seller orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus);
      toast.success(`Order status updated to "${newStatus}"! 🚚`);
      fetchSellerOrders();
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  useEffect(() => {
    fetchSellerData();
    fetchSellerOrders();
  }, []);

  const formatCurrency = (amount, currency = "INR") => {
    const symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
    const symbol = symbols[currency] || "₹";
    return `${symbol}${Number(amount || 0).toLocaleString()}`;
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditTitle(product.title || "");
    setEditColor(product.color || "");
    setEditDescription(product.description || "");
    setEditPriceAmount(product.price?.amount || "");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await handleUpdateProduct(editingProduct._id, {
        title: editTitle,
        color: editColor,
        description: editDescription,
        priceAmount: editPriceAmount,
      });
      setSuccessMsg(`"${editTitle}" updated successfully!`);
      setTimeout(() => setSuccessMsg(""), 2500);
      setEditingProduct(null);
      fetchSellerData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update product.");
    }
  };

  const handleDeleteSubmit = async (product) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${product.title}"?`)) {
      return;
    }
    try {
      await handleDeleteProduct(product._id);
      setSuccessMsg(`"${product.title}" deleted successfully!`);
      setTimeout(() => setSuccessMsg(""), 2500);
      fetchSellerData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const getProductStock = (product) => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }
    return product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : 0;
  };

  const getProductValuation = (product) => {
    const basePrice = Number(product?.price?.amount) || 0;
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      const variantTotal = product.variants.reduce((acc, v) => {
        const vPrice = Number(v.price) || basePrice;
        const vStock = Number(v.stock) || 0;
        return acc + (vPrice * (vStock > 0 ? vStock : 1));
      }, 0);
      return variantTotal > 0 ? variantTotal : basePrice;
    }
    const stock = getProductStock(product);
    return basePrice * (stock > 0 ? stock : 1);
  };

  const filteredProducts = sellerProducts.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.color?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q);

    const totalStock = getProductStock(item);

    let matchesStock = true;
    if (stockFilter === "IN_STOCK") matchesStock = totalStock > 5;
    if (stockFilter === "LOW_STOCK") matchesStock = totalStock <= 5;

    return matchesSearch && matchesStock;
  });

  const totalCatalogValue = sellerProducts.reduce(
    (acc, p) => acc + getProductValuation(p),
    0
  );

  const totalCatalogUnits = sellerProducts.reduce(
    (acc, p) => acc + getProductStock(p),
    0
  );

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
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-left transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#ff851b] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-left transition-all ${
                activeTab === "products"
                  ? "bg-[#ff851b] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("orders");
                fetchSellerOrders();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-left transition-all ${
                activeTab === "orders"
                  ? "bg-[#ff851b] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Customer Orders ({sellerOrders.length})</span>
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

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#f8f9fa]">
        
        {/* Dashboard Top Action Bar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-10 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-[#000613] tracking-wide uppercase">Seller Management Console</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile & Tablet Navigation Tabs */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-[#ff851b] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeTab === "products"
                  ? "bg-[#ff851b] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Products ({sellerProducts.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                fetchSellerOrders();
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-[#ff851b] text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Orders ({sellerOrders.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SELLER DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="p-4 sm:p-10 max-w-7xl mx-auto w-full space-y-6 animate-fadeIn">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[#964900] font-bold uppercase tracking-widest text-[10px] mb-1">
                  PERFORMANCE OVERVIEW
                </p>
                <h3 className="text-xl sm:text-4xl font-extrabold text-[#000613] tracking-tight">
                  Good Morning, {user?.fullname?.split(" ")[0] || "Alexander"}
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-[#ff851b] hover:bg-[#e07010] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  View Shop
                </button>
              </div>
            </div>

            {/* Bento Grid Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* Card 1: Total Catalog Value */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Catalog Value</p>
                    <h4 className="text-2xl sm:text-3xl font-extrabold text-[#000613]">
                      {formatCurrency(totalCatalogValue, "INR")}
                    </h4>
                  </div>
                  <div className="p-3 bg-amber-50 text-[#964900] rounded-2xl font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-4">
                  Valuation of total catalog inventory
                </p>
              </div>

              {/* Card 2: Total Inventory Units */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Inventory Stock</p>
                    <h4 className="text-2xl sm:text-3xl font-extrabold text-[#000613]">{totalCatalogUnits} <span className="text-sm font-bold text-slate-400">Units</span></h4>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-4">
                  In-stock item units across all variants
                </p>
              </div>

              {/* Card 3: Active Products */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Active Products</p>
                    <h4 className="text-2xl sm:text-3xl font-extrabold text-[#000613]">{sellerProducts.length} <span className="text-sm font-bold text-slate-400">Listings</span></h4>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-4">
                  Total published items in catalog
                </p>
              </div>

              {/* Card 4: Orders Received */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Orders Received</p>
                    <h4 className="text-2xl sm:text-3xl font-extrabold text-[#000613]">{sellerOrders.length} <span className="text-sm font-bold text-slate-400">Orders</span></h4>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-4">
                  Total customer orders processed
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SELLER PRODUCTS CATALOG & INVENTORY MANAGEMENT VIEW */}
        {activeTab === "products" && (
          <div className="p-4 sm:p-10 max-w-7xl mx-auto w-full space-y-6 animate-fadeIn">
            
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-between items-center gap-4 pb-3 border-b border-slate-200">
              <div>
                <h1 className="text-xl sm:text-3xl font-extrabold text-[#000613] tracking-tight">
                  Products Management
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage product listings, pricing, and variant stocks.
                </p>
              </div>

              <button
                onClick={() => navigate("/seller/create-product")}
                className="px-4 py-2 bg-[#ff851b] hover:bg-[#e07010] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
              >
                + Add Product
              </button>
            </div>

            {/* MOBILE VIEW (CARD LIST - NO HORIZONTAL SCROLLING) */}
            <div className="block sm:hidden space-y-3">
              {loading ? (
                <div className="bg-white p-6 rounded-2xl text-center text-slate-400 font-bold text-xs">
                  Loading Products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center text-slate-500 border border-slate-200">
                  <p className="font-bold text-xs text-[#000613]">No Products Listed Yet</p>
                  <button
                    onClick={() => navigate("/seller/create-product")}
                    className="mt-3 bg-[#000613] text-white px-4 py-2 rounded-xl font-bold text-xs"
                  >
                    + Add Product
                  </button>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const firstImg =
                    Array.isArray(product.images) && product.images.length > 0
                      ? typeof product.images[0] === "string"
                        ? product.images[0]
                        : product.images[0]?.url || ""
                      : "";

                  const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;
                  const totalStock = getProductStock(product);

                  return (
                    <div key={product._id} className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {firstImg ? (
                            <img src={firstImg} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px]">
                              No Photo
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5
                            onClick={() => navigate(`/seller/product/${product._id}`)}
                            className="font-extrabold text-xs text-[#000613] hover:text-[#964900] truncate cursor-pointer"
                          >
                            {product.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                            Color: <span className="text-slate-700 capitalize">{product.color || "Specified"}</span>
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-extrabold text-xs text-[#964900]">
                              {formatCurrency(product.price?.amount, product.price?.currency)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                              totalStock > 5
                                ? "bg-emerald-100 text-emerald-800"
                                : totalStock > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {totalStock > 5 ? "In Stock" : totalStock > 0 ? `Low (${totalStock})` : "Out"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-2.5 py-1 bg-amber-50 text-[#964900] font-bold text-[10px] rounded-lg border border-amber-200 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => navigate(`/seller/product/${product._id}`)}
                          className="px-2.5 py-1 bg-[#000613] text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          <span>Variants ({variantCount})</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSubmit(product)}
                          className="px-2.5 py-1 bg-red-50 text-red-600 font-bold text-[10px] rounded-lg border border-red-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Product Info</th>
                      <th className="px-6 py-4">Base Color</th>
                      <th className="px-6 py-4">Base Price</th>
                      <th className="px-6 py-4">Stock Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">
                          Loading Products...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          <p className="font-bold text-sm text-[#000613]">No Products Listed Yet</p>
                          <button
                            onClick={() => navigate("/seller/create-product")}
                            className="mt-4 bg-[#000613] text-white px-5 py-2.5 rounded-xl font-bold text-xs"
                          >
                            + Add Product
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const firstImg =
                          Array.isArray(product.images) && product.images.length > 0
                            ? typeof product.images[0] === "string"
                              ? product.images[0]
                              : product.images[0]?.url || ""
                            : "";

                        const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;
                        const totalStock = getProductStock(product);

                        return (
                          <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                  {firstImg ? (
                                    <img src={firstImg} alt={product.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px]">
                                      No Photo
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h5
                                    onClick={() => navigate(`/seller/product/${product._id}`)}
                                    className="font-extrabold text-sm text-[#000613] hover:text-[#964900] cursor-pointer transition-colors"
                                  >
                                    {product.title}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 font-semibold">{variantCount} Variants Available</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 font-bold text-slate-800 capitalize">
                              {product.color || "Specified"}
                            </td>

                            <td className="px-6 py-4 font-extrabold text-[#964900]">
                              {formatCurrency(product.price?.amount, product.price?.currency)}
                            </td>

                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                                totalStock > 5
                                  ? "bg-emerald-100 text-emerald-800"
                                  : totalStock > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {totalStock > 5 ? "In Stock" : totalStock > 0 ? `Low Stock (${totalStock})` : "Out of Stock"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => openEditModal(product)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-[#964900] hover:bg-amber-100 font-bold text-[11px] rounded-xl transition-all border border-amber-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => navigate(`/seller/product/${product._id}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#000613] hover:bg-[#001f3f] text-white font-bold text-[11px] rounded-xl transition-all shadow-sm"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span>Variants</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSubmit(product)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-[11px] rounded-xl transition-all border border-red-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                <span>Delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
            </div>

          </div>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === "orders" && (
          <div className="p-4 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#000613]">
                  Customer Orders ({sellerOrders.length})
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Track real-time delivery status and process customer orders stored in MongoDB.
                </p>
              </div>
              <button
                onClick={fetchSellerOrders}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Orders</span>
              </button>
            </div>

            {loadingOrders ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs font-bold text-slate-500">
                Loading customer orders from database...
              </div>
            ) : sellerOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#964900] flex items-center justify-center text-3xl font-black">
                  🛍️
                </div>
                <h3 className="text-lg font-extrabold text-[#000613]">No Orders Received Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Customer orders for your listed apparel items will appear here automatically when purchased.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order) => {
                  const addr = order.shippingAddress || {};
                  const currentStatus = order.deliveryStatus || "Order Placed";

                  return (
                    <div
                      key={order._id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#000613]">
                              Order #{order.razorpay?.orderId || order._id?.slice(-8)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Buyer: <span className="font-bold text-slate-800">{addr.fullName || "Customer"}</span> ({addr.contact || "No Contact"})
                          </p>
                        </div>

                        {/* Current Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-[#964900] border border-amber-200">
                            Current: {currentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Purchased Items List & Delivery Address */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Items (7 cols) */}
                        <div className="md:col-span-7 space-y-2">
                          <h4 className="text-xs font-extrabold uppercase text-slate-500">Ordered Products</h4>
                          {order.orderItems?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                              <div>
                                <p className="font-bold text-[#000613]">{item.title}</p>
                                <p className="text-[11px] text-slate-500">Qty: {item.quantity || 1}</p>
                              </div>
                              <span className="font-extrabold text-[#000613]">
                                {formatCurrency(item.price?.amount || 0, item.price?.currency)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Address (5 cols) */}
                        <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                          <h4 className="text-[11px] font-extrabold uppercase text-slate-500 flex items-center gap-1">
                            <span>📍</span> Delivery Address
                          </h4>
                          <p className="text-xs font-bold text-[#000613]">{addr.fullName || "Valued Buyer"}</p>
                          <p className="text-[11px] text-slate-600 font-medium leading-snug">
                            {addr.streetAddress}{addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-[11px] text-slate-700 font-bold pt-1">Phone: {addr.contact}</p>
                        </div>
                      </div>

                      {/* Update Delivery Status Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-600">Update Delivery Processing Stage:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {["Order Placed", "Processing", "Shipped", "Delivered"].map((stage) => {
                            const isCurrent = currentStatus === stage;
                            return (
                              <button
                                key={stage}
                                onClick={() => handleUpdateStatus(order._id, stage)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                  isCurrent
                                    ? "bg-[#000613] text-white shadow-sm ring-2 ring-slate-900"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                }`}
                              >
                                {isCurrent ? `✓ ${stage}` : stage}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#000613]">Edit Product Listing</h3>
                <p className="text-xs text-slate-500">Update title, color, description, and base price</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000613] font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Product Color *</label>
                <input
                  type="text"
                  required
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="e.g. Charcoal Grey"
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
                  onClick={() => setEditingProduct(null)}
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

export default Dashboard;