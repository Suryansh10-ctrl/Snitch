import React from 'react'
import Nav from '../features/Shared/Components/Nav'
import { Outlet } from 'react-router'
import { Toaster } from 'react-hot-toast'

const AppLayout = () => {
    return (
        <>
            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#000613',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '16px',
                        padding: '12px 18px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#ff851b',
                            secondary: '#ffffff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                        },
                    },
                }}
            />
            <Nav />
            <Outlet />
        </>
    )
}

export default AppLayout