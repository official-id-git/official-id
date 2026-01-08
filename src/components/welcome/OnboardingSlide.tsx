import { motion } from "motion/react";
import { ReactNode } from "react";

interface OnboardingSlideProps {
    illustration: ReactNode;
    title: string;
    description: string;
}

export function OnboardingSlide({ illustration, title, description }: OnboardingSlideProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full px-6"
        >
            {/* Illustration */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-12"
            >
                {illustration}
            </motion.div>

            {/* Title and Description */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-center max-w-md"
            >
                <h1 className="text-2xl mb-4 font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600 leading-relaxed">{description}</p>
            </motion.div>
        </motion.div>
    );
}
