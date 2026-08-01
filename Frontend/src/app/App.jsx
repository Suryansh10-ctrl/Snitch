import React from "react";
import "./App.css";
import { RouterProvider } from "react-router";
import { Provider } from "react-redux";
import { routes } from "./app.routes.jsx";
import { store } from "./app.store.js";
import { useSelector } from "react-redux";
import { useAuth } from "../features/auth/hooks/useAuth.js";
import { useEffect } from "react";

const App = () => {
  const { handleGetMe } = useAuth();
  const user = useSelector((state) => state.auth?.user);
  console.log(user)

  useEffect(() => {
    handleGetMe();
  }, []);

  return (
    <RouterProvider router={routes} />
  );
};

export default App;