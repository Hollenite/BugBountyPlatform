# Issue Tracker

Issues and PRDs for this repo live in GitHub Issues for `Hollenite/BugBountyPlatform`.

Use the `gh` CLI from inside this repository so it can infer the remote.

## Common Commands

- Create an issue: `gh issue create --title "..." --body "..."`
- Read an issue: `gh issue view <number> --comments`
- List issues: `gh issue list --state open --json number,title,body,labels,comments`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Add a label: `gh issue edit <number> --add-label "..."`
- Remove a label: `gh issue edit <number> --remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

## Publishing Rule

When an agent skill says to publish a PRD, implementation ticket, or triage result to the issue tracker, create or update a GitHub issue unless the user gives a different instruction.
