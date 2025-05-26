import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Shopify Billing API: create a one-time charge for $5
const BILLING_MUTATION = `
mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
  appSubscriptionCreate(
    name: $name
    returnUrl: $returnUrl
    test: $test
    lineItems: $lineItems
  ) {
    confirmationUrl
    userErrors {
      field
      message
    }
    appSubscription {
      id
      status
    }
  }
}
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const authResult = await authenticate.admin(request);
  const admin = authResult.admin;
  // Get shop domain from session
  const shop = authResult.session?.shop || "";

  // The return URL should point to your billing callback endpoint
  const returnUrl = `${process.env.SHOPIFY_APP_URL || "https://your-app-url"}/api/billing/callback?shop=${encodeURIComponent(shop)}`;

  const response = await admin.graphql(BILLING_MUTATION, {
    variables: {
      name: "Sticky Add to Cart Subscription",
      returnUrl,
      test: process.env.NODE_ENV !== "production",
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: 5.0, currencyCode: "USD" },
              interval: "EVERY_30_DAYS"
            }
          }
        }
      ]
    }
  });

  const data = await response.json();
  const confirmationUrl = data?.data?.appSubscriptionCreate?.confirmationUrl;
  if (confirmationUrl) {
    return redirect(confirmationUrl);
  }
  return json({ error: "Failed to create subscription", details: data }, { status: 500 });
};
