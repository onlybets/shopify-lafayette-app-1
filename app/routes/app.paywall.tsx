import { Page, Card, BlockStack, Text, Button } from "@shopify/polaris";

const PRICING_URL = process.env.SHOPIFY_PRICING_URL || "https://admin.shopify.com/store/[shop]/apps/pricing";

export default function PaywallPage() {
  return (
    <Page>
      <BlockStack gap="500" align="center">
        <Card>
          <BlockStack gap="400" align="center">
            <Text as="h2" variant="headingMd">
              Subscription Required
            </Text>
            <Text as="p" variant="bodyMd">
              To use the Sticky Add to Cart app, please choose a plan.
            </Text>
            <Button
              url={PRICING_URL}
              target="_blank"
              variant="primary"
            >
              Choose plan
            </Button>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
