/**
 * Stripe Webhook 支付回调（预留版）
 * 环境变量：STRIPE_SECRET_KEY、STRIPE_WEBHOOK_SECRET
 * 依赖：需先安装 stripe 包，上线前需配置环境变量
 * 注意：此文件暂不部署，仅存档备用
 */
// import Stripe from 'stripe';

export async function onRequestPost(context) {
  const { request, env } = context;
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  // 参数校验
  if (!signature || !env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // TODO: 启用Stripe后取消注释以下代码
  // try {
  //   const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  //     apiVersion: '2024-06-20',
  //     httpClient: Stripe.createFetchHttpClient()
  //   });
  //
  //   const event = stripe.webhooks.constructEvent(
  //     body,
  //     signature,
  //     env.STRIPE_WEBHOOK_SECRET
  //   );
  //
  //   switch (event.type) {
  //     case 'checkout.session.completed':
  //       // 开通PRO权限、发送通知邮件逻辑
  //       break;
  //     case 'customer.subscription.updated':
  //       // 订阅状态同步逻辑
  //       break;
  //     default:
  //       break;
  //   }
  //
  //   return new Response(JSON.stringify({ received: true }), {
  //     headers: { 'Content-Type': 'application/json' },
  //     status: 200
  //   });
  // } catch (error) {
  //   console.error('[Stripe Webhook] 验证失败:', error.message);
  //   return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  // }

  return new Response('Stripe webhook not configured', { status: 503 });
}
