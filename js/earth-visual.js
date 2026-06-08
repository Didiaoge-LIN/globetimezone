// earth-visual.js — V9.2 地球昼夜可视化
// 轻量实现：SVG 地球 + 昼夜阴影弧线
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createEarthSVG() {
    const wrap = document.getElementById('earth-visual');
    if (!wrap) return;
    wrap.innerHTML = '';

    const W = 600, H = 300;
    const cx = W / 2, cy = H / 2, r = 120;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.style.cssText = 'display:block;max-width:600px;margin:0 auto;border-radius:16px;background:#0f172a;';

    // 背景：星空
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', W); bg.setAttribute('height', H);
    bg.setAttribute('fill', '#0f172a'); svg.appendChild(bg);

    // 地球底色（海洋）
    const earth = document.createElementNS(SVG_NS, 'circle');
    earth.setAttribute('cx', cx); earth.setAttribute('cy', cy); earth.setAttribute('r', r);
    earth.setAttribute('fill', '#1e40af'); svg.appendChild(earth);

    // 陆地简化：画几个椭圆代表大陆
    const lands = [
      { cx: cx - 30, cy: cy - 20, rx: 50, ry: 35, fill: '#166534' },
      { cx: cx + 40, cy: cy + 10, rx: 35, ry: 25, fill: '#15803d' },
      { cx: cx - 60, cy: cy + 30, rx: 25, ry: 20, fill: '#166534' },
    ];
    lands.forEach(l => {
      const el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', l.cx); el.setAttribute('cy', l.cy);
      el.setAttribute('rx', l.rx); el.setAttribute('ry', l.ry);
      el.setAttribute('fill', l.fill); svg.appendChild(el);
    });

    // 昼夜分界线（当前时间计算）
    const now = new Date();
    const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
    // 昼夜分界线 = UTC 时间的反方向（-90° 对应 6:00 UTC 太阳直射）
    const terminatorAngle = ((utcHour - 6) / 24) * 360; // 度
    const rad = terminatorAngle * Math.PI / 180;

    // 黑夜半边（用 clipPath + 半边矩形模拟）
    const nightClip = document.createElementNS(SVG_NS, 'clipPath');
    nightClip.id = 'night-clip';
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', cx); clipRect.setAttribute('y', cy - r - 10);
    clipRect.setAttribute('width', r + 10); clipRect.setAttribute('height', (r + 10) * 2);
    nightClip.appendChild(clipRect);
    svg.appendChild(nightClip);

    // 黑夜覆盖层（旋转对应 UTC 时间）
    const night = document.createElementNS(SVG_NS, 'circle');
    night.setAttribute('cx', cx); night.setAttribute('cy', cy); night.setAttribute('r', r);
    night.setAttribute('fill', 'rgba(0,0,0,0.55)');
    night.setAttribute('clip-path', 'url(#night-clip)');
    // 旋转：让黑夜层对准正确经度
    const rotateDeg = -terminatorAngle;
    night.setAttribute('transform', `rotate(${rotateDeg}, ${cx}, ${cy})`);
    svg.appendChild(night);

    // 太阳_icon（日光区边缘）
    const sunAngle = terminatorAngle + 90;
    const sunRad = (sunAngle - 90) * Math.PI / 180;
    const sx = cx + r * Math.cos(sunRad) * 0.85;
    const sy = cy + r * Math.sin(sunRad) * 0.85;
    const sun = document.createElementNS(SVG_NS, 'circle');
    sun.setAttribute('cx', sx); sun.setAttribute('cy', sy);
    sun.setAttribute('r', 8);
    sun.setAttribute('fill', '#fbbf24'); sun.setAttribute('opacity', '0.9');
    svg.appendChild(sun);

    // 城市标记点（固定几个核心城市）
    const cities = [
      { name: '北京', tz: 'Asia/Shanghai', lat: 39.9, lng: 116.4 },
      { name: '伦敦', tz: 'Europe/London', lat: 51.5, lng: -0.1 },
      { name: '纽约', tz: 'America/New_York', lat: 40.7, lng: -74.0 },
      { name: '东京', tz: 'Asia/Tokyo', lat: 35.7, lng: 139.7 },
    ];
    cities.forEach(c => {
      // 简易墨卡托投影（仅示意）
      const x = cx + (c.lng / 360) * r * 1.8;
      const latRad = c.lat * Math.PI / 180;
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const y = cy - (mercN / Math.PI) * r * 0.8;
      // 用真实的时区 hour 判断是否白天
      let isDay = true;
      try {
        const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: c.tz, hour: 'numeric', hour12: false }).format(now), 10);
        isDay = h >= 6 && h < 18;
      } catch {}

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', Math.max(cx - r + 10, Math.min(cx + r - 10, x)));
      dot.setAttribute('cy', Math.max(cy - r + 10, Math.min(cy + r - 10, y)));
      dot.setAttribute('r', 4);
      dot.setAttribute('fill', isDay ? '#fbbf24' : '#94a3b8');
      dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '1');
      dot.style.cursor = 'pointer';
      dot.addEventListener('mouseenter', () => {
        // tooltip
        let tip = svg.querySelector('#tooltip');
        if (!tip) {
          tip = document.createElementNS(SVG_NS, 'g'); tip.id = 'tooltip';
          svg.appendChild(tip);
        }
        tip.innerHTML = '';
        const bg = document.createElementNS(SVG_NS, 'rect');
        bg.setAttribute('x', parseFloat(dot.getAttribute('cx')) - 40);
        bg.setAttribute('y', parseFloat(dot.getAttribute('cy')) - 30);
        bg.setAttribute('width', 80); bg.setAttribute('height', 22);
        bg.setAttribute('fill', '#1e293b'); bg.setAttribute('rx', 4);
        tip.appendChild(bg);
        const txt = document.createElementNS(SVG_NS, 'text');
        txt.setAttribute('x', parseFloat(dot.getAttribute('cx')));
        txt.setAttribute('y', parseFloat(dot.getAttribute('cy')) - 16);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('fill', '#f8fafc'); txt.setAttribute('font-size', '11');
        txt.textContent = c.name;
        tip.appendChild(txt);
      });
      dot.addEventListener('mouseleave', () => {
        const tip = svg.querySelector('#tooltip');
        if (tip) tip.remove();
      });
      svg.appendChild(dot);
    });

    // 底部时间标注
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', cx); label.setAttribute('y', H - 12);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#94a3b8'); label.setAttribute('font-size', '11');
    const tzStr = now.toUTCString().slice(17, 22) + ' UTC';
    label.textContent = `昼夜分界线 · ${tzStr}`;
    svg.appendChild(label);

    wrap.appendChild(svg);
  }

  function startLiveUpdate() {
    createEarthSVG();
    setInterval(createEarthSVG, 600000); // 每10分钟刷新
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLiveUpdate);
  } else {
    startLiveUpdate();
  }
})();
