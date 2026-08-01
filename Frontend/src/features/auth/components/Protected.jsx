import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";


const Protected = ({children,role = "buyer"}) => {
    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)

    if (loading) {
        return (
          <div className="min-h-screen w-full bg-[#0c0d10] text-[#E5A93C] flex flex-col items-center justify-center space-y-3 font-sans">
            <svg className="animate-spin w-8 h-8 text-[#E5A93C]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Authenticating...</span>
          </div>
        );
    }

    if(!user){
        return <Navigate to="/login"/>
    }

    if(user.role !== role){
        return <Navigate to="/"/>
    }

    return children;
} 

export default Protected;