import React, { useEffect } from "react";
import "./App.css";
import { RouterProvider } from "react-router";
import { Provider } from "react-redux";
import { routes } from "./app.routes.jsx";
import { store } from "./app.store.js";
import { useSelector } from "react-redux";
import { useAuth } from "../features/auth/hooks/useAuth.js";
import toast from "react-hot-toast";

const App = () => {
  const { handleGetMe } = useAuth();
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const errorFromUrl = params.get("error");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.pathname + url.search);
      toast.success("Successfully logged in with Google! 🎉");
    }

    if (errorFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, document.title, url.pathname + url.search);
      toast.error("Google Authentication failed. Please try again.");
    }

    handleGetMe();
  }, []);

  return (
    <RouterProvider router={routes} />
  );
};

export default App;