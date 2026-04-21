import { useTheme } from '../context/ThemeContext';

const BACKGROUND_VIDEO = '/videos/banner-dodplZ4U.mp4';
const BACKGROUND_POSTER = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80';

export default function GlobalBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="site-backdrop" aria-hidden="true">
      <video
        className="site-backdrop__media"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={BACKGROUND_POSTER}
      >
        <source src={BACKGROUND_VIDEO} type="video/mp4" />
      </video>
      <div className="site-backdrop__base" />
      <div className="site-backdrop__veil" style={{ opacity: isDark ? 0.92 : 0.84 }} />
    </div>
  );
}