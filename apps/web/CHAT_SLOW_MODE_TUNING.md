# Live Chat Slow-Mode Tuning (Supabase)

The frontend handles rapid back-to-back sends with inline cooldown and countdown; message pacing is enforced by the backend chat RPC.

## Where strictness is enforced

- **Supabase RPC:** `send_chat_message` — enforces minimum time between messages per user per track.
- **Chat status:** `get_chat_status` — returns `slow_mode_ms` so the UI can show the same cooldown.

Both are defined in this repo: **`supabase/migrations/006_live_chat_rpc_slow_mode.sql`**.

## Current value

- **Slow-mode interval:** `1500` ms (1.5 seconds) in both `get_chat_status` (return value) and `send_chat_message` (rate-limit check).

## How to change the interval

1. Open `supabase/migrations/006_live_chat_rpc_slow_mode.sql`.
2. In **`get_chat_status`**: change the line `v_slow_mode_ms INT := 1500;` to the desired ms (e.g. `1000`).
3. In **`send_chat_message`**: change the line `v_slow_mode_ms INT := 1500;` and the `v_interval` that uses it. Keep the `RAISE EXCEPTION` message in sync if you mention seconds (e.g. "try again in 1 second" for 1000ms).
4. Re-run the migration (or run the amended function bodies in Supabase SQL editor).
5. Test in a live race chat: send two messages quickly; confirm no server error at the new threshold and that the UI countdown matches.

## Notes

- Frontend cannot override server slow-mode; it only displays the cooldown and uses `slow_mode_ms` from `get_chat_status`.
- If you change slow-mode in SQL only, no frontend code change is needed as long as `get_chat_status` returns the same `slow_mode_ms`.
