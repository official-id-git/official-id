"use client";

import { motion } from "motion/react";
import { Share2, User, Mail, Phone } from "lucide-react";

export function DigitalCardIllustration() {
    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Main Business Card */}
            <motion.div
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="relative w-72 h-44 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white rounded-full" />
                </div>

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <motion.h3
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-white font-semibold"
                            >
                                Official.id User
                            </motion.h3>
                            <motion.p
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-white/80 text-sm"
                            >
                                Professional
                            </motion.p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-2 text-white/90 text-sm"
                        >
                            <Mail className="w-4 h-4" />
                            <span>user@official.id</span>
                        </motion.div>
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-2 text-white/90 text-sm"
                        >
                            <Phone className="w-4 h-4" />
                            <span>+62 812 3456 7890</span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Share Button */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <Share2 className="w-9 h-9 text-white" />
            </motion.div>

            {/* Floating Cards (Recipients) */}
            <motion.div
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                animate={{ x: -120, y: -80, opacity: 1, scale: 0.6 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute w-20 h-12 bg-white rounded-lg shadow-md p-2"
            >
                <div className="w-6 h-6 bg-gray-200 rounded-full mb-1" />
                <div className="h-1 bg-gray-200 rounded" />
            </motion.div>

            <motion.div
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                animate={{ x: 120, y: 100, opacity: 1, scale: 0.6 }}
                transition={{ delay: 0.9, type: "spring" }}
                className="absolute w-20 h-12 bg-white rounded-lg shadow-md p-2"
            >
                <div className="w-6 h-6 bg-gray-200 rounded-full mb-1" />
                <div className="h-1 bg-gray-200 rounded" />
            </motion.div>

            <motion.div
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                animate={{ x: -100, y: 120, opacity: 1, scale: 0.6 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute w-20 h-12 bg-white rounded-lg shadow-md p-2"
            >
                <div className="w-6 h-6 bg-gray-200 rounded-full mb-1" />
                <div className="h-1 bg-gray-200 rounded" />
            </motion.div>
        </div>
    );
}
