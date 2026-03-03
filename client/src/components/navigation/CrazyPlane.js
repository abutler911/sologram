// navigation/CrazyPlane.js
// RAF + Catmull-Rom spline + SVG silhouette + translate (GPU composited).
import React, { useEffect, useRef } from 'react';
import { COLORS } from '../../theme';

const catmullRom = (p0, p1, p2, p3, t) => {
  const t2 = t * t,
    t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

const catmullTangent = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  return {
    x:
      0.5 *
      (-p0.x +
        p2.x +
        (4 * p0.x - 10 * p1.x + 8 * p2.x - 2 * p3.x) * t +
        (-3 * p0.x + 9 * p1.x - 9 * p2.x + 3 * p3.x) * t2),
    y:
      0.5 *
      (-p0.y +
        p2.y +
        (4 * p0.y - 10 * p1.y + 8 * p2.y - 2 * p3.y) * t +
        (-3 * p0.y + 9 * p1.y - 9 * p2.y + 3 * p3.y) * t2),
  };
};

const CrazyPlane = ({ onDone }) => {
  const ref = useRef(null);
  const angleRef = useRef(null);

  useEffect(() => {
    const pts = [{ x: -0.08, y: 0.4 + Math.random() * 0.15 }];
    const legs = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < legs; i++) {
      pts.push({
        x: 0.06 + ((i + 1) / (legs + 1)) * 0.82 + (Math.random() - 0.5) * 0.12,
        y: 0.12 + Math.random() * 0.65,
      });
    }
    pts.push({ x: 1.12, y: 0.2 + Math.random() * 0.35 });

    const sp = [pts[0], ...pts, pts[pts.length - 1]];
    const segs = sp.length - 3;
    const duration = segs * 750 + 400;
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const raw = t * segs;
      const seg = Math.min(Math.floor(raw), segs - 1);
      const local = raw - seg;

      const pos = catmullRom(
        sp[seg],
        sp[seg + 1],
        sp[seg + 2],
        sp[seg + 3],
        local
      );
      const tan = catmullTangent(
        sp[seg],
        sp[seg + 1],
        sp[seg + 2],
        sp[seg + 3],
        local
      );
      const targetAngle = Math.atan2(tan.y, tan.x) * (180 / Math.PI);

      if (angleRef.current === null) angleRef.current = targetAngle;
      angleRef.current += (targetAngle - angleRef.current) * 0.15;

      let opacity = 1;
      if (t < 0.06) opacity = t / 0.06;
      else if (t > 0.94) opacity = (1 - t) / 0.06;

      const scale = 0.9 + Math.sin(t * Math.PI) * 0.2;
      const px = pos.x * window.innerWidth;
      const py = pos.y * window.innerHeight;

      if (ref.current) {
        ref.current.style.transform =
          'translate(' +
          px +
          'px, ' +
          py +
          'px) rotate(' +
          angleRef.current +
          'deg) scale(' +
          scale +
          ')';
        ref.current.style.opacity = opacity;
      }

      if (t < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      angleRef.current = null;
    };
  }, [onDone]);

  return (
    <div
      ref={ref}
      aria-hidden='true'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0,
        willChange: 'transform',
      }}
    >
      <svg width='32' height='32' viewBox='0 0 24 24' fill='none'>
        <path
          d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'
          fill={COLORS.primarySalmon}
        />
      </svg>
    </div>
  );
};

export default CrazyPlane;
