
# Project Development Rules

## 1. General Principles

- Understand the existing project architecture before making changes.
- Do not rewrite the project unnecessarily.
- Preserve existing functionality.
- Make small, focused changes.
- Do not modify unrelated files.

## 2. Git Safety Rules

- Always check git status before modifying files.
- Work only on the current feature/development branch.
- Never modify the main branch directly.
- Never overwrite uncommitted user changes.
- Commit after completing and testing meaningful features.
- Explain changes before committing.

## 3. Dangerous Operations

Never execute the following without explicit user approval:

- git reset --hard
- git clean -fd
- git push --force
- git branch -D
- Deleting project directories or important files.

Never rewrite Git history without permission.

## 4. Development Workflow

For each feature:

1. Understand the requirements.
2. Inspect relevant source files.
3. Explain the implementation plan.
4. Implement the feature.
5. Run relevant tests.
6. Check for regressions.
7. Review git diff.
8. Summarize modified files and test results.
9. Ask for approval before committing.

## 5. Code Quality

- Follow the existing coding conventions.
- Avoid unnecessary dependencies.
- Keep code maintainable and modular.
- Handle errors appropriately.
- Do not claim tests passed unless they were actually executed.

## 6. Privacy and Security

- Never expose API keys, passwords or credentials.
- Never upload private files.
- Respect .gitignore rules.
- Do not modify environment configuration without approval.
