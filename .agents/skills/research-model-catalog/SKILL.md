---
name: research-model-catalog
description: Research current coding and agent models for Fake Agent Wall, compare them with its simulated model labels, and propose sourced additions, updates, and removals before editing the catalog.
---

# Research the model catalog

Use this skill when asked to refresh or audit the model names shown by Fake Agent Wall. The wall simulates activity; model labels should still refer to real, current models. The catalog is a curated display mix, not a complete provider inventory.

## Scope

- Read `src/lib/corpus.ts` (`MODELS`) and `src/lib/operations.svelte.ts` (`PROVIDERS`). Inspect other model-name references before proposing edits.
- Preserve the heterogeneous provider mix and the existing UI data shapes. Treat `PROVIDERS` as a separate display list that should agree with the proposed catalog where a provider appears in both.
- Research live official provider model catalogs, release notes, and retirement notices. Record the research date and link directly to evidence for each proposed change. Use third-party sources only to find leads, then verify with the provider. Do not infer availability from a plausible name or a missing search result.
- Prefer a provider's current coding or agent model and a short, recognizable display label. Distinguish a display label from an exact API identifier. Check preview status, regional or product limits, and retirement dates when they affect whether a label belongs in the wall.

## Review before application

Present a comparison grouped as **Add**, **Update**, **Remove**, and **Keep or unresolved**. For each item, name the provider, current label (if any), proposed label, reason, and official source. An update replaces one label with another; a removal has no replacement. State explicitly when evidence is insufficient and keep that item out of the proposed patch.

Show the exact intended changes in both source lists and ask the user to confirm the proposed catalog before editing either file. Research and proposal are read-only; an earlier request to run the research does not itself approve model-list changes. If the user confirms only part of the proposal, apply only that part.

After approval, edit the smallest relevant set of entries, update both lists consistently, and run the repository's lint, type check, tests, and build. Review the resulting UI labels and report any model or surface that remains unverified. Follow the repository's authorized Git and pull request workflow for delivery.
