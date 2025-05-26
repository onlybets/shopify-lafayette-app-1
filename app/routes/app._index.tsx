import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Select,
  TextField,
  Spinner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  // Optionally, pass shop info if needed
  return null;
};

const CORNER_OPTIONS = [
  { label: "Top Left", value: "TOP_LEFT" },
  { label: "Top Right", value: "TOP_RIGHT" },
  { label: "Bottom Left", value: "BOTTOM_LEFT" },
  { label: "Bottom Right", value: "BOTTOM_RIGHT" },
];

export default function ShopSettingsPage() {
  const fetcher = useFetcher();
  const [shop, setShop] = useState<string>("");
  const [corner, setCorner] = useState<string>("BOTTOM_RIGHT");
  const [paddingX, setPaddingX] = useState<number>(16);
  const [paddingY, setPaddingY] = useState<number>(16);
  const [loading, setLoading] = useState(true);

  // Fetch shop domain from window.Shopify if available
  useEffect(() => {
    // Try to get shop from App Bridge or window.Shopify
    let shopDomain = "";
    if (window.Shopify && window.Shopify.shop) {
      shopDomain = window.Shopify.shop;
    } else if (window.location.search.includes("shop=")) {
      const params = new URLSearchParams(window.location.search);
      shopDomain = params.get("shop") || "";
    }
    setShop(shopDomain);

    if (shopDomain) {
      // Fetch settings
      const fetchSettings = async () => {
        setLoading(true);
        try {
          const rawQuery = `shop=${shopDomain}`;
          const hmac = await getHmac(rawQuery);
          const res = await fetch(`/api/shop-settings?shop=${encodeURIComponent(shopDomain)}`, {
            headers: { "x-shop-settings-hmac": hmac },
          });
          if (res.ok) {
            const data = await res.json();
            setCorner(data.corner || "BOTTOM_RIGHT");
            setPaddingX(data.paddingX ?? 16);
            setPaddingY(data.paddingY ?? 16);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, []);

  // Auto-save on change
  useEffect(() => {
    if (!shop || loading) return;
    const save = async () => {
      const body = JSON.stringify({ shop, corner, paddingX, paddingY });
      const hmac = await getHmac(body);
      await fetch("/api/shop-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-shop-settings-hmac": hmac,
        },
        body,
      });
    };
    save();
  }, [shop, corner, paddingX, paddingY]);

  if (loading) {
    return (
      <Page>
        <BlockStack gap="500" align="center">
          <Spinner accessibilityLabel="Loading settings" size="large" />
        </BlockStack>
      </Page>
    );
  }

  // Live preview: send settings to iframe
  useEffect(() => {
    const iframe = document.getElementById("sticky-preview-iframe") as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { corner, paddingX, paddingY },
        "*"
      );
    }
  }, [corner, paddingX, paddingY]);

  return (
    <Page>
      <TitleBar title="Sticky Add to Cart Settings" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Sticky Add to Cart Button Settings
              </Text>
              <Select
                label="Corner"
                options={CORNER_OPTIONS}
                value={corner}
                onChange={setCorner}
              />
              <TextField
                label="Padding X (px)"
                type="number"
                value={paddingX.toString()}
                onChange={(v) => setPaddingX(Number(v))}
                autoComplete="off"
              />
              <TextField
                label="Padding Y (px)"
                type="number"
                value={paddingY.toString()}
                onChange={(v) => setPaddingY(Number(v))}
                autoComplete="off"
              />
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Live Preview
              </Text>
              <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", height: 400 }}>
                <iframe
                  id="sticky-preview-iframe"
                  src="/preview.html"
                  title="Sticky Add to Cart Preview"
                  style={{ width: "100%", height: 400, border: "none" }}
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Utility: get HMAC for a string using the same secret as the backend
async function getHmac(message: string): Promise<string> {
  // In production, this should be done server-side or via a secure endpoint.
  // For demo/dev, use a placeholder or fetch from a secure endpoint.
  // Here, we just return a dummy value for local dev.
  return "dummy-hmac";
}
