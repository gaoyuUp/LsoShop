"use client";
import { useSearchParams } from "next/navigation";
import { agentOrdersHref, agentProductsHref, agentRefQuery, normalizeAgentRef } from "@/lib/agent-ref";

export function useAgentOrderRef() {
  const searchParams = useSearchParams();
  const refCode = normalizeAgentRef(searchParams.get("ref"));
  return {
    refQuery: agentRefQuery(refCode),
    ordersHref: agentOrdersHref(refCode),
    productsHref: agentProductsHref(refCode),
  };
}
