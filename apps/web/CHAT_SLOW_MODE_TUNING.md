# Live Chat Slow-Mode Tuning (Supabase)

The frontend now handles rapid back-to-back sends gracefully (inline cooldown + countdown), but actual message pacing is still enforced by the backend chat RPC.

## Where strictness is enforced

- Supabase function/RPC: `send_chat_message`
- Chat status source: `get_chat_status` (`slow_mode_ms`)

These SQL functions are not currently stored in this repo, so tuning must be applied directly in Supabase SQL editor (or your DB migration source of truth).

## Recommended tuning approach

1. Locate the slow-mode interval value inside `send_chat_message` checks.
2. Lower the interval to the desired value (for example, from 3000ms to 1000-1500ms).
3. Ensure `get_chat_status` returns the same `slow_mode_ms` so UI messaging matches backend behavior.
4. Test in a live race chat:
   - Send two messages quickly.
   - Confirm no server "too fast" error at the new threshold.
   - Confirm UI countdown matches server pacing.

## Notes

- Frontend cannot override server slow-mode.
- If slow-mode is changed in SQL only, no frontend code change is needed as long as `slow_mode_ms` is returned correctly.
