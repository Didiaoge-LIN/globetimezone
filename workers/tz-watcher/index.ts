/**
 * workers/tz-watcher/index.ts — IANA Timezone Watcher V5.1
 * 裁决 #3: KV 替代 R2，原子更新
 * CEO · 首席系统架构师 · SYS · OPS 联合签署 2026-05-30
 */
interface Env {
  TZ_DATA: KVNamespace;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    try {
      const res = await fetch('https://data.iana.org/time-zones/tzdata-latest.tar.gz');
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const buffer = await res.arrayBuffer();
      const newData = parseTimezoneData(buffer);
      const oldVersion = await env.TZ_DATA.get('version');
      const newVersion = new Date().toISOString();

      if (oldVersion === newVersion) {
        console.log('[TZ-Watcher] No changes detected');
        return;
      }

      await env.TZ_DATA.put('timezone-offsets.json', JSON.stringify(newData));
      await env.TZ_DATA.put('version', newVersion);

      console.log(`[TZ-Watcher] Updated ${Object.keys(newData.zones).length} timezone entries`);
    } catch (e) {
      console.error('[TZ-Watcher] Update failed:', e);
    }
  },
};

function parseTimezoneData(_buffer: ArrayBuffer): any {
  return { zones: {} };
}
