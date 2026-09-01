"use client";

export type TreatmentZone =
  // Face / Head
  | "forehead"
  | "temple"
  | "eyes"
  | "nose"
  | "lips"
  | "cheeks"
  | "neck"
  | "hair"
  | "full_face"
  // Body
  | "bikini"
  | "underarms"
  | "body_laser"
  | "iv_wellness"
  // Fallback
  | "general";

interface AnatomyIconProps {
  zone?: TreatmentZone;
  className?: string;
  size?: number;
}

export default function AnatomyIcon({
  zone = "general",
  className = "",
  size = 48,
}: AnatomyIconProps) {
  const isBody =
    zone === "bikini" ||
    zone === "underarms" ||
    zone === "body_laser" ||
    zone === "iv_wellness";

  // ==========================================
  // BODY CANVAS
  // ==========================================
  if (isBody) {
    if (zone === "iv_wellness") {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          className={`shrink-0 ${className}`}
        >
          {/* Subtle infusion droplet / wellness motif */}
          <path
            d="M32 12C32 12 18 30 18 40C18 47.7 24.3 54 32 54C39.7 54 46 47.7 46 40C46 30 32 12 32 12Z"
            stroke="#D1C7BD"
            strokeWidth="1.5"
            fill="rgba(184, 146, 93, 0.08)"
          />
          {/* Active Glow Core */}
          <circle cx="32" cy="40" r="5" fill="#B8925D" />
          <path
            d="M32 23V29"
            stroke="#B8925D"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        {/* Sleek Minimalist Body Silhouette */}
        <circle cx="32" cy="11" r="5" stroke="#E5DFD7" strokeWidth="1.5" />
        {/* Torso & Limbs */}
        <path
          d="M23 20L20 38M41 20L44 38"
          stroke="#E5DFD7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M23 20C25 29 27 34 27 40L25 56M41 20C39 29 37 34 37 40L39 56"
          stroke="#E5DFD7"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M27 40H37"
          stroke="#E5DFD7"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Zone: Underarms */}
        {zone === "underarms" && (
          <g>
            <circle cx="21" cy="24" r="3.5" fill="#B8925D" />
            <circle cx="43" cy="24" r="3.5" fill="#B8925D" />
          </g>
        )}

        {/* Zone: Bikini / Hollywood */}
        {zone === "bikini" && (
          <path
            d="M27 41L32 47L37 41Z"
            fill="#B8925D"
            stroke="#B8925D"
            strokeWidth="1.5"
          />
        )}

        {/* Zone: General Body Laser */}
        {zone === "body_laser" && (
          <g>
            <circle cx="32" cy="26" r="2.5" fill="#B8925D" />
            <circle cx="28" cy="48" r="2.5" fill="#B8925D" />
            <circle cx="36" cy="48" r="2.5" fill="#B8925D" />
          </g>
        )}
      </svg>
    );
  }

  // ==========================================
  // FACE / HEAD CANVAS
  // ==========================================
  const isFullFace = zone === "full_face" || zone === "general";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`shrink-0 ${className}`}
    >
      {/* Base Facial Silhouette */}
      <path
        d="M32 10C21.5 10 16 17 16 29C16 41 24 54 32 54C40 54 48 41 48 29C48 17 42.5 10 32 10Z"
        stroke="#E5DFD7"
        strokeWidth="1.5"
        fill={isFullFace ? "rgba(184, 146, 93, 0.08)" : "transparent"}
      />

      {/* Nose Guide */}
      <path
        d="M32 29V34L30 35.5"
        stroke={zone === "nose" ? "#B8925D" : "#E5DFD7"}
        strokeWidth={zone === "nose" ? "2.5" : "1.2"}
        strokeLinecap="round"
      />

      {/* Zone: Hair / Scalp */}
      {zone === "hair" && (
        <path
          d="M17 22C17 12 23 8 32 8C41 8 47 12 47 22"
          stroke="#B8925D"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* Zone: Forehead */}
      {(zone === "forehead" || isFullFace) && (
        <path
          d="M23 18Q32 15 41 18"
          stroke="#B8925D"
          strokeWidth={zone === "forehead" ? "2.5" : "1.2"}
          strokeLinecap="round"
        />
      )}

      {/* Zone: Temples */}
      {zone === "temple" && (
        <g>
          <circle cx="19" cy="23" r="3" fill="#B8925D" />
          <circle cx="45" cy="23" r="3" fill="#B8925D" />
        </g>
      )}

      {/* Zone: Under Eyes */}
      {(zone === "eyes" || isFullFace) && (
        <g>
          <path
            d="M22 28Q25 31 28 28"
            stroke="#B8925D"
            strokeWidth={zone === "eyes" ? "2.2" : "1.2"}
            strokeLinecap="round"
          />
          <path
            d="M36 28Q39 31 42 28"
            stroke="#B8925D"
            strokeWidth={zone === "eyes" ? "2.2" : "1.2"}
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Zone: Cheeks */}
      {(zone === "cheeks" || isFullFace) && (
        <g>
          <ellipse
            cx="23"
            cy="35"
            rx={zone === "cheeks" ? "3.5" : "2"}
            ry={zone === "cheeks" ? "2" : "1.2"}
            fill="#B8925D"
          />
          <ellipse
            cx="41"
            cy="35"
            rx={zone === "cheeks" ? "3.5" : "2"}
            ry={zone === "cheeks" ? "2" : "1.2"}
            fill="#B8925D"
          />
        </g>
      )}

      {/* Zone: Lips */}
      {(zone === "lips" || isFullFace) && (
        <path
          d="M27 42Q32 45 37 42"
          stroke="#B8925D"
          strokeWidth={zone === "lips" ? "2.5" : "1.2"}
          strokeLinecap="round"
        />
      )}

      {/* Zone: Neck */}
      {zone === "neck" && (
        <path
          d="M26 53C26 58 27 61 27 61M38 53C38 58 37 61 37 61"
          stroke="#B8925D"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
