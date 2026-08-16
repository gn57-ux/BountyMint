// Canonical authorization declaration text (PRD §7.1: "获胜作品允许悬赏发布者用于非独占商业展示。").
// Single source of truth shared by the frontend checkbox label (src/lib/i18n)
// and the backend's POST /api/bounties/:id/generate validation, so a direct
// API caller can't submit arbitrary non-empty text as "acceptance" of the
// license — it must be exactly the declaration the user actually saw and checked.
export const LICENSE_DECLARATION = "获胜作品允许悬赏发布者用于非独占商业展示。";
