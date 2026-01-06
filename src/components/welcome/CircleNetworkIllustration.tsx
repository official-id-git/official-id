"use client";

import { motion } from "motion/react";
import { Users } from "lucide-react";

export function CircleNetworkIllustration() {
    const circles = [
        { color: "bg-teal-500", delay: 0, angle: 0 },
        { color: "bg-yellow-400", delay: 0.1, angle: 45 },
        { color: "bg-green-500", delay: 0.2, angle: 90 },
        { color: "bg-red-400", delay: 0.3, angle: 135 },
        { color: "bg-orange-400", delay: 0.4, angle: 180 },
        { color: "bg-teal-600", delay: 0.5, angle: 225 },
        { color: "bg-green-600", delay: 0.6, angle: 270 },
        { color: "bg-yellow-500", delay: 0.7, angle: 315 },
    ];

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Center Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                className="absolute z-10 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
                <Users className="w-10 h-10 text-teal-600" />
            </motion.div>

            {/* Connecting Lines */}
            {circles.map((circle, index) => {
                const radius = 140;
                // const x = Math.cos((circle.angle * Math.PI) / 180) * radius; // Unused
                // const y = Math.sin((circle.angle * Math.PI) / 180) * radius; // Unused

                return (
                    <motion.div
                        key={`line-${index}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.2, scale: 1 }}
                        transition={{ delay: circle.delay + 0.2 }}
                        className="absolute w-0.5 bg-gray-400"
                        style={{
                            height: `${radius}px`,
                            transformOrigin: 'bottom center',
                            transform: `rotate(${circle.angle}deg)`,
                            left: '50%',
                            top: '50%',
                            marginLeft: '-1px', // Center the generic line
                            // marginBottom: '40px' // Adjust start point if needed, or rely on z-index
                            bottom: '50%', // Start from center
                        }}
                    />
                );
            })}

            {/* Circles */}
            {circles.map((circle, index) => {
                const radius = 140;
                const x = Math.cos((circle.angle * Math.PI) / 180) * radius;
                const y = Math.sin((circle.angle * Math.PI) / 180) * radius;

                return (
                    <motion.div
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            delay: circle.delay,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                        }}
                        whileHover={{ scale: 1.1 }}
                        className={`absolute w-16 h-16 ${circle.color} rounded-2xl shadow-lg transform -rotate-45`}
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            marginLeft: '-32px',
                            marginTop: '-32px',
                        }}
                    />
                );
            })}
        </div>
    );
}
