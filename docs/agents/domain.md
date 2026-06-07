# Domain Docs

This is a single-context repo.

## Read Order

Before changing product behavior or architecture, read:

1. `CONTEXT.md`
2. Relevant docs under `context/`
3. Relevant ADRs under `docs/adr/`, if that directory exists
4. `docs/agents/project-structure.md`

## Context Layout

```text
/
|-- CONTEXT.md
|-- context/
|-- docs/
|   `-- agents/
`-- src/
```

There is no `CONTEXT-MAP.md` at the moment. If the repo becomes a monorepo or splits into multiple bounded contexts, add `CONTEXT-MAP.md` and update this file.

## Vocabulary Rule

Use the terms in `CONTEXT.md` for issue titles, PRDs, review notes, test names, and implementation summaries. In particular, prefer:

- unsafe agent-tool execution
- security test session
- structured trace
- reproduction-by-rerun
- verifier replay
- evidence hash
- report hash

Do not silently replace these with generic bug bounty or blockchain marketplace language.
