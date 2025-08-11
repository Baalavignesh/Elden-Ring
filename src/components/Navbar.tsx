import { motion } from "motion/react";

function Navbar() {
    return (
        <motion.header 
            className="py-12 flex items-center justify-center relative z-50 bg-transparent tracking-widest"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 2,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.3
            }}
        >
            <motion.h1 
                className="text-3xl font-light tracking-wide"
                initial={{ opacity: 0, scale: 0.5, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, scale: 1, letterSpacing: "0.2em" }}
                transition={{ 
                    duration: 2.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.8
                }}
            >
                ELDEN RING
            </motion.h1>
        </motion.header>
    )
}

export default Navbar;