interface GifProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export function Gif({ src, alt, width, height }: GifProps) {
  return (
    <div style={{ width, height, position: "relative" }}>
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
