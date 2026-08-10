import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export default function Logo({ className = "", size = 32, animated = false }: LogoProps) {
  const Comp = animated ? motion.svg : "svg";
  const animProps = animated
    ? {
        initial: { rotate: -10, scale: 0.8, opacity: 0 },
        animate: { rotate: 0, scale: 1, opacity: 1 },
        transition: { duration: 0.5, ease: "easeOut" },
      }
    : {};

  return (
    <Comp
      {...animProps}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MathMaster logo"
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="url(#logo-grad)" />
      {/* Sigma symbol abstraction */}
      <motion.path
        d="M18 22h16c6 0 8 4 6 10l-8 10h16"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={animated ? { duration: 0.8, delay: 0.3, ease: "easeOut" } : undefined}
      />
      {/* Pi symbol accent */}
      <motion.text
        x="32"
        y="50"
        textAnchor="middle"
        fill="white"
        fontSize="28"
        fontWeight="bold"
        fontFamily="serif"
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={animated ? { duration: 0.4, delay: 0.8 } : undefined}
      >
        π
      </motion.text>
      <defs>
        <linearGradient id="logo-grad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A7CF7" />
          <stop offset="1" stopColor="#7B5CF7" />
        </linearGradient>
      </defs>
    </Comp>
  );
}
