import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
};

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  className,
  loading = "lazy",
  decoding = "async",
  ...rest
}: ImageProps) {
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={cn("absolute inset-0 h-full w-full", className)}
        {...rest}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={className}
      {...rest}
    />
  );
}
