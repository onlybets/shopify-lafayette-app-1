import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  TextField,
  RadioButton,
  Checkbox,
  Banner,
  PageActions,
} from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

// Loader to get current settings
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopSettings = await db.shopSettings.findUnique({
    where: { shop: session.shop },
  });
  // Create default settings if none exist
  if (!shopSettings) {
    const defaultSettings = await db.shopSettings.create({
      data: {
        shop: session.shop,
        position: "bottom-right",
        isEnabled: true,
        buttonText: "Add to Cart",
      },
    });
    return json({ settings: defaultSettings, shop: session.shop });
  }
  return json({ settings: shopSettings, shop: session.shop });
};

// Action to save settings
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const position = formData.get("position") as string;
  // Checkbox: value is "on" if checked, null if not present
  const isEnabled = formData.get("isEnabled") === "on";
  const buttonText = formData.get("buttonText") as string;
  const paddingX = parseInt(formData.get("paddingX") as string, 10) || 20;
  const paddingY = parseInt(formData.get("paddingY") as string, 10) || 20;

  try {
    await db.shopSettings.upsert({
      where: { shop: session.shop },
      update: { position, isEnabled, buttonText, paddingX, paddingY },
      create: { shop: session.shop, position, isEnabled, buttonText, paddingX, paddingY },
    });
    return json({ success: true, message: "Settings saved successfully!" });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return json({ success: false, message: "Failed to save settings.", error: String(error) }, { status: 500 });
  }
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const [currentPosition, setCurrentPosition] = useState(settings?.position || "bottom-right");
  const [isEnabled, setIsEnabled] = useState(settings?.isEnabled !== undefined ? settings.isEnabled : true);
  const [buttonText, setButtonText] = useState(settings?.buttonText || "Add to Cart");
  const [paddingX, setPaddingX] = useState(settings?.paddingX ?? 20);
  const [paddingY, setPaddingY] = useState(settings?.paddingY ?? 20);
  const [showBanner, setShowBanner] = useState(true);

  // Update state if loader data changes (e.g., after form submission and revalidation)
  useEffect(() => {
    if (settings) {
      setCurrentPosition(settings.position);
      setIsEnabled(settings.isEnabled);
      setButtonText(settings.buttonText);
      setPaddingX(settings.paddingX ?? 20);
      setPaddingY(settings.paddingY ?? 20);
    }
  }, [settings]);

  useEffect(() => {
    if (actionData?.message) setShowBanner(true);
  }, [actionData]);

  const isLoading = navigation.state === "submitting" || navigation.state === "loading";

  return (
    <Page
      title="Sticky Add to Cart Settings"
      primaryAction={{
        content: "Save settings",
        onAction: () => {
          // Submit the form programmatically
          const form = document.getElementById("settings-form") as HTMLFormElement | null;
          if (form) form.requestSubmit();
        },
        loading: isLoading,
      }}
    >
      <Layout>
        <Layout.Section>
          {actionData?.message && showBanner && (
            <Banner
              title={actionData.success ? "Success" : "Error"}
              tone={actionData.success ? "success" : "critical"}
              onDismiss={() => setShowBanner(false)}
            >
              <p>{actionData.message}</p>
            </Banner>
          )}
          <Card>
            <Form method="post" id="settings-form">
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <label style={{ fontWeight: 500, marginBottom: 4 }}>Position</label>
                  <RadioButton
                    label="Top Left"
                    id="top-left"
                    name="position"
                    value="top-left"
                    checked={currentPosition === "top-left"}
                    onChange={() => setCurrentPosition("top-left")}
                  />
                  <RadioButton
                    label="Top Right"
                    id="top-right"
                    name="position"
                    value="top-right"
                    checked={currentPosition === "top-right"}
                    onChange={() => setCurrentPosition("top-right")}
                  />
                  <RadioButton
                    label="Bottom Left"
                    id="bottom-left"
                    name="position"
                    value="bottom-left"
                    checked={currentPosition === "bottom-left"}
                    onChange={() => setCurrentPosition("bottom-left")}
                  />
                  <RadioButton
                    label="Bottom Right"
                    id="bottom-right"
                    name="position"
                    value="bottom-right"
                    checked={currentPosition === "bottom-right"}
                    onChange={() => setCurrentPosition("bottom-right")}
                  />
                </BlockStack>
                {/* Hidden input to ensure unchecked checkbox submits false */}
                <input type="hidden" name="isEnabled" value="off" />
                <Checkbox
                  label="Enable Sticky Add to Cart Bar"
                  checked={isEnabled}
                  onChange={setIsEnabled}
                  name="isEnabled"
                  value="on"
                />
                <TextField
                  label="Button Text"
                  value={buttonText}
                  onChange={setButtonText}
                  autoComplete="off"
                  name="buttonText"
                />
                <TextField
                  label="Horizontal Padding (px)"
                  type="number"
                  value={String(paddingX)}
                  onChange={(value) => setPaddingX(parseInt(value, 10) || 0)}
                  autoComplete="off"
                  name="paddingX"
                />
                <TextField
                  label="Vertical Padding (px)"
                  type="number"
                  value={String(paddingY)}
                  onChange={(value) => setPaddingY(parseInt(value, 10) || 0)}
                  autoComplete="off"
                  name="paddingY"
                />
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>
        {/* Preview section removed as per requirements */}
      </Layout>
    </Page>
  );
}
