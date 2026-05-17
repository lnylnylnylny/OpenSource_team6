import { motion, AnimatePresence } from "motion/react";
import { useLocation, useOutlet } from "react-router";
import { NavBar } from "./components/NavBar";

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function App() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={`page-${location.pathname}-${location.key}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{position: 'absolute'}}
            className="absolute inset-0 overflow-y-auto"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
        <NavBar />
      </div>
    </div>
  );
}
