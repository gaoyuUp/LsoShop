export function normalizeAgentRef(value: string | null | undefined) {
  return (value ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toUpperCase();
}

export function agentRefQuery(refCode: string) {
  return refCode ? `?ref=${encodeURIComponent(refCode)}` : "";
}

export function agentOrdersHref(refCode: string) {
  return `/orders${agentRefQuery(refCode)}`;
}

export function agentProductsHref(refCode: string) {
  return refCode ? `/r/${refCode}#products` : "/#products";
}
