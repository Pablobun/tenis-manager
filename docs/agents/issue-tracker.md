# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## El repo está en GitHub, pero el tracker es local

El código vive en GitHub (`https://github.com/Pablobun/tenis-manager`) con deploy automático (GitHub Actions → Droplet, Render). Sin embargo, los **issues/tickets del proyecto se siguen trackeando en markdown local** (`.scratch/tenis-manager/issues/`). No usar GitHub Issues hasta que se decida migrar.

Para migrar a GitHub Issues hará falta: correr `/setup-matt-pocock-skills`, regenerar este archivo desde el seed `issue-tracker-github.md` de la carpeta del skill, e instalar la CLI `gh` (hoy no está instalada en la máquina). Los issues existentes en `.scratch/` se pueden migrar o dejar como registro histórico; la decisión se toma en el momento de la migración.
