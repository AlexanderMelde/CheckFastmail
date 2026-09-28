## Description
Briefly describe the change, its rationale, and what issue or requirement it addresses.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Refactor / Code cleanliness
- [ ] Documentation update
- [ ] CI / Build configuration

## Security & Verification Checklist
- [ ] Follows security invariants in [DEVELOPMENT.md](DEVELOPMENT.md) (no token leakage, proper iframe sandboxing, HTML escaping)
- [ ] Added accompanying Vitest unit tests for new logic or regression
- [ ] `npm test` passes with 100% success
- [ ] `npm run check` passes with 0 errors and 0 warnings
- [ ] `npm run build:all` builds both extension (`dist/`) and site (`dist-site/`) without errors
