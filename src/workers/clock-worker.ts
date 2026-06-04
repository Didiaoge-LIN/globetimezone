let intervalId: number;
self.onmessage = (e: MessageEvent) => {
  if (e.data.command === 'start') {
    clearInterval(intervalId);
    intervalId = setInterval(() => {
      postMessage({ now: Date.now() });
    }, 1000) as unknown as number;
  } else if (e.data.command === 'stop') {
    clearInterval(intervalId);
  }
};
