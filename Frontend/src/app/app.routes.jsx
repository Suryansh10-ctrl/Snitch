import { createBrowserRouter } from "react-router";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import CreateProducts from "../features/products/pages/CreateProducts";
import Dashboard from "../features/products/pages/Dashboard";
import Protected from "../features/auth/components/Protected";
import Home from "../features/products/pages/Home";
import SellerProductDetails from "../features/products/pages/SellerProductDetails";
import ProductDetails from "../features/products/pages/ProductDetails";
import Cart from "../features/cart/pages/Cart";
import OrderSuccess from "../features/cart/pages/OrderSuccess";
import MyOrders from "../features/cart/pages/MyOrders";
import AppLayout from "./AppLayout";

export const routes = createBrowserRouter([

    {
        path: "/register",
        element: <Register/>
    },
    {
        path: "/login",
        element: <Login/>
    },
    {
        element: <AppLayout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
    {
        path: "/cart",
        element: <Cart />
    },
    {
        path: "/my-orders",
        element: <MyOrders />
    },
    {
        path: "/order-success",
        element: <OrderSuccess />
    },
    {
        path: "/product/:productId",
        element: <ProductDetails />
    },
    {
        path: "/create-product",
        element: <Protected role="seller">
            <CreateProducts />
        </Protected>
    },
    {
        path: "/seller",
        children: [
            {
                path: "/seller/create-product",
                element: <Protected role="seller">
                    <CreateProducts />
                </Protected>
            },
            {
                path: "/seller/dashboard",
                element: <Protected role="seller">
                    <Dashboard />
                </Protected>
            }
        ]
    },
    {
        path: "/seller/product/:productId",
        element: <Protected role="seller">
            <SellerProductDetails />
        </Protected>
    }
        ]
    },

]);