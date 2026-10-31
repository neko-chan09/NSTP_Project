// resources/js/components/common/NstpLogo.tsx
import React from "react";
import logoUrl from "../../../assets/nstpLogo.png";

interface NstpLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Unified NSTP logo.
 * Vite bundles the PNG and gives us a hashed URL for cache-busting.
 */
const NstpLogo: React.FC<NstpLogoProps> = ({
  size = 40,
  className = "",
  alt = "NSTP Logo",
}) => {
  return (
    <img
      src={logoUrl}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
};

export default NstpLogo;