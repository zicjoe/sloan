import type { HTMLAttributes } from "react";

type BrandMarkProps = {
  size?: number;
  roundedClassName?: string;
  imageClassName?: string;
} & HTMLAttributes<HTMLDivElement>;

export function BrandMark({ size = 40, roundedClassName = "rounded-lg", imageClassName = "", className = "", ...props }: BrandMarkProps) {
  return (
    <div
      className={`${roundedClassName} ${className}`.trim()}
      style={{ width: size, height: size }}
      {...props}
    >
      <img
        src="/logo.png"
        alt="Sloan logo"
        className={`h-full w-full object-contain ${imageClassName}`.trim()}
        loading="eager"
      />
    </div>
  );
}
