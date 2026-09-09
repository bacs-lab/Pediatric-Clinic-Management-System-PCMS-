# Rollback Boundary

Current rollback boundary: return to `main` at `e0f0b7461b878f434fc8e89dedca48f18501ed4d`.

The legacy runtime was removed from the v2 branch but remains recoverable through Git history. Creating an annotated `legacy-mern-v1` tag is recommended and awaits owner approval.

No production infrastructure or data migration has been performed, so rollback currently means abandoning the feature branch changes.
