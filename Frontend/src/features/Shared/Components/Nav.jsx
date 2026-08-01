import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useCart } from "../../cart/hooks/useCart";
import { useAuth } from "../../auth/hooks/useAuth";


const Nav = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);
    const products = useSelector((state) => state.product?.products || []);
    const cartItems = useSelector((state) => state.cart?.items || []);
    const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const { handleGetCart } = useCart();
    const { handleLogout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeCategoryDropdown, setActiveCategoryDropdown] = useState(null);
    const searchContainerRef = useRef(null);

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setActiveCategoryDropdown(null);
        setIsMobileMenuOpen(false);
        navigate(`/?category=${encodeURIComponent(cat)}`);
        if (location.pathname === "/") {
            setTimeout(() => {
                const el = document.getElementById("trending-products");
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    useEffect(() => {
        if (user) {
            handleGetCart();
        }
    }, [user]);

    useEffect(() => {
        const cat = searchParams.get("category");
        if (cat) {
            setSelectedCategory(cat);
        } else {
            const q = searchParams.get("q");
            if (q && ["clothing", "accessories", "shoes", "shirts", "pants"].includes(q.toLowerCase())) {
                setSelectedCategory(q);
            } else if (!q) {
                setSelectedCategory("ALL");
            }
        }
    }, [searchParams]);

    useEffect(() => {
        setSearchQuery(searchParams.get("q") || "");
    }, [searchParams]);

    // Close search dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const updateSearchParam = (val) => {
        const query = val.trim();
        if (query) {
            navigate(`/?q=${encodeURIComponent(query)}`, { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        updateSearchParam(val);
        setIsSearchFocused(true);
    };

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        setIsSearchFocused(false);
        const query = searchQuery.trim();
        if (query) {
            navigate(`/?q=${encodeURIComponent(query)}`);
            setTimeout(() => {
                const el = document.getElementById("trending-products");
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } else {
            navigate("/");
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearchFocused(false);
        navigate("/");
    };

    // Filter live search preview results
    const qLower = searchQuery.toLowerCase().trim();
    const searchPreviewResults = qLower
        ? products.filter(
            (p) =>
                p.title?.toLowerCase().includes(qLower) ||
                p.description?.toLowerCase().includes(qLower) ||
                p.color?.toLowerCase().includes(qLower)
        ).slice(0, 5)
        : [];

    const handleSignOut = () => {
        localStorage.removeItem("authToken");
        dispatch(setUser(null));
        navigate("/");
        window.location.reload();
    };




    return (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full shrink-0 shadow-sm transition-all">
            <div className="flex justify-between items-center px-4 sm:px-8 py-3.5 w-full max-w-[1400px] mx-auto gap-4">

                {/* Brand Logo & Links */}
                <div className="flex items-center gap-3 lg:gap-6 min-w-0">
                    {/* Mobile Hamburger Toggle Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                        aria-label="Toggle navigation menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>

                    <span
                        onClick={() => {
                            setSelectedCategory("ALL");
                            navigate("/");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-lg sm:text-2xl font-black tracking-tight text-[#000613] cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                    >
                        SNITCH.
                    </span>

                    {/* Navigation Options - Clean & Spacious */}
                    <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        <button
                            onClick={() => {
                                setSelectedCategory("ALL");
                                navigate("/");
                                if (location.pathname === "/") {
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                            className={`pb-0.5 transition-all cursor-pointer ${selectedCategory.toLowerCase() === "all"
                                    ? "text-[#964900] border-b-2 border-[#964900]"
                                    : "hover:text-[#000613]"
                                }`}
                        >
                            Shop
                        </button>

                        {/* Watches Dropdown */}
                        <div className="relative py-2" onMouseEnter={() => setActiveCategoryDropdown("watches")} onMouseLeave={() => setActiveCategoryDropdown(null)}>
                            <button
                                onClick={() => handleCategorySelect("Watches")}
                                className={`flex items-center gap-1 font-extrabold transition-all cursor-pointer ${selectedCategory.toLowerCase() === "watches" || ["fastrack", "sonata", "titan", "casio", "fossil"].includes(selectedCategory.toLowerCase())
                                        ? "text-[#ff851b]"
                                        : "hover:text-[#000613]"
                                    }`}
                            >
                                <span>Watches</span>
                                <span className="text-[9px] text-slate-400 font-extrabold">▾</span>
                            </button>
                            {activeCategoryDropdown === "watches" && (
                                <div className="absolute top-full left-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">TIMEPIECE STYLES</div>
                                    {["Analog Watches", "Digital Watches", "Smart Watches", "Chronograph"].map((style) => (
                                        <button key={style} onClick={() => handleCategorySelect(style)} className="w-full text-left text-xs font-bold text-slate-700 hover:text-[#ff851b] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                            {style}
                                        </button>
                                    ))}
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button onClick={() => handleCategorySelect("Watches")} className="w-full text-left text-xs font-extrabold text-[#000613] hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                        All Watches →
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Clothing Dropdown */}
                        <div className="relative py-2" onMouseEnter={() => setActiveCategoryDropdown("clothing")} onMouseLeave={() => setActiveCategoryDropdown(null)}>
                            <button
                                onClick={() => handleCategorySelect("Clothing")}
                                className={`flex items-center gap-1 font-extrabold transition-all cursor-pointer ${selectedCategory.toLowerCase() === "clothing" || ["shirts", "pants", "streetwear", "jackets"].includes(selectedCategory.toLowerCase())
                                        ? "text-[#ff851b]"
                                        : "hover:text-[#000613]"
                                    }`}
                            >
                                <span>Clothing</span>
                                <span className="text-[9px] text-slate-400 font-extrabold">▾</span>
                            </button>
                            {activeCategoryDropdown === "clothing" && (
                                <div className="absolute top-full left-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">APPAREL STYLES</div>
                                    {["Shirts", "Pants", "Streetwear", "Jackets", "Linen"].map((sub) => (
                                        <button key={sub} onClick={() => handleCategorySelect(sub)} className="w-full text-left text-xs font-bold text-slate-700 hover:text-[#ff851b] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                            {sub}
                                        </button>
                                    ))}
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button onClick={() => handleCategorySelect("Clothing")} className="w-full text-left text-xs font-extrabold text-[#000613] hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                        All Clothing →
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Accessories Dropdown */}
                        <div className="relative py-2" onMouseEnter={() => setActiveCategoryDropdown("accessories")} onMouseLeave={() => setActiveCategoryDropdown(null)}>
                            <button
                                onClick={() => handleCategorySelect("Accessories")}
                                className={`flex items-center gap-1 font-extrabold transition-all cursor-pointer ${selectedCategory.toLowerCase() === "accessories"
                                        ? "text-[#ff851b]"
                                        : "hover:text-[#000613]"
                                    }`}
                            >
                                <span>Accessories</span>
                                <span className="text-[9px] text-slate-400 font-extrabold">▾</span>
                            </button>
                            {activeCategoryDropdown === "accessories" && (
                                <div className="absolute top-full left-0 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">ACCENTS</div>
                                    {["Bags", "Belts", "Wallets", "Sunglasses"].map((sub) => (
                                        <button key={sub} onClick={() => handleCategorySelect(sub)} className="w-full text-left text-xs font-bold text-slate-700 hover:text-[#ff851b] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                            {sub}
                                        </button>
                                    ))}
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button onClick={() => handleCategorySelect("Accessories")} className="w-full text-left text-xs font-extrabold text-[#000613] hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                        All Accessories →
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Shoes Dropdown */}
                        <div className="relative py-2" onMouseEnter={() => setActiveCategoryDropdown("shoes")} onMouseLeave={() => setActiveCategoryDropdown(null)}>
                            <button
                                onClick={() => handleCategorySelect("Shoes")}
                                className={`flex items-center gap-1 font-extrabold transition-all cursor-pointer ${selectedCategory.toLowerCase() === "shoes"
                                        ? "text-[#ff851b]"
                                        : "hover:text-[#000613]"
                                    }`}
                            >
                                <span>Shoes</span>
                                <span className="text-[9px] text-slate-400 font-extrabold">▾</span>
                            </button>
                            {activeCategoryDropdown === "shoes" && (
                                <div className="absolute top-full left-0 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">FOOTWEAR</div>
                                    {["Sneakers", "Loafers", "Boots", "Formal Shoes"].map((sub) => (
                                        <button key={sub} onClick={() => handleCategorySelect(sub)} className="w-full text-left text-xs font-bold text-slate-700 hover:text-[#ff851b] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                            {sub}
                                        </button>
                                    ))}
                                    <div className="border-t border-slate-100 my-1"></div>
                                    <button onClick={() => handleCategorySelect("Shoes")} className="w-full text-left text-xs font-extrabold text-[#000613] hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                                        All Shoes →
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (location.pathname !== "/") {
                                    navigate("/");
                                    setTimeout(() => {
                                        const el = document.getElementById("faq-section");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }, 150);
                                } else {
                                    const el = document.getElementById("faq-section");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }
                            }}
                            className="hover:text-[#000613] transition-colors cursor-pointer"
                        >
                            FAQ
                        </button>
                        {user?.role?.toLowerCase() === "seller" && (
                            <button
                                onClick={() => navigate("/seller/dashboard")}
                                className={`font-bold pb-0.5 transition-all text-[#ff851b] hover:text-[#e07010] flex items-center gap-1 cursor-pointer ${location.pathname.startsWith("/seller") ? "border-b-2 border-[#ff851b]" : ""}`}
                            >
                                Seller Dashboard
                            </button>
                        )}
                    </nav>
                </div>

                {/* Global Search & Actions */}
                <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 min-w-0">

                    {/* Live Search Form & Autocomplete Dropdown */}
                    <div ref={searchContainerRef} className="relative w-20 xs:w-32 sm:w-64 md:w-72 shrink">
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleInputChange}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="Search..."
                                className="w-full bg-slate-100 border border-slate-200 focus:border-[#001f3f] rounded-full pl-3.5 pr-8 sm:pr-9 py-1.5 sm:py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#001f3f]/20 transition-all placeholder:text-slate-400"
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                                    title="Clear search"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                                    title="Search"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            )}
                        </form>

                        {/* Autocomplete Results Popover Dropdown */}
                        {isSearchFocused && qLower && (
                            <div className="absolute right-0 sm:left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Matching Products
                                    </span>
                                    <button
                                        onClick={() => {
                                            updateSearchParam(searchQuery);
                                            setIsSearchFocused(false);
                                        }}
                                        className="text-[#ff851b] hover:underline cursor-pointer"
                                    >
                                        View All
                                    </button>
                                </div>

                                {searchPreviewResults.length > 0 ? (
                                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                                        {searchPreviewResults.map((item) => {
                                            const imgUrl = Array.isArray(item.images) && item.images.length > 0
                                                ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url)
                                                : "";
                                            return (
                                                <div
                                                    key={item._id}
                                                    onClick={() => {
                                                        setIsSearchFocused(false);
                                                        navigate(`/product/${item._id}`);
                                                    }}
                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                                                >
                                                    {imgUrl ? (
                                                        <img
                                                            src={imgUrl}
                                                            alt={item.title}
                                                            className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                                            <i className="ri-shopping-bag-3-line text-slate-500"></i>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#001f3f] truncate">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 truncate">
                                                            {item.description || item.color || "Product"}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs font-extrabold text-[#000613] shrink-0">
                                                        ₹{item.price?.amount || 0}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center space-y-1">
                                        <p className="text-xs font-bold text-slate-700">No matching products</p>
                                        <p className="text-[11px] text-slate-400">
                                            No results found for "<span className="font-semibold text-slate-600">{searchQuery}</span>".
                                        </p>
                                        <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                                            {products.slice(0, 3).map((p) => (
                                                <button
                                                    key={p._id}
                                                    onClick={() => {
                                                        setSearchQuery(p.title);
                                                        updateSearchParam(p.title);
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-full transition-colors"
                                                >
                                                    {p.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cart & User Controls */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">

                        {/* Shopping Bag Button */}
                        <button
                            onClick={() => navigate("/cart")}
                            className="p-1.5 text-slate-700 hover:text-[#904400] transition-colors relative rounded-full hover:bg-slate-100 shrink-0"
                            title="View Shopping Bag"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {totalCartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ff851b] text-white text-[10px] font-black flex items-center justify-center">
                                    {totalCartCount}
                                </span>
                            )}
                        </button>

                        {/* User Dropdown */}
                        {user ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                                {user?.role?.toLowerCase() === "seller" && (
                                    <button
                                        onClick={() => navigate("/seller/dashboard")}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-extrabold transition-all border shrink-0 ${location.pathname.startsWith("/seller")
                                                ? "bg-[#ff851b] text-white border-[#ff851b] shadow-sm"
                                                : "bg-orange-50 text-[#ff851b] border-orange-200 hover:bg-orange-100"
                                            }`}
                                        title="Go to Seller Dashboard"
                                    >
                                        <i className="ri-flashlight-line text-amber-500 font-bold"></i>
                                        <span className="hidden md:inline">Seller Console</span>
                                    </button>
                                )}

                                <div className="relative shrink-0">
                                    <button
                                        onClick={() => setShowUserMenu((prev) => !prev)}
                                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 text-slate-800 transition-all text-xs font-semibold shadow-sm shrink-0"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-[#001f3f] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                            {(user.fullname || user.name || user.email || "U")[0].toUpperCase()}
                                        </div>
                                        <span className="hidden sm:inline max-w-[80px] md:max-w-[140px] truncate text-xs font-bold text-slate-800">
                                            {(user.fullname || user.name || user.email || "").split(" ")[0] || "Account"}
                                        </span>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                                            <div className="px-3 py-2 border-b border-slate-100">
                                                <p className="text-xs font-bold text-slate-900 truncate">{user.fullname || user.email}</p>
                                                <p className="text-[10px] font-bold text-[#964900] uppercase tracking-wider mt-0.5">{user.role} ACCOUNT</p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    navigate("/my-orders");
                                                }}
                                                className="w-full text-left text-xs text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 font-semibold"
                                            >
                                                <span>My Orders & Deliveries</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    if (window.location.pathname !== "/") {
                                                        navigate("/");
                                                        setTimeout(() => {
                                                            const el = document.getElementById("terms-section");
                                                            if (el) el.scrollIntoView({ behavior: "smooth" });
                                                        }, 200);
                                                    } else {
                                                        const el = document.getElementById("terms-section");
                                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                                    }
                                                }}
                                                className="w-full text-left text-xs text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 font-semibold"
                                            >
                                                <span>Terms & Conditions</span>
                                            </button>

                                            {user.role === "seller" && (
                                                <button
                                                    onClick={() => {
                                                        setShowUserMenu(false);
                                                        navigate("/seller/dashboard");
                                                    }}
                                                    className="w-full text-left text-xs text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 font-semibold"
                                                >
                                                    <span>Seller Dashboard</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={async () => {
                                                    setShowUserMenu(false);
                                                    await handleLogout();
                                                    navigate("/login");
                                                }}
                                                className="w-full text-left text-xs text-red-600 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold"
                                            >
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="bg-[#000613] hover:bg-[#001f3f] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm transition-all"
                                >
                                    Register
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-3 animate-in slide-in-from-top duration-150">

                    <nav className="flex flex-col gap-1 font-bold text-xs text-slate-700">
                        <button
                            onClick={() => {
                                setSelectedCategory("ALL");
                                setIsMobileMenuOpen(false);
                                navigate("/");
                                if (location.pathname === "/") {
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                            className={`text-left px-3 py-2 rounded-xl transition-colors ${selectedCategory.toLowerCase() === "all" ? "bg-slate-100 text-[#964900]" : "hover:bg-slate-50"}`}
                        >
                            Shop All Products
                        </button>
                        <button
                            onClick={() => {
                                setSelectedCategory("Clothing");
                                setIsMobileMenuOpen(false);
                                navigate("/?category=Clothing");
                            }}
                            className={`text-left px-3 py-2 rounded-xl transition-colors ${selectedCategory.toLowerCase() === "clothing" ? "bg-slate-100 text-[#964900]" : "hover:bg-slate-50"}`}
                        >
                            Clothing
                        </button>
                        <button
                            onClick={() => {
                                setSelectedCategory("Accessories");
                                setIsMobileMenuOpen(false);
                                navigate("/?category=Accessories");
                            }}
                            className={`text-left px-3 py-2 rounded-xl transition-colors ${selectedCategory.toLowerCase() === "accessories" ? "bg-slate-100 text-[#964900]" : "hover:bg-slate-50"}`}
                        >
                            Accessories
                        </button>
                        <button
                            onClick={() => {
                                setSelectedCategory("Shoes");
                                setIsMobileMenuOpen(false);
                                navigate("/?category=Shoes");
                            }}
                            className={`text-left px-3 py-2 rounded-xl transition-colors ${selectedCategory.toLowerCase() === "shoes" ? "bg-slate-100 text-[#964900]" : "hover:bg-slate-50"}`}
                        >
                            Shoes
                        </button>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                if (location.pathname !== "/") {
                                    navigate("/");
                                    setTimeout(() => {
                                        const el = document.getElementById("faq-section");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }, 150);
                                } else {
                                    const el = document.getElementById("faq-section");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }
                            }}
                            className="text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            FAQ & Support
                        </button>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                navigate("/my-orders");
                            }}
                            className="text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-800"
                        >
                            <span>My Orders & Deliveries</span>
                        </button>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                if (window.location.pathname !== "/") {
                                    navigate("/");
                                    setTimeout(() => {
                                        const el = document.getElementById("terms-section");
                                        if (el) el.scrollIntoView({ behavior: "smooth" });
                                    }, 200);
                                } else {
                                    const el = document.getElementById("terms-section");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }
                            }}
                            className="text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-800"
                        >
                            <span>Terms & Conditions</span>
                        </button>
                        {user?.role?.toLowerCase() === "seller" && (
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    navigate("/seller/dashboard");
                                }}
                                className="text-left px-3 py-2 rounded-xl text-[#ff851b] font-extrabold hover:bg-orange-50 transition-colors"
                            >
                                Seller Dashboard
                            </button>
                        )}
                    </nav>

                    {/* User Info & Logout Card placed at the bottom */}
                    {user && (
                        <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 mt-2 pt-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#001f3f] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                    {(user.fullname || user.name || user.email || "U")[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-extrabold text-slate-900 truncate">{user.fullname || user.name || user.email}</p>
                                    <p className="text-[10px] font-bold text-[#964900] uppercase tracking-wider">{user.role || "buyer"} Account</p>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setIsMobileMenuOpen(false);
                                    await handleLogout();
                                    navigate("/login");
                                }}
                                className="text-xs text-red-600 font-extrabold hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 shrink-0 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}

                </div>
            )}
        </header>
    )
}

export default Nav;