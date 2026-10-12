# pi-ww-cache

Pi extension that adds an on-demand `/keep-alive` toggle for pi's built-in
prompt-cache warmer.

## Why

Provider prompt caches (e.g. Anthropic's) expire after their TTL once a
session goes idle, so the next message pays a full-price prefill. Pi ships a
native cache warmer (`cacheWarming`: `"off" | "streaming" | "idle"`), but its
policy is global and always-on. `pi-ww-cache` makes warming **opt-in per
session**: nothing is sent until you ask for it.

## Setup

1. Set `"cacheWarming": "idle"` in `~/.pi/agent/settings.json` (one time).
   Without `"idle"`, pi never evaluates idle warming and there is nothing to
   allow.

2. Install the extension:

   ```bash
   pi install git:github.com/raffaelenatale/pi-ww-cache
   # or locally:
   pi install ~/Coding2/pi-ww-cache
   ```

## Usage

```
/keep-alive          toggle on/off
/keep-alive on       enable
/keep-alive off      disable
/keep-alive status   current state + ping count
```

- Default is **OFF**: every cache-warming decision is answered with `stop`.
- **ON**: decisions are answered with `warm`, and pi refreshes the cache entry
  while the session is idle (warm reads are ~90% cheaper than a cold prefill).
- Enabling mid-session takes effect from the next model request.
- Warm usage counts toward session totals but never enters model context.
- State is per-session; every new session starts OFF.
- Pi's own safety limit applies (idle warming stops after 30 minutes).

## License

MIT
