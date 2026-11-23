"use client";
/** 游客订单保存在本机 localStorage（登录上线后可同步到账号） */
export type LocalOrder = { orderNo: string; token: string; productName: string; variantName: string; totalCents: number; createdAt: string };

const KEY = "lso:orders";

export function getLocalOrders(): LocalOrder[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLocalOrder(o: LocalOrder) {
  const list = getLocalOrders().filter((x) => x.orderNo !== o.orderNo);
  list.unshift(o);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function removeLocalOrder(orderNo: string) {
  localStorage.setItem(KEY, JSON.stringify(getLocalOrders().filter((x) => x.orderNo !== orderNo)));
}

export function findLocalToken(orderNo: string) {
  return getLocalOrders().find((x) => x.orderNo === orderNo)?.token ?? null;
}
