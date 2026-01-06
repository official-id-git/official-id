"use client";

import { motion } from "motion/react";
import { Shield, Check } from "lucide-react";

export function SecureLoginIllustration() {
    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Main Shield */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="relative z-10 w-40 h-40 bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl shadow-2xl flex items-center justify-center"
            >
                <Shield className="w-24 h-24 text-white" />
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                >
                    <Check className="w-7 h-7 text-white stroke-[3]" />
                </motion.div>
            </motion.div>

            {/* Google Circle */}
            <motion.div
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: -100, y: -60, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                className="absolute w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-red-500"
            >
                <svg className="w-12 h-12" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            </motion.div>

            {/* LinkedIn Circle */}
            <motion.div
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: 100, y: -60, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="absolute w-24 h-24 bg-[#0077B5] rounded-full shadow-lg flex items-center justify-center"
            >
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            </motion.div>

            {/* Decorative Dots */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-8 left-8 w-3 h-3 bg-yellow-400 rounded-full"
            />
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute top-8 right-8 w-3 h-3 bg-green-400 rounded-full"
            />
        </div>
    );
}
