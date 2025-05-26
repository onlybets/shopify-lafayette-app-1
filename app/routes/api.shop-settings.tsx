import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import db from "../db.server";
import crypto from "crypto";
import { Corner } from "@prisma/client";

// HMAC verification utility
function verifyHmac(request: Request, body: string, secret: string): boolean {
  const signature = request.headers.get("x-shop-settings-hmac");
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return signature === hmac;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  // HMAC auth for GET: signature of "shop=..." query string
  const secret = process.env.SHOP_SETTINGS_HMAC_SECRET;
  if (!secret) {
    return json({ error: "Server misconfigured: missing HMAC secret" }, { status: 500 });
  }
  const rawQuery = `shop=${shop}`;
  if (!verifyHmac(request, rawQuery, secret)) {
    return json({ error: "Invalid HMAC signature" }, { status: 401 });
  }

  const settings = await db.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    return json({ error: "Settings not found" }, { status: 404 });
  }
  return json(settings);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const secret = process.env.SHOP_SETTINGS_HMAC_SECRET;
  if (!secret) {
    return json({ error: "Server misconfigured: missing HMAC secret" }, { status: 500 });
  }
  const body = await request.text();
  if (!verifyHmac(request, body, secret)) {
    return json({ error: "Invalid HMAC signature" }, { status: 401 });
  }
  let data: { shop: string; corner: string; paddingX: number; paddingY: number };
  try {
    data = JSON.parse(body);
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { shop, corner, paddingX, paddingY } = data;
  if (!shop || !corner || typeof paddingX !== "number" || typeof paddingY !== "number") {
    return json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const updated = await db.shopSettings.upsert({
    where: { shop },
    update: { corner: corner as Corner, paddingX, paddingY },
    create: { shop, corner: corner as Corner, paddingX, paddingY },
  });
  return json(updated);
};
