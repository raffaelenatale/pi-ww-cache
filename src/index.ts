/**
 * pi-ww-cache
 *
 * On-demand `/keep-alive` toggle for pi's built-in prompt-cache warmer.
 *
 * Provider prompt caches (e.g. Anthropic's) expire after their TTL once a
 * session goes idle, so the next message pays a full-price prefill. Pi ships
 * a native cache warmer (`cacheWarming`: "off" | "streaming" | "idle"), but
 * its policy is global and always-on.
 *
 * This extension makes warming opt-in per session:
 * - Default OFF: every `cache_warming_decision` is answered with `stop`,
 *   so no warm ping is ever sent unless you asked for it.
 * - `/keep-alive` (or `/keep-alive on`) flips the session to ON: decisions
 *   are answered with `warm` and pi refreshes the cache entry while idle.
 *
 * Requirements:
 *   `~/.pi/agent/settings.json` must set `"cacheWarming": "idle"`, otherwise
 *   pi never evaluates idle warming and this extension has nothing to allow.
 *
 * Usage:
 *   /keep-alive          toggle on/off
 *   /keep-alive on|off   explicit
 *   /keep-alive status   show current state and ping count
 *
 * Notes:
 * - Enabling mid-session takes effect from the next model request (the warmer
 *   run restarts on each real request).
 * - Warm refresh usage counts toward session totals but never enters the
 *   model context.
 * - State is per-session (in-memory): every new session starts OFF.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function wwCache(pi: ExtensionAPI) {
	let enabled = false;
	let warmCount = 0;

	pi.on("cache_warming_decision", () => {
		if (!enabled) return { action: "stop" as const };
		warmCount++;
		return { action: "warm" as const };
	});

	pi.registerCommand("keep-alive", {
		description: "Toggle per-session prompt-cache keep-alive (warm pings while idle)",
		handler: async (arg, ctx) => {
			const cmd = (arg ?? "").trim().toLowerCase();
			if (cmd === "status") {
				ctx.ui.notify(
					`keep-alive: ${enabled ? "ON" : "OFF"} — ${warmCount} warm ${warmCount === 1 ? "ping" : "pings"} this session`,
					"info",
				);
				return;
			}
			if (cmd === "on") enabled = true;
			else if (cmd === "off") enabled = false;
			else enabled = !enabled;

			ctx.ui.notify(
				enabled
					? "keep-alive ON — cache warm pings enabled (from the next model request; stop with /keep-alive off)"
					: "keep-alive OFF — no cache warm pings will be sent",
				"info",
			);
		},
	});
}
