// earth-visual.js — V11 Canvas 动态旋转地球
// 60fps Canvas 渲染：旋转地球 + 实时昼夜分界 + 大气光晕 + 星空 + 脉冲城市
(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ============== 大陆形状简化（经纬度偏移量，相对于圆心） ==============
  // 每个大陆用多边形近似，坐标是 (经度偏移°, 纬度偏移°)，会随旋转移动
  const CONTINENTS = [
    // 北美洲
    { name: 'na', color: '#2d8a4e', polys: [
      [[-130,55],[-120,50],[-110,55],[-100,45],[-90,38],[-85,30],[-80,25],[-75,30],[-70,42],[-65,47],[-70,55],[-75,60],[-80,62],[-90,65],[-100,68],[-120,60],[-130,55]]
    ]},
    // 南美洲
    { name: 'sa', color: '#1f8b4c', polys: [
      [[-80,10],[-70,5],[-65,0],[-60,-5],[-55,-15],[-50,-25],[-45,-35],[-50,-40],[-55,-40],[-60,-35],[-65,-25],[-70,-15],[-75,-5],[-80,5],[-80,10]]
    ]},
    // 欧洲
    { name: 'eu', color: '#3a9d5e', polys: [
      [[-10,55],[0,52],[5,50],[10,48],[15,45],[20,42],[25,44],[30,46],[35,48],[40,50],[45,55],[40,58],[30,60],[20,58],[10,60],[0,62],[-5,60],[-10,58],[-10,55]]
    ]},
    // 非洲
    { name: 'af', color: '#c4862e', polys: [
      [[-15,35],[-5,35],[5,32],[15,28],[25,30],[35,25],[40,15],[45,5],[42,-5],[38,-15],[32,-25],[28,-30],[22,-30],[18,-25],[15,-15],[10,-5],[5,5],[0,10],[-5,8],[-10,5],[-15,10],[-18,15],[-15,25],[-15,35]]
    ]},
    // 亚洲
    { name: 'as', color: '#34985a', polys: [
      [[60,30],[70,35],[80,40],[90,45],[100,50],[110,50],[120,45],[130,40],[140,38],[145,42],[150,48],[155,50],[160,55],[155,60],[145,60],[135,55],[125,50],[115,45],[105,40],[95,35],[85,30],[75,25],[65,22],[60,30]],
      [[70,55],[75,60],[85,65],[95,68],[105,70],[110,68],[115,65],[120,60],[125,55],[130,52],[140,55],[150,58],[155,60],[160,62],[160,65],[150,68],[130,70],[110,72],[90,70],[75,65],[70,55]]
    ]},
    // 东南亚群岛
    { name: 'sea', color: '#2d8a4e', polys: [
      [[95,0],[100,-5],[105,-8],[110,-5],[115,-2],[120,0],[125,-5],[130,-8],[135,-5],[140,-2],[145,0],[140,5],[135,5],[130,2],[125,0],[120,3],[115,5],[110,3],[105,0],[100,2],[95,0]]
    ]},
    // 澳大利亚
    { name: 'au', color: '#c4862e', polys: [
      [[115,-15],[120,-18],[130,-20],[135,-22],[140,-25],[145,-28],[148,-33],[145,-38],[140,-38],[135,-35],[130,-32],[125,-30],[118,-28],[115,-25],[115,-18],[115,-15]]
    ]},
    // 日本
    { name: 'jp', color: '#3a9d5e', polys: [
      [[130,31],[132,33],[135,35],[138,37],[140,40],[141,42],[140,43],[138,41],[136,38],[134,35],[132,33],[130,31]]
    ]},
    // 新西兰
    { name: 'nz', color: '#2d8a4e', polys: [
      [[170,-35],[172,-37],[174,-40],[176,-43],[178,-45],[176,-46],[174,-44],[172,-42],[170,-43],[168,-40],[170,-38],[170,-35]]
    ]},
  ];

  // ============== 城市数据 ==============
  const CITIES = [
    { name: '北京', tz: 'Asia/Shanghai', lat: 39.9, lng: 116.4 },
    { name: '上海', tz: 'Asia/Shanghai', lat: 31.2, lng: 121.5 },
    { name: '东京', tz: 'Asia/Tokyo', lat: 35.7, lng: 139.7 },
    { name: '悉尼', tz: 'Australia/Sydney', lat: -33.9, lng: 151.2 },
    { name: '伦敦', tz: 'Europe/London', lat: 51.5, lng: -0.1 },
    { name: '纽约', tz: 'America/New_York', lat: 40.7, lng: -74.0 },
    { name: '旧金山', tz: 'America/Los_Angeles', lat: 37.8, lng: -122.4 },
    { name: '迪拜', tz: 'Asia/Dubai', lat: 25.2, lng: 55.3 },
    { name: '新加坡', tz: 'Asia/Singapore', lat: 1.3, lng: 103.8 },
    { name: '巴黎', tz: 'Europe/Paris', lat: 48.9, lng: 2.3 },
  ];

  function lonToX(lng, globeLonOffset, cx, r) {
    const adj = ((lng + globeLonOffset) % 360 + 360) % 360;
    const rad = (adj - 180) * Math.PI / 180;
    return cx + r * Math.cos(rad);
  }

  function latToY(lat, cy, r, tilt) {
    // 简化投影：lat 直接映射到 y
    const rad = lat * Math.PI / 180;
    return cy - r * Math.sin(rad) * 0.75;
  }

  function isPointVisible(lng, globeLonOffset) {
    const adj = ((lng + globeLonOffset) % 360 + 360) % 360;
    // 在可见半球（0-180° 在正面，180-360° 在背面）
    return adj > 90 && adj < 270;
  }

  function drawStar(ctx, x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // 十字光芒（大星）
    if (r > 1.5) {
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - r * 2.5, y); ctx.lineTo(x + r * 2.5, y);
      ctx.moveTo(x, y - r * 2.5); ctx.lineTo(x, y + r * 2.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawContinentPoly(ctx, poly, globeLonOffset, cx, cy, r) {
    if (poly.length < 3) return;
    ctx.beginPath();
    let started = false;
    let allBack = true;
    for (let i = 0; i < poly.length; i++) {
      const [lng, lat] = poly[i];
      const x = lonToX(lng, globeLonOffset, cx, r);
      const y = latToY(lat, cy, r, 0);
      if (isPointVisible(lng, globeLonOffset)) {
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
        allBack = false;
      } else {
        if (started) {
          // 点已经转到背面，需要闭合或画到边缘
          ctx.lineTo(x, y);
        }
      }
    }
    if (!allBack && started) {
      ctx.closePath();
      ctx.fill();
    }
  }

  function createEarthCanvas() {
    const wrap = document.getElementById('earth-visual');
    if (!wrap) return;

    const W = 600, H = 360;
    const cx = W / 2, cy = H / 2;
    const r = 130;

    // 创建或复用 canvas
    let canvas = wrap.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.style.cssText = 'display:block;max-width:600px;width:100%;margin:0 auto;border-radius:16px;cursor:default;';
      wrap.innerHTML = '';
      wrap.appendChild(canvas);
    }

    let globeLonOffset = 0;
    let hoveredCity = null;
    let mouseX = 0, mouseY = 0;
    let lastFrame = 0;
    const ROTATION_SPEED = 0.08; // 度/帧 @ 60fps ≈ 4.8°/秒

    // ============ 星空生成（固定种子） ============
    const stars = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        baseAlpha: Math.random() * 0.6 + 0.3,
      });
    }

    // ============ 城市位置缓存 ============
    function getCityScreenPos(city) {
      const x = lonToX(city.lng, globeLonOffset, cx, r);
      const y = latToY(city.lat, cy, r, 0);
      const visible = isPointVisible(city.lng, globeLonOffset);
      // 检查是否在地球圆内
      const dx = x - cx, dy = y - cy;
      const inside = Math.sqrt(dx * dx + dy * dy) < r;
      return { x, y, visible: visible && inside };
    }

    // ============ 主渲染循环 ============
    function render(timestamp) {
      if (!lastFrame) lastFrame = timestamp;
      const dt = (timestamp - lastFrame) / 1000;
      lastFrame = timestamp;

      // 旋转地球
      globeLonOffset = (globeLonOffset + ROTATION_SPEED) % 360;
      if (dt > 0.2) globeLonOffset = (globeLonOffset + ROTATION_SPEED * dt * 60) % 360; // 补偿掉帧

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      // --- 背景 ---
      const bgGrad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, Math.max(W, H));
      bgGrad.addColorStop(0, '#0a1628');
      bgGrad.addColorStop(0.5, '#060e1a');
      bgGrad.addColorStop(1, '#020610');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // --- 星空 ---
      stars.forEach(s => {
        const alpha = s.baseAlpha + Math.sin(timestamp * s.twinkleSpeed + s.twinkleOffset) * 0.25;
        drawStar(ctx, s.x, s.y, s.r, Math.max(0.1, alpha));
      });

      // --- 大气光晕（地球后面） ---
      const atmoGrad = ctx.createRadialGradient(cx, cy, r - 2, cx, cy, r + 14);
      atmoGrad.addColorStop(0, 'rgba(64, 150, 255, 0)');
      atmoGrad.addColorStop(0.5, 'rgba(64, 150, 255, 0.12)');
      atmoGrad.addColorStop(0.8, 'rgba(56, 200, 255, 0.18)');
      atmoGrad.addColorStop(1, 'rgba(56, 200, 255, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2); ctx.fill();

      // --- 地球底色（海洋） ---
      const oceanGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.1, cx, cy, r);
      oceanGrad.addColorStop(0, '#1a5fb4');
      oceanGrad.addColorStop(0.4, '#1450a0');
      oceanGrad.addColorStop(0.8, '#0c3d7a');
      oceanGrad.addColorStop(1, '#082d5c');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // --- 裁剪到地球圆 ---
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

      // --- 大陆 ---
      CONTINENTS.forEach(continent => {
        ctx.fillStyle = continent.color;
        continent.polys.forEach(poly => {
          drawContinentPoly(ctx, poly, globeLonOffset, cx, cy, r);
        });
      });

      // --- 球体3D阴影（边缘暗） ---
      const shadeGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.25, r * 0.65, cx, cy, r);
      shadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadeGrad.addColorStop(0.6, 'rgba(0,0,0,0.08)');
      shadeGrad.addColorStop(0.9, 'rgba(0,0,0,0.45)');
      shadeGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = shadeGrad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // --- 昼夜分界线（黑夜覆盖） ---
      const now = new Date();
      const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      // 太阳直射经度（UTC 12:00 = 0°, UTC 0:00 = -180°）
      const sunLng = ((utcHour - 12) / 24) * 360;
      // 把太阳经度映射到地球旋转后的位置
      const nightCenterLng = ((sunLng - 180) % 360 + 360) % 360;

      // 使用渐变模拟黑夜（从暗面逐渐过渡）
      const nightX = lonToX(nightCenterLng, globeLonOffset, cx, r);
      const nightY = cy;

      if (isPointVisible(nightCenterLng, globeLonOffset)) {
        // 黑夜中心在可见面
        const nightGrad = ctx.createRadialGradient(nightX, nightY, r * 0.3, nightX, nightY, r * 1.5);
        nightGrad.addColorStop(0, 'rgba(5, 10, 30, 0.65)');
        nightGrad.addColorStop(0.4, 'rgba(5, 10, 30, 0.55)');
        nightGrad.addColorStop(0.7, 'rgba(5, 10, 30, 0.25)');
        nightGrad.addColorStop(1, 'rgba(5, 10, 30, 0)');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        // 城市灯光（黑夜面上的光点）
        CITIES.forEach(city => {
          const pos = getCityScreenPos(city);
          if (!pos.visible) return;
          // 检查是否在黑夜区
          const adjLng = ((city.lng + globeLonOffset) % 360 + 360) % 360;
          const adjNight = ((nightCenterLng + globeLonOffset) % 360 + 360) % 360;
          const dLng = Math.min(Math.abs(adjLng - adjNight), 360 - Math.abs(adjLng - adjNight));
          const isNight = dLng < 80;
          if (isNight) {
            const nightAlpha = Math.max(0, 1 - dLng / 80) * 0.5;
            ctx.fillStyle = `rgba(255, 220, 150, ${nightAlpha})`;
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2); ctx.fill();
            // 光晕
            const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 8);
            glowGrad.addColorStop(0, `rgba(255, 200, 100, ${nightAlpha})`);
            glowGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2); ctx.fill();
          }
        });
      }

      // --- 城市标记点 ---
      CITIES.forEach(city => {
        const pos = getCityScreenPos(city);
        if (!pos.visible) return;

        // 判断当地是否白天
        let isDay = true;
        try {
          const h = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: city.tz, hour: 'numeric', hour12: false
          }).format(now), 10);
          isDay = h >= 6 && h < 18;
        } catch(e) {}

        const isHovered = hoveredCity === city;

        // 脉冲环
        const pulse = Math.sin(timestamp * 0.003 + CITIES.indexOf(city)) * 0.5 + 0.5;
        const ringR = 6 + pulse * 3;
        ctx.strokeStyle = isDay ? `rgba(255, 200, 50, ${0.6 - pulse * 0.3})` : `rgba(180, 200, 220, ${0.5 - pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, ringR, 0, Math.PI * 2); ctx.stroke();

        // 城市点
        const dotR = isHovered ? 6 : 4;
        ctx.fillStyle = isDay ? '#fbbf24' : '#a8c5e0';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2); ctx.fill();

        // hover 效果：标签
        if (isHovered) {
          const tagW = ctx.measureText(city.name).width + 12;
          const tagX = pos.x - tagW / 2;
          const tagY = pos.y - 18;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = 'rgba(100, 160, 255, 0.5)';
          ctx.lineWidth = 1;
          // 手动圆角矩形（兼容性）
          const rr = 4, rx = tagX, ry = tagY, rw = tagW, rh = 20;
          ctx.beginPath();
          ctx.moveTo(rx + rr, ry);
          ctx.lineTo(rx + rw - rr, ry);
          ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr);
          ctx.lineTo(rx + rw, ry + rh - rr);
          ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr);
          ctx.lineTo(rx + rr, ry + rh);
          ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr);
          ctx.lineTo(rx, ry + rr);
          ctx.arcTo(rx, ry, rx + rr, ry, rr);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f0f4ff';
          ctx.font = '11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(city.name, pos.x, tagY + 14);
        }
      });

      ctx.restore(); // 地球 clip

      // --- 地球表面高光（顶部弧形反光） ---
      const highlightGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.05, cx, cy, r);
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      highlightGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGrad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // --- 底部时间标签 ---
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const tzStr = now.toUTCString().slice(17, 25) + ' UTC';
      ctx.fillText(`昼夜分界实时更新 · ${tzStr}`, cx, H - 8);

      requestAnimationFrame(render);
    }

    // ============ 鼠标交互 ============
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      mouseX = (e.clientX - rect.left) * scaleX;
      mouseY = (e.clientY - rect.top) * scaleY;

      hoveredCity = null;
      let minDist = 25;
      CITIES.forEach(city => {
        const pos = getCityScreenPos(city);
        if (!pos.visible) return;
        const dist = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          hoveredCity = city;
        }
      });
      canvas.style.cursor = hoveredCity ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', (e) => {
      if (hoveredCity) {
        const input = document.getElementById('decision-input');
        if (input) {
          input.value = hoveredCity.name;
          input.focus();
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredCity = null;
      canvas.style.cursor = 'default';
    });

    // 开始渲染
    requestAnimationFrame(render);
  }

  function startEarth() {
    createEarthCanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startEarth);
  } else {
    startEarth();
  }
})();
