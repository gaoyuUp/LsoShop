/**
 * 支付宝异步通知（预留）。
 * 接入步骤：
 *   1. 用支付宝公钥验签 req 的表单参数
 *   2. trade_status 为 TRADE_SUCCESS / TRADE_FINISHED 且金额一致时
 *      调用 markOrderPaid(out_trade_no, trade_no)
 *   3. 返回纯文本 "success"
 */
export async function POST() {
  return new Response("not configured", { status: 501 });
}
