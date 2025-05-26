import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);

  // Parse webhook payload
  const payload = await request.json();
  const subscriptionId = payload.id || payload.app_subscription?.id;
  const status = payload.status || payload.app_subscription?.status;

  if (shop && subscriptionId && status) {
    const existing = await db.subscription.findFirst({ where: { shop } });
    if (existing) {
      await db.subscription.update({
        where: { id: existing.id },
        data: { status }
      });
    }
  }

  return new Response();
};
