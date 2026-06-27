# 广告解锁权益体系 — 视频素材制作规格书

> **项目**: GlobeTimeZone.com V9.1 广告解锁权益体系
> **日期**: 2026-06-23
> **需求方**: DIAO总 / 平头哥CEO
> **执行方**: 设计工程师 + 开发工程师 + 运营
> **文档依据**: V3.0 终极落地执行操作手册 §4.2 + scene-video-map.js

---

## 一、交付清单：5场景 × 2码率 = 10个 .mp4

| # | 场景 | 视频ID | 时长 | 高码率文件 | 低码率文件 | 解锁权益 |
|---|------|--------|------|-----------|-----------|---------|
| 1 | 跨时区会议安排 (MEETING_PLANNER) | v_meeting_001 | **8秒** | `/assets/videos/high/meeting_001.mp4` | `/assets/videos/low/meeting_001.mp4` | 1小时 |
| 2 | 世界时钟查询 (WORLD_CLOCK) | v_clock_001 | **8秒** | `/assets/videos/high/world_clock_001.mp4` | `/assets/videos/low/world_clock_001.mp4` | 1小时 |
| 3 | 时差对比 (TIME_DIFFERENCE) | v_timediff_001 | **8秒** | `/assets/videos/high/time_diff_001.mp4` | `/assets/videos/low/time_diff_001.mp4` | 1小时 |
| 4 | 跨境协作 (CROSS_BORDER) | v_cross_001 | **20秒** | `/assets/videos/high/cross_border_001.mp4` | `/assets/videos/low/cross_border_001.mp4` | 24小时 |
| 5 | 其他/合集 (OTHER) | v_collection_001 | **8秒** | `/assets/videos/high/collection_001.mp4` | `/assets/videos/low/collection_001.mp4` | 1小时 |

⚠️ **时长是硬约束**：前端 `unlock-session.js` 有3秒兜底倒计时 + 视频ended事件监听，时长误差不得超过±0.5秒。

---

## 二、技术规格

### 高码率版（4G/WiFi环境）

| 参数 | 规格 |
|------|------|
| 容器 | MP4 (H.264 video + AAC audio) |
| 分辨率 | 1280×720 (16:9) |
| 视频码率 | 1500-2500 kbps (VBR) |
| 帧率 | 30fps |
| 音频 | AAC 128kbps 44.1kHz stereo |
| 文件大小上限 | **2MB** |
| 编码 | faststart（moov atom前置，支持渐进播放）|

### 低码率版（弱网/3G环境）

| 参数 | 规格 |
|------|------|
| 容器 | MP4 (H.264 video + AAC audio) |
| 分辨率 | 640×360 (16:9) |
| 视频码率 | 400-800 kbps (VBR) |
| 帧率 | 24fps |
| 音频 | AAC 64kbps 44.1kHz stereo |
| 文件大小上限 | **800KB** |
| 编码 | faststart |

### ffmpeg 转码命令参考

```bash
# 高码率版（从源视频 source.mov 转码）
ffmpeg -i source.mov \
  -c:v libx264 -preset medium -crf 23 \
  -vf "scale=1280:720" -r 30 \
  -b:v 2000k -maxrate 2500k -bufsize 4000k \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -movflags +faststart \
  -t 8 \
  output_high.mp4

# 低码率版
ffmpeg -i source.mov \
  -c:v libx264 -preset medium -crf 28 \
  -vf "scale=640:360" -r 24 \
  -b:v 600k -maxrate 800k -bufsize 1200k \
  -c:a aac -b:a 64k -ar 44100 -ac 2 \
  -movflags +faststart \
  -t 8 \
  output_low.mp4
```

> ⚠️ `-t` 参数控制输出时长，**必须与规格表一致**（8s或20s）。
> ⚠️ `-movflags +faststart` 必须加，否则视频无法边下边播。

---

## 三、内容创意指引

### 核心原则
1. **品牌一致**：GlobeTimeZone 主色 `#165DFF`（联合国蓝），辅色 `#00C49A`
2. **无版权风险**：音乐/画面/字体必须商用授权或CC0
3. **首帧即信息**：视频loading时显示首帧，首帧必须能看出是"时区/时间"主题
4. **结尾CTA**：最后1秒淡出显示 GlobeTimeZone logo + 域名

### 各场景创意方向

**1. 跨时区会议安排 (meeting_001) — 8秒**
- 画面：地球旋转，多个城市光点亮起（纽约/伦敦/东京/悉尼），连线汇聚
- 文案：底部 "Find the perfect meeting time across time zones"
- 情绪：高效、专业

**2. 世界时钟 (world_clock_001) — 8秒**
- 画面：多个时区时钟表盘并排，指针同步转动，数字时间实时跳变
- 文案：底部 "Always know the time, anywhere in the world"
- 情绪：可靠、清晰

**3. 时差对比 (time_diff_001) — 8秒**
- 画面：两个城市昼夜分屏（左白天右黑夜），中间时差数字 "−14h" 动态变化
- 文案：底部 "Compare time differences at a glance"
- 情绪：直观、简洁

**4. 跨境协作 (cross_border_001) — 20秒 ⭐重点**
- 这是唯一20秒视频（解锁24小时权益），内容要更丰富
- 画面：团队头像/工位分布在地球不同时区，工作交接动画（A下班→B上班→C接手）
- 文案分3屏：0-7s "Your team spans the globe" / 7-14s "Keep everyone in sync" / 14-20s "GlobeTimeZone — Your global time hub"
- 情绪：协作、全球感

**5. 其他/合集 (collection_001) — 8秒**
- 画面：快速蒙太奇，前4个场景的精华画面闪现
- 文案：底部 "Every second, perfectly timed"
- 情绪：综合、品质感

---

## 四、目录结构

```
globetimezone/
└── assets/
    └── videos/
        ├── high/
        │   ├── meeting_001.mp4
        │   ├── world_clock_001.mp4
        │   ├── time_diff_001.mp4
        │   ├── cross_border_001.mp4
        │   └── collection_001.mp4
        └── low/
            ├── meeting_001.mp4
            ├── world_clock_001.mp4
            ├── time_diff_001.mp4
            ├── cross_border_001.mp4
            └── collection_001.mp4
```

⚠️ 目录路径与 `js/ad-unlock/scene-video-map.js` 中 `highBitrateUrl` / `lowBitrateUrl` **完全一致**，不可改动。

---

## 五、交付流程

### 第一步：设计工程师制作（预估2-3天）
1. 用 After Effects / Premiere / DaVinci 制作5个源视频
2. 按场景规格表裁剪到精确时长
3. 输出5个 master.mov 源文件

### 第二步：开发工程师转码（预估半天）
1. 用 ffmpeg 按上方命令转码高/低码率各5个
2. 验证文件大小、时长、faststart
3. 验证脚本：
```bash
for f in assets/videos/high/*.mp4 assets/videos/low/*.mp4; do
  duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f")
  size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
  echo "$f | duration=${duration}s | size=$((size/1024))KB"
done
```

### 第三步：放置到项目（预估10分钟）
1. 创建 `assets/videos/high/` 和 `assets/videos/low/` 目录
2. 放入10个mp4文件
3. git commit + push → CF Pages自动部署

### 第四步：联调验证
1. 访问 globetimezone.com，触发解锁弹窗
2. 确认视频能加载播放（检查Network面板）
3. 确认弱网模拟下自动切换低码率
4. 确认CSP不拦截（media-src 'self'已配置）

---

## 六、临时占位方案（开发联调用）

在真实素材制作完成前，开发可用以下占位视频跑通流程：

```bash
# 生成8秒占位视频（纯色+文字）
ffmpeg -f lavfi -i "color=c=0x165DFF:s=1280x720:d=8" \
  -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
  -c:v libx264 -t 8 -movflags +faststart \
  -vf "drawtext=text='GlobeTimeZone Placeholder':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  assets/videos/high/meeting_001.mp4
```

> 占位视频仅用于联调，上线前必须替换为真实素材。

---

## 七、验收标准

- [ ] 10个mp4文件全部到位，路径与scene-video-map.js一致
- [ ] 高码率版每个 ≤2MB，低码率版每个 ≤800KB
- [ ] 时长误差 ±0.5秒内（8s视频=7.5-8.5s，20s视频=19.5-20.5s）
- [ ] faststart已启用（ffprobe检查moov atom位置）
- [ ] 浏览器能正常播放（Chrome/Safari/Firefox）
- [ ] CSP不拦截（控制台无media-src报错）
- [ ] SW已将videos路径纳入运行时缓存（fetch事件已覆盖.mp4扩展名）

---

**签字确认**：
- 设计工程师：__________ 日期：______
- 开发工程师：__________ 日期：______
- 运营：__________ 日期：______
- DIAO总：__________ 日期：______
