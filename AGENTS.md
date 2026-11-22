<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Seed state (consultations, instructions, events, audit) lives in `src/lib/care-store.tsx` React context mounted in the `_dashboard` layout, fed by `src/lib/seed-data.ts`; no backend yet, so state resets on reload — swap the provider for real queries when a backend is added.
- Patient replies are decided by the deterministic `src/lib/safety-engine.ts`: red flags first, then only active approved instructions of the authorised consultation; keep its tests in `safety-engine.test.ts` green when changing rules.
- Interaction events are built only via `buildEvent` in `src/lib/events.ts` (stores exact reply, trace, safety rule, deferred follow-up status); the follow-up queue order lives there and is covered by `events.test.ts`.
- `src/lib/safety-checks.ts` holds the safety scenarios (not shown on the dashboard, exercised by tests); checks needing a backend have no `run` and report "non_mesure" — never hardcode result percentages.
- UI never renders physician names: use `displayActor` from `src/lib/format.ts`; `approvedBy`/audit actors keep the real identity in data.
