import "server-only";
import { env } from "@/lib/env";

/**
 * 支付渠道抽象。
 * 现在：mock（模拟支付，页面展示二维码 + 「模拟支付成功」按钮）
 * 以后：alipay —— 实现 createPayment（当面付预下单拿 qr_code）与 verifyNotify（验签异步通知），
 *       然后在 /api/payment/alipay/notify 里校验通过后调用 markOrderPaid 即可，其余流程无需改动。
 */
type PaymentSession = {
  method: "alipay";
  /** 二维码内容（支付宝返回的 qr_code 链接） */
  qrContent: string;
  /** 是否为模拟支付 */
  mock: boolean;
};

type CreatePaymentInput = { orderNo: string; subject: string; totalCents: number };

interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentSession>;
}

const mockProvider: PaymentProvider = {
  async createPayment({ orderNo }) {
    return { method: "alipay", qrContent: `${env.siteUrl}/order/${orderNo}?mockpay=1`, mock: true };
  },
};

const alipayProvider: PaymentProvider = {
  async createPayment() {
    // TODO: 支付宝资质下来后接入 alipay.trade.precreate（当面付）
    throw new Error("支付宝尚未配置，请将 PAYMENT_MODE 设置为 mock");
  },
};

export function getPaymentProvider(): PaymentProvider {
  return env.paymentMode === "alipay" ? alipayProvider : mockProvider;
}

export const isMockPayment = () => env.paymentMode !== "alipay";
