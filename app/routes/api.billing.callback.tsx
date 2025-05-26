import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// Query subscription status by charge_id
const SUBSCRIPTION_QUERY = `
  query appSubscription($id: ID!) {
    appSubscription(id: $id) {
      id
      status
      name
      createdAt
      currentPeriodEnd
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const chargeId = url.searchParams.get("charge_id") || url.searchParams.get("id");
  if (!shop || !chargeId) {
    return json({ error: "Missing shop or charge_id" }, { status: 400 });
  }

  const { admin } = await authenticate.admin(request);

  // Query subscription status from Shopify
  const response = await admin.graphql(SUBSCRIPTION_QUERY, {
    variables: { id: chargeId }
  });
  const data = await response.json();
  const subscription = data?.data?.appSubscription;
  if (!subscription) {
    return json({ error: "Subscription not found" }, { status: 404 });
  }

  // Upsert Subscription in DB by shop (find existing, then upsert by id)
  const existing = await db.subscription.findFirst({ where: { shop } });
  if (existing) {
    await db.subscription.update({
      where: { id: existing.id },
      data: {
        status: subscription.status,
        chargeId: chargeId,
      }
    });
  } else {
    await db.subscription.create({
      data: {
        shop,
        status: subscription.status,
        chargeId: chargeId,
      }
    });
  }

  // Redirect to app home or paywall
  return redirect(`/app?shop=${encodeURIComponent(shop)}`);
};
