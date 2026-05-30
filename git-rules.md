# Git & GitHub Workflow Rules

## Branching Strategy

### Main Branches
| Branch | Purpose |
|---|---|
| `main` | Production-ready, always deployable |
| `develop` | Integration branch; all feature branches merge here |

### Feature Branches
All work is done in short-lived branches off `develop`:

```
<type>/<short-description>
```

#### Branch Naming Examples
```
feat/user-authentication
feat/room-creation
feat/real-time-messaging
fix/socket-reconnect-loop
fix/jwt-expiry-handling
refactor/message-service-cleanup
docs/update-readme
chore/upgrade-socket-dependencies
```

### Rules
- Branch names use **kebab-case** only — no spaces, uppercase, or underscores.
- Prefix with the same type as the commit that will close the issue.
- Keep branch names descriptive but concise (3–5 words max).
- Delete branches after merging — no stale branches.

---

## Conventional Commits

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
```
<type>(<scope>): <short summary>

[optional body]

[optional footer — closes #issue]
```

### Types
| Type | When to Use |
|---|---|
| `feat` | A new feature visible to users or developers |
| `fix` | A bug fix |
| `refactor` | Code change that neither adds a feature nor fixes a bug |
| `docs` | Documentation only changes |
| `chore` | Tooling, config, dependency updates, no production code |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace, linting — no logic change |
| `perf` | Performance improvement |

### Scopes (project-specific)
| Scope | Covers |
|---|---|
| `auth` | Authentication — login, register, JWT |
| `rooms` | Room creation, listing, joining |
| `messages` | Message service, controller, API |
| `socket` | Socket.io server and client code |
| `store` | Zustand store logic |
| `ui` | React components, layout, styling |
| `db` | Prisma schema, migrations |
| `config` | Environment, tooling, build config |
| `deps` | Dependency upgrades or additions |

### Commit Message Examples
```
feat(auth): implement JWT registration and login endpoints
feat(rooms): add POST /api/rooms route with validation
feat(socket): authenticate socket connections via JWT handshake
feat(store): create useMessageStore with fetchMessages and addMessage actions
feat(ui): implement sidebar room list with active state highlighting
fix(socket): emit error event when message persistence fails
fix(auth): exclude password field from user select in register service
refactor(messages): extract getRoomMessages into message.service.js
docs(readme): add architecture diagram and setup instructions
chore(deps): add express-validator and configure validation chain
style(ui): align message timestamps to trailing edge of bubble
db(schema): add RoomMember join table with composite primary key
```

### Rules
- **Summary line:** Imperative mood, lowercase, no period at end, ≤ 72 characters.
- **Body (optional):** Explain *why*, not *what*. Separated from summary by blank line.
- **Footer:** Reference closed issues: `Closes #12`.
- Never write vague commit messages: `fix stuff` ❌, `update code` ❌, `WIP` ❌.
- Never commit multiple unrelated changes in a single commit.
- Use `fix` only for actual bugs — not for tweaks or refactors.

---

## Commit Frequency

- Commit **after each logical unit of work** — not after every line, not after hours of changes.
- Logical units include: creating a route, writing a service method, wiring a Zustand action, implementing a component.
- A working day of development should produce 4–10 commits.
- Never commit broken code to `develop` or `main`.

### What Belongs in One Commit
```
✅ feat(rooms): add createRoom service, controller, and route
✅ feat(ui): implement RoomList component with loading and empty state
✅ fix(socket): prevent duplicate join_room emissions on re-render
```

```
❌ feat: everything I did today   ← too broad
❌ fix: lots of bugs              ← meaningless
❌ wip                            ← never commit WIP to shared branches
```

---

## Pull Request Conventions

### PR Title
Use the same format as commit messages:
```
feat(auth): implement JWT login and registration
fix(socket): resolve race condition in join_room handler
```

### PR Description Template
```markdown
## Summary
Brief description of what this PR does and why.

## Changes
- List of specific changes made
- One per bullet

## Related Issue
Closes #<issue-number>

## Testing
How to manually test this change.

## Screenshots (if UI change)
```

### PR Rules
- PRs target `develop`, not `main`.
- Every PR must reference at least one GitHub Issue.
- Every PR must pass local tests before opening.
- Keep PRs focused — one feature or fix per PR.
- Request review before merging (even solo projects — use self-review for the record).
- Squash merge into `develop` to keep history clean.

---

## GitHub Issues & Project Board

### GitHub Projects (PM Board)
Set up a GitHub Project with these columns:

| Column | Meaning |
|---|---|
| **Backlog** | All known issues not yet started |
| **In Progress** | Currently being worked on |
| **In Review** | PR open, awaiting review |
| **Done** | Merged and closed |

### Issue Requirements
Every issue must include:
- **Clear title:** `feat: implement room listing API` or `fix: socket disconnects on token refresh`
- **Description:** What needs to be done and why
- **Labels:** `feature`, `bug`, `refactor`, `docs`, `chore`
- **Estimate:** Time estimate as a comment or label (e.g., `estimate: 2h`)
- **Working hours log:** Update as work progresses

### Issue Template (feature)
```markdown
## Description
What feature needs to be implemented and why.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Estimate
**Time estimate:** 2h

## Work Log
<!-- Update as you work -->
- 2026-05-20: Started implementation (1h)
- 2026-05-21: Completed and tested (1h)
```

### Issue Template (bug)
```markdown
## Bug Description
What is broken and how to reproduce it.

## Steps to Reproduce
1. Step one
2. Step two
3. Observe error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Estimate
**Time estimate:** 1h
```

---

## Git History Standards

### Do
- Write atomic commits (one logical change per commit).
- Use `git rebase` to clean up local branch history before opening a PR.
- Reference issues in commit footers: `Closes #12`.
- Tag the release commit on `main`: `v1.0.0`.

### Don't
- Don't force-push to `main` or `develop`.
- Don't merge `main` into feature branches — rebase instead.
- Don't commit `.env` files, `node_modules`, or build artifacts.
- Don't leave merge conflicts unresolved.
- Don't use `git add .` blindly — stage intentionally with `git add -p` or named files.

---

## `.gitignore` Essentials

```
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/

# Prisma
# (keep schema.prisma, do NOT ignore migrations/)

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Editor
.vscode/settings.json
.idea/
```

---

## Tagging and Releases

- Use semantic versioning: `v<major>.<minor>.<patch>`
- `v1.0.0` — initial working release
- `v1.1.0` — new features added
- `v1.0.1` — patch / bug fix

Tag on `main` after merging from `develop`:
```bash
git tag -a v1.0.0 -m "Initial release: full-stack real-time chat application"
git push origin v1.0.0
```

---

## Checklist Before Every Commit

- [ ] Code runs without errors locally
- [ ] No `console.log` debug statements left in
- [ ] No `.env` or secrets staged
- [ ] Commit message follows Conventional Commits format
- [ ] Change is logically atomic (single concern)
- [ ] Related issue number referenced in footer (if applicable)