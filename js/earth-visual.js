// earth-visual.js — V12 正交投影旋转地球
// 真实海岸线多边形 + 正交投影 + 正确的地平线裁剪
(() => {
  const D2R = Math.PI / 180;

  // ============== 大陆海岸线数据（真实坐标，~2-5°分辨率） ==============
  // 每个大陆用多个多边形描述，坐标 [经度, 纬度]，顺时针方向
  const CONTINENTS = [
    // 北美洲 (~95点)
    { name: 'na', color: '#2d8a4e', polys: [[
      // 阿拉斯加→北极海岸→拉布拉多→东海岸→墨西哥湾→中美→太平洋海岸
      [162,66],[156,62],[152,58],[148,55],[144,51],[140,45],[136,38],[130,33],
      [124,35],[120,38],[116,42],[110,46],[105,50],[100,55],[95,58],
      [92,60],[88,62],[82,64],[78,66],[74,68],[70,70],[66,71],[62,70],
      [58,68],[55,65],[52,60],[50,55],[48,50],[47,45], // 拉布拉多→纽芬兰→新斯科舍
      [50,42],[53,38],[57,35],[62,32],[65,30], // 中大西洋
      [68,27],[72,25],[75,28],[78,30],[80,25], // 佛罗里达
      [80,20],[82,15],[85,12],[87,8], // 加勒比→中美
      [90,18],[92,20],[88,21],[84,21],[82,18],
      [80,22],[77,25],[74,25], // 佛罗里达西
      [75,28],[72,30],[68,28], // 大西洋岸北
      [65,29],[60,30],[55,31],[50,32],
      [46,34],[43,37],[40,41],[37,45],
      [35,48],[32,52],[28,55], // 纽芬兰
      [25,60],[22,65],[20,68],[18,72],[15,76], // 格陵兰南
      [20,78],[25,82],[30,83],[35,84],[40,82],
      [45,80],[50,78],[55,76],[60,73], // 格陵兰北
      [62,70],[64,68],[66,67],
      [55,62],[48,60],[45,62],[42,64],[38,62],
      [35,58],[30,56],[25,52],[22,48],
      [20,45],[18,40],[18,35],[20,30],[22,25],
      [25,22],[28,18],[30,15],[32,10],[35,8],
      [38,12],[42,15],[45,18],
      [48,20],[52,25],[55,30],[58,32],
      [62,34],[64,30],[68,26],[70,30],[74,34],
      [76,38],[78,35],[76,30],[74,26], // 中大西洋回
      [72,35],[68,38],[64,40],[60,43],
      [58,46],[55,48],[52,46],[50,42],
      [48,38],[45,36],[43,40],[45,44],
      [48,46],[52,48],[55,50],[58,54],
      [62,58],[68,62],[72,66],[76,69],
      [80,72],[85,74],[90,74],[95,72],
      [100,70],[105,68],[110,65],[115,62],
      [120,58],[125,55],[130,55],[135,60],
      [140,62],[145,65],[150,64],[155,62],
      [162,66]
    ]]},
    // 格陵兰 (~22点)
    { name: 'gl', color: '#e8e8e8', polys: [[
      [18,72],[22,68],[26,64],[30,60],[32,58],[34,60],
      [38,64],[42,66],[48,68],[52,70],[54,72],[52,75],
      [48,78],[44,80],[40,81],[36,82],[30,83],[24,84],
      [18,83],[14,82],[12,80],[10,76],[14,73],[18,72]
    ]]},
    // 南美洲 (~48点)
    { name: 'sa', color: '#1f8b4c', polys: [[
      [35,5],[33,8],[30,10],[28,12],
      [25,15],[22,20],[18,22],[15,20],
      [12,15],[10,10],[8,5],[6,0],
      [4,-5],[2,-10],[0,-15],
      [-2,-20],[-4,-22],[-6,-20],
      [-8,-15],[-10,-12],[-12,-15],
      [-14,-20],[-16,-25],[-17,-30],
      [-18,-35],[-20,-38],[-22,-42],
      [-24,-45],[-27,-48],[-30,-50],
      [-34,-52],[-38,-53],[-42,-52],
      [-46,-50],[-50,-46],[-52,-42],
      [-54,-38],[-56,-34],[-55,-30],
      [-52,-26],[-48,-22],[-45,-18],
      [-42,-14],[-38,-10],[-35,-5],
      [-32,0],[-30,4],[-27,8],
      [-25,10],[-38,15],[-40,18],
      [-42,22],[-45,25],[-48,28],
      [-50,30],[-52,34],[-54,35],
      [-56,32],[-58,28],[-60,25],
      [-62,22],[-64,18],[-66,15],
      [-68,12],[-68,18],[-66,24],
      [-64,28],[-62,30],[-58,32],
      [-54,30],[-50,28],[-45,25],
      [-40,22],[-38,18],[-35,12],
      [-33,8],[-35,5]
    ]]},
    // 欧洲 (~58点) — 仅欧洲大陆，不含北非
    { name: 'eu', color: '#3a9d5e', polys: [[
      [-10,36],[-9,38],[-8,40],[-6,42],
      [-4,44],[-2,46],[-2,48],[0,50],
      [2,52],[4,54],[6,55],[8,57],
      [10,56],[12,55],[14,56],[16,54],
      [18,54],[20,55],[22,56],[24,57],
      [26,57],[28,56],[30,55],[32,54],
      [34,52],[36,50],[38,48],[40,46],
      [42,46],[44,44],[44,42],[42,40],
      [40,38],[38,40],[36,39],[34,37],
      [32,36],[30,38],[28,40],[26,42],
      [24,42],[22,43],[20,44],[18,43],
      [16,41],[14,43],[12,45],[10,44],
      [8,42],[6,40],[4,38],[2,36],
      [0,36],[-2,37],[-4,36],[-6,36],
      [-8,35],[-10,36]
    ],
    [
      // 不列颠群岛
      [-8,50],[-6,50],[-4,50],[-2,52],[0,52],[2,54],
      [4,56],[5,58],[3,60],[0,59],[-3,58],[-5,59],
      [-6,58],[-7,56],[-8,54],[-10,52],[-10,50],[-8,50],
    ],
    [
      // 斯堪的纳维亚
      [5,60],[8,58],[10,56],[12,54],[14,52],[15,50],
      [14,48],[12,46],[10,45],[8,47],[6,48],
      [4,50],[6,52],[5,55],[6,58],[8,60],
      [5,62],[8,64],[12,66],[16,67],[20,68],
      [24,68],[26,69],[28,70],[30,71],
      [28,72],[24,71],[20,70],[16,69],
      [12,68],[8,66],[5,64],[5,60],
    ],
    [
      // 冰岛
      [-22,63],[-20,62],[-18,63],[-16,64],[-14,65],
      [-16,66],[-18,67],[-20,66],[-22,65],[-24,64],
      [-24,63],[-22,63],
    ]]},
    // 非洲 (~68点)
    { name: 'af', color: '#c4862e', polys: [[
      [-17,21],[-15,25],[-15,28],
      [-18,30],[-19,35],[-18,38],
      [-20,40],[-22,42],[-24,44],
      [-25,40],[-28,35],[-30,30],
      [-30,0],[-28,-5],[-25,-10],
      [-22,-15],[-18,-18],[-15,-22],
      [-12,-28],[-8,-30],[-5,-28],
      [-2,-24],[0,-20],[2,-16],
      [5,-12],[8,-8],[10,-5],
      [12,0],[14,2],[16,5],
      [18,8],[20,10],[22,12],
      [25,15],[28,18],[30,22],
      [32,25],[35,28],[38,30],
      [40,32],[42,30],[44,28],
      [45,25],[45,22],[42,18],
      [40,15],[38,12],[35,10],
      [32,8],[28,6],[25,8],
      [22,5],[20,2],[18,0],
      [15,-2],[12,0],[10,2],
      [8,5],[5,8],[2,12],
      [0,15],[-2,18],[-5,20],
      [-8,22],[-10,20],[-12,18],
      [-14,15],[-15,18],[-17,21]
    ],
    [
      // 马达加斯加
      [43,-12],[44,-14],[45,-16],[46,-18],[47,-20],
      [48,-22],[49,-24],[50,-25],[49,-22],[48,-20],
      [47,-18],[46,-16],[44,-14],[43,-12],
    ]]},
    // 亚洲 (~105点)
    { name: 'as', color: '#34985a', polys: [[
      // 西亚→中亚→西伯利亚→远东→中国→东南亚→印度→西亚
      [26,42],[28,45],[30,48],[32,50],[34,52],
      [36,54],[38,56],[40,58],[42,60],
      [44,62],[46,64],[50,66],[55,68],
      [60,70],[65,72],[70,72],[75,70],
      [80,68],[85,66],[90,64],[95,62],
      [100,60],[105,58],[110,55],
      [115,52],[120,48],[125,45],
      [130,43],[135,45],[140,48],
      [145,52],[150,55],[155,58],
      [160,60],[162,58],[165,55],
      [168,52],[170,48],
      [162,45],[155,43],[150,40],
      [148,38],[145,35],
      [140,33],[135,36],[130,38],
      [125,40],[120,38],[115,35],
      [110,32],[105,28],[100,25],
      [95,22],[90,20],[85,22],
      [80,20],[75,25],
      [70,30],[68,32],[65,35],
      [62,38],[60,40],[58,38],
      [55,35],[52,32],[50,28],
      [48,25],[45,22],[42,18],
      [40,15],[38,18],[35,22],
      [32,25],[28,28],[25,30],
      [22,28],[20,25],
      [18,28],[16,32],[15,36],
      [18,28],[20,25],[22,30],
      [25,32],[28,34],[30,36],
      [32,38],[30,40],[28,42],
      [26,42]
    ],
    [
      // 印度次大陆
      [68,24],[72,22],[76,20],[80,18],
      [85,16],[88,20],[90,22],
      [88,24],[85,22],[82,20],
      [78,18],[75,16],[72,15],
      [70,18],[68,20],[65,22],
      [68,25],[72,27],
      [70,30],[72,33],[74,35],
      [72,32],[70,30],[68,28],
      [66,26],[68,24],
    ],
    [
      // 东南亚大陆（中南半岛）
      [92,22],[95,20],[98,16],[102,12],
      [105,10],[108,14],[110,16],
      [112,12],[110,8],[108,5],
      [105,2],[102,6],[100,10],
      [98,14],[95,18],[92,22],
    ],
    [
      // 朝鲜半岛
      [126,34],[127,35],[128,37],[129,39],[130,41],
      [128,42],[126,40],[124,38],[126,34],
    ],
    [
      // 土耳其/安纳托利亚
      [26,41],[28,41],[30,40],[32,38],
      [34,36],[36,38],[38,40],[40,41],
      [38,42],[36,43],[34,42],[32,42],
      [30,43],[28,42],[26,41],
    ],
    [
      // 阿拉伯半岛
      [35,28],[38,25],[42,22],[45,18],
      [48,16],[50,14],[52,16],[54,18],
      [56,20],[55,24],[54,26],[52,28],
      [50,27],[48,25],[45,23],[42,22],
      [38,24],[35,26],[35,28],
    ]]},
    // 东南亚群岛 (~45点)
    { name: 'sea', color: '#2d8a4e', polys: [
      // 苏门答腊
      [[95,5],[98,3],[100,0],[102,-2],[104,-4],[105,-5],
       [104,-4],[103,-2],[101,0],[99,2],[96,4],[95,5]],
      // 爪哇
      [[105,-6],[108,-7],[110,-7],[112,-8],[114,-8],[114,-7],
       [112,-6],[109,-6],[106,-7],[105,-6]],
      // 加里曼丹
      [[109,0],[112,-1],[114,-2],[116,-3],[118,-2],[119,0],
       [118,3],[116,4],[114,4],[112,3],[110,2],[108,1],[109,0]],
      // 苏拉威西
      [[119,0],[121,-1],[122,-3],[123,-5],[122,-6],[120,-5],
       [119,-4],[118,-2],[119,0]],
      // 菲律宾（吕宋+棉兰老）
      [[120,16],[121,15],[122,14],[123,13],[124,14],[125,13],
       [124,11],[123,10],[121,11],[120,12],[119,13],[120,16]],
      [[122,6],[123,5],[124,6],[125,7],[126,8],[126,7],
       [125,6],[123,5],[122,6]],
      // 新几内亚
      [[131,-2],[134,-3],[137,-4],[140,-5],[143,-6],[145,-7],
       [146,-8],[144,-7],[142,-6],[139,-5],[136,-3],[133,-2],[131,-2]],
    ]},
    // 日本 (~22点)
    { name: 'jp', color: '#3a9d5e', polys: [[
      [130,33],[131,34],[132,34],[133,35],[134,35],
      [135,36],[136,37],[137,38],[138,38],[139,38],
      [140,39],[141,40],[142,41],[142,43],[141,44],
      [140,43],[139,41],[138,39],[137,38],[136,37],
      [135,36],[134,35],[133,34],[132,33],[131,33],
      [130,33]
    ],
    [
      // 北海道
      [140,42],[141,43],[142,43],[144,44],[145,45],
      [145,44],[143,43],[142,42],[140,41],[140,42],
    ]]},
    // 澳大利亚 (~38点)
    { name: 'au', color: '#c4862e', polys: [[
      [115,-15],[118,-18],[122,-22],[126,-26],
      [130,-28],[134,-30],[138,-33],[142,-36],
      [144,-38],[146,-39],[148,-38],[150,-35],
      [152,-32],[153,-28],[153,-25],[152,-22],
      [150,-18],[148,-15],[146,-12],[144,-10],
      [142,-12],[140,-15],[138,-18],[135,-22],
      [132,-25],[128,-28],[125,-30],[122,-28],
      [120,-25],[118,-22],[116,-18],[115,-15],
      [115,-18],[117,-20],[118,-21],[117,-19],
      [115,-15]
    ],
    [
      // 塔斯马尼亚
      [145,-40],[146,-41],[147,-42],[148,-43],
      [147,-44],[146,-43],[145,-42],[145,-40],
    ]]},
    // 新西兰 (~16点)
    { name: 'nz', color: '#2d8a4e', polys: [
      [[172,-35],[173,-36],[174,-37],[175,-38],[176,-39],
       [177,-40],[178,-41],[178,-42],[176,-43],[175,-42],
       [174,-41],[173,-40],[172,-39],[172,-37],[172,-35]],
      [
      [166,-44],[167,-45],[168,-46],[169,-47],[170,-47],
      [171,-46],[169,-45],[168,-44],[166,-44],
    ]]},
    // 中美洲/墨西哥南部 (~18点)
    { name: 'ca', color: '#2d8a4e', polys: [[
      [84,22],[86,20],[88,18],[90,16],
      [92,15],[90,14],[88,13],[86,14],
      [85,16],[84,18],[82,20],[84,22],
      [84,22]
    ]]},
    // 古巴 (~10点)
    { name: 'cu', color: '#2d8a4e', polys: [[
      [74,22],[75,22],[76,21],[77,20],[78,20],[79,21],
      [80,22],[79,23],[77,23],[75,23],[74,22]
    ]]},
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
    { name: '莫斯科', tz: 'Europe/Moscow', lat: 55.8, lng: 37.6 },
    { name: '洛杉矶', tz: 'America/Los_Angeles', lat: 34.1, lng: -118.2 },
  ];

  // ============== 正交投影（true 3D globe） ==============
  function project(lng, lat, centerLng, R) {
    const dLng = (lng - centerLng) * D2R;
    const phi = lat * D2R;
    const cosPhi = Math.cos(phi);

    // 检查是否在地球正面（cos(c) > 0）
    const cosC = cosPhi * Math.cos(dLng);
    if (cosC <= -0.02) return null; // 完全在背面

    const x = R * cosPhi * Math.sin(dLng);
    const y = -R * Math.sin(phi);

    return { x, y, cosC };
  }

  // 寻找边与地平线的交点（二分查找）
  function findHorizon(lng1, lat1, lng2, lat2, centerLng, R) {
    for (let k = 0; k < 20; k++) {
      const t = (k + 1) / 21;
      const l = lng1 + (lng2 - lng1) * t;
      const la = lat1 + (lat2 - lat1) * t;
      const p = project(l, la, centerLng, R);
      if (!p || p.cosC < -0.01) {
        // 退回前一步做更精细的搜索
        for (let j = 0; j < 10; j++) {
          const tt = (t - 1/21) + (j / 10) * (1/21);
          const ll = lng1 + (lng2 - lng1) * tt;
          const lla = lat1 + (lat2 - lat1) * tt;
          const pp = project(ll, lla, centerLng, R);
          if (!pp || pp.cosC < -0.01) {
            const prevt = (t - 1/21) + (Math.max(0, j-1) / 10) * (1/21);
            const prevl = lng1 + (lng2 - lng1) * prevt;
            const prevla = lat1 + (lat2 - lat1) * prevt;
            return project(prevl, prevla, centerLng, R);
          }
        }
      }
    }
    // 回退：返回 t=0.5 的位置
    const midl = (lng1 + lng2) / 2;
    const midla = (lat1 + lat2) / 2;
    return project(midl, midla, centerLng, R) || project(lng2, lat2, centerLng, R);
  }

  function isVisible(lng, lat, centerLng) {
    const phi = lat * D2R;
    return Math.cos(phi) * Math.cos((lng - centerLng) * D2R) > -0.02;
  }

  function drawStar(ctx, x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
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

  function createEarthCanvas() {
    const wrap = document.getElementById('earth-visual');
    if (!wrap) return;

    const W = 600, H = 380;
    const cx = W / 2, cy = H / 2 + 5;
    const R = 145;

    let canvas = wrap.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.style.cssText = 'display:block;max-width:600px;width:100%;margin:0 auto;border-radius:16px;cursor:default;';
      wrap.innerHTML = '';
      wrap.appendChild(canvas);
    }

    let globeLng = 0; // 地球中心经度（旋转角度）
    let hoveredCity = null;
    let mouseX = 0, mouseY = 0;
    let lastFrame = 0;
    const ROTATION_SPEED = 4.8; // 度/秒

    // ============ 星空 ============
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        baseAlpha: Math.random() * 0.6 + 0.3,
      });
    }

    // ============ 城市屏幕坐标 ============
    function getCityScreenPos(city) {
      const p = project(city.lng, city.lat, globeLng, R);
      if (!p) return { x: 0, y: 0, visible: false };
      return {
        x: cx + p.x,
        y: cy + p.y,
        visible: true
      };
    }

    // ============ 主渲染循环 ============
    function render(timestamp) {
      if (!lastFrame) lastFrame = timestamp;
      const dt = Math.min((timestamp - lastFrame) / 1000, 0.2);
      lastFrame = timestamp;

      // 旋转
      globeLng = (globeLng + ROTATION_SPEED * dt) % 360;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      // --- 深空背景 ---
      const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, Math.max(W, H));
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

      // --- 大气光晕 ---
      const atmoGrad = ctx.createRadialGradient(cx, cy, R - 2, cx, cy, R + 16);
      atmoGrad.addColorStop(0, 'rgba(64, 150, 255, 0)');
      atmoGrad.addColorStop(0.4, 'rgba(64, 150, 255, 0.08)');
      atmoGrad.addColorStop(0.7, 'rgba(56, 200, 255, 0.15)');
      atmoGrad.addColorStop(1, 'rgba(56, 200, 255, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath(); ctx.arc(cx, cy, R + 16, 0, Math.PI * 2); ctx.fill();

      // --- 地球底色（海洋） ---
      const oceanGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.3, R * 0.1, cx, cy, R);
      oceanGrad.addColorStop(0, '#1a5fb4');
      oceanGrad.addColorStop(0.35, '#1450a0');
      oceanGrad.addColorStop(0.75, '#0c3d7a');
      oceanGrad.addColorStop(1, '#082d5c');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // --- 裁剪到地球圆 ---
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

      // --- 大陆（边遍历 + 深度排序 + 正确的地平线处理） ---
      // 先收集所有可见多边形及其路径和深度
      const renderQueue = [];
      CONTINENTS.forEach(continent => {
        continent.polys.forEach(poly => {
          if (poly.length < 3) return;

          const path = [];
          let totalDepth = 0;
          let visibleCount = 0;
          const n = poly.length;

          for (let i = 0; i < n; i++) {
            const [lng, lat] = poly[i];
            const [nlng, nlat] = poly[(i + 1) % n];

            const p = project(lng, lat, globeLng, R);
            const np = project(nlng, nlat, globeLng, R);
            const vis = isVisible(lng, lat, globeLng);
            const nvis = isVisible(nlng, nlat, globeLng);

            if (p && vis) {
              path.push([cx + p.x, cy + p.y]);
              totalDepth += p.cosC;
              visibleCount++;
            }

            if (vis !== nvis && (p || np)) {
              const hp = findHorizon(lng, lat, nlng, nlat, globeLng, R);
              if (hp) {
                path.push([cx + hp.x, cy + hp.y]);
                totalDepth += hp.cosC;
                visibleCount++;
              }
            }
          }

          if (path.length >= 3 && visibleCount > 0) {
            renderQueue.push({
              color: continent.color,
              path: path,
              depth: totalDepth / visibleCount // 平均深度
            });
          }
        });
      });

      // 按深度排序：远的先画，近的后画
      renderQueue.sort((a, b) => a.depth - b.depth);

      renderQueue.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(item.path[0][0], item.path[0][1]);
        for (let i = 1; i < item.path.length; i++) {
          ctx.lineTo(item.path[i][0], item.path[i][1]);
        }
        ctx.closePath();
        ctx.fill();
      });

      // --- 球体3D边缘阴影 ---
      const shadeGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.25, R * 0.6, cx, cy, R);
      shadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadeGrad.addColorStop(0.55, 'rgba(0,0,0,0.04)');
      shadeGrad.addColorStop(0.85, 'rgba(0,0,0,0.35)');
      shadeGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = shadeGrad;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // --- 昼夜分界线（黑夜渐变覆盖） ---
      const now = new Date();
      const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
      const sunLng = ((utcMinutes / 1440) * 360 - 180 + 360) % 360; // 太阳直射经度
      const nightLng = (sunLng + 180) % 360; // 黑夜中心（太阳对面）

      const nightP = project(nightLng, 0, globeLng, R);
      if (nightP) {
        const nightGrad = ctx.createRadialGradient(
          cx + nightP.x, cy + nightP.y, R * 0.25,
          cx + nightP.x, cy + nightP.y, R * 1.6
        );
        nightGrad.addColorStop(0, 'rgba(5, 10, 30, 0.68)');
        nightGrad.addColorStop(0.3, 'rgba(5, 10, 30, 0.55)');
        nightGrad.addColorStop(0.55, 'rgba(5, 10, 30, 0.25)');
        nightGrad.addColorStop(0.8, 'rgba(5, 10, 30, 0.05)');
        nightGrad.addColorStop(1, 'rgba(5, 10, 30, 0)');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

        // 城市灯光
        CITIES.forEach(city => {
          const pos = getCityScreenPos(city);
          if (!pos.visible) return;
          const dLng = Math.abs(((city.lng - nightLng) % 360 + 540) % 360 - 180);
          if (dLng < 80) {
            const nightAlpha = Math.max(0, 1 - dLng / 80) * 0.5;
            ctx.fillStyle = `rgba(255, 220, 150, ${nightAlpha})`;
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2); ctx.fill();
            const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 8);
            glowGrad.addColorStop(0, `rgba(255, 200, 100, ${nightAlpha})`);
            glowGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2); ctx.fill();
          }
        });
      }

      // --- 城市标记点 ---
      CITIES.forEach((city, idx) => {
        const pos = getCityScreenPos(city);
        if (!pos.visible) return;

        let isDay = true;
        try {
          const h = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: city.tz, hour: 'numeric', hour12: false
          }).format(now), 10);
          isDay = h >= 6 && h < 18;
        } catch (e) {}

        const isHovered = hoveredCity === city;
        const pulse = Math.sin(timestamp * 0.003 + idx) * 0.5 + 0.5;

        // 脉冲环
        const ringR = 6 + pulse * 3;
        ctx.strokeStyle = isDay
          ? `rgba(255, 200, 50, ${0.6 - pulse * 0.3})`
          : `rgba(180, 200, 220, ${0.5 - pulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, ringR, 0, Math.PI * 2); ctx.stroke();

        // 城市点
        const dotR = isHovered ? 6 : 3.5;
        ctx.fillStyle = isDay ? '#fbbf24' : '#a8c5e0';
        ctx.beginPath(); ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2); ctx.fill();

        // hover 标签
        if (isHovered) {
          const tagW = ctx.measureText(city.name).width + 14;
          const tagX = pos.x - tagW / 2, tagY = pos.y - 20;
          const rr = 5;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = 'rgba(100, 160, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tagX + rr, tagY);
          ctx.lineTo(tagX + tagW - rr, tagY);
          ctx.arcTo(tagX + tagW, tagY, tagX + tagW, tagY + rr, rr);
          ctx.lineTo(tagX + tagW, tagY + 22 - rr);
          ctx.arcTo(tagX + tagW, tagY + 22, tagX + tagW - rr, tagY + 22, rr);
          ctx.lineTo(tagX + rr, tagY + 22);
          ctx.arcTo(tagX, tagY + 22, tagX, tagY + 22 - rr, rr);
          ctx.lineTo(tagX, tagY + rr);
          ctx.arcTo(tagX, tagY, tagX + rr, tagY, rr);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f0f4ff';
          ctx.font = '11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(city.name, pos.x, tagY + 15);
        }
      });

      ctx.restore(); // 地球 clip

      // --- 表面高光 ---
      const highlightGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.05, cx, cy, R);
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      highlightGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.04)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGrad;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // --- 底部时间标签 ---
      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const tzStr = now.toUTCString().slice(17, 25) + ' UTC';
      const terminatorLabel = (typeof window.GTZ_T === 'function') ? window.GTZ_T('earth.terminator', '实时昼夜分界') : '实时昼夜分界';
      ctx.fillText(`${terminatorLabel} · ${tzStr}`, cx, H - 8);

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
      let minDist = 28;
      CITIES.forEach(city => {
        const pos = getCityScreenPos(city);
        if (!pos.visible) return;
        const dist = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
        if (dist < minDist) { minDist = dist; hoveredCity = city; }
      });
      canvas.style.cursor = hoveredCity ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', () => {
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
