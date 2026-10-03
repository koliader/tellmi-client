/**
 * The four states every data panel on the home page can be in.
 *
 * Passed as one value rather than a set of booleans so a panel cannot be asked
 * to show an empty state for a request that actually failed, which is how a
 * broken API ends up reading as "nothing here yet".
 */
export type PanelStatus = "loading" | "unavailable" | "empty" | "ready";
