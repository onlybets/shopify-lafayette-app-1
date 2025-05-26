import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import db from "../db.server";

// Middleware to verify billing status for a shop
export async function verifyBilling({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }

  const subscription = await db.subscription.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    // Redirect to Shopify-managed pick-a-plan page
    // Replace with your app's pricing URL or Shopify's billing page
    const pricingUrl = process.env.SHOPIFY_PRICING_URL || "https://admin.shopify.com/store/" + shop + "/apps/pricing";
    throw redirect(pricingUrl);
  }
}
