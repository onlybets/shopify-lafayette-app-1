// Sticky Add to Cart extension script

(function () {
  // Read settings from window.__SHOP_SETTINGS__
  const settings = window.__SHOP_SETTINGS__ || {
    corner: "BOTTOM_RIGHT",
    paddingX: 16,
    paddingY: 16,
  };

  // License check: call /api/license?shop=...
  async function checkLicense() {
    const shop = settings.shop || (window.Shopify && window.Shopify.shop);
    if (!shop) return false;
    try {
      const res = await fetch(`/api/license?shop=${encodeURIComponent(shop)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return !!data.active;
    } catch {
      return false;
    }
  }

  // Utility: get productId from product page (works for most OS 2.0 themes)
  function getProductId() {
    // Try to find product form input[name="id"]
    const input = document.querySelector('form[action^="/cart/add"] input[name="id"]');
    return input ? input.value : null;
  }

  // Utility: check if native ATC button is visible
  function isNativeATCVisible() {
    const btn = document.querySelector('form[action^="/cart/add"] [type="submit"], form[action^="/cart/add"] button');
    if (!btn) return false;
    const rect = btn.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Create sticky button
  function createStickyButton() {
    if (document.getElementById("lafayette-sticky-atc")) return;
    const btn = document.createElement("button");
    btn.id = "lafayette-sticky-atc";
    btn.innerText = "Add to Cart";
    btn.style.position = "fixed";
    btn.style.zIndex = "9999";
    btn.style.background = "#111";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.padding = "12px 32px";
    btn.style.fontSize = "18px";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
    btn.style.transition = "all 0.3s";
    setButtonPosition(btn, settings.corner, settings.paddingX, settings.paddingY);

    btn.addEventListener("click", async function () {
      const productId = getProductId();
      if (!productId) {
        alert("No product found.");
        return;
      }
      btn.disabled = true;
      btn.innerText = "Adding...";
      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${encodeURIComponent(productId)}&quantity=1`,
        });
        if (res.ok) {
          btn.innerText = "Added!";
          setTimeout(() => (btn.innerText = "Add to Cart"), 1500);
        } else {
          btn.innerText = "Error";
        }
      } catch {
        btn.innerText = "Error";
      }
      btn.disabled = false;
    });

    document.body.appendChild(btn);
  }

  // Set button position based on settings
  function setButtonPosition(btn, corner, paddingX, paddingY) {
    btn.style.top = btn.style.right = btn.style.bottom = btn.style.left = "auto";
    switch (corner) {
      case "TOP_LEFT":
        btn.style.top = paddingY + "px";
        btn.style.left = paddingX + "px";
        break;
      case "TOP_RIGHT":
        btn.style.top = paddingY + "px";
        btn.style.right = paddingX + "px";
        break;
      case "BOTTOM_LEFT":
        btn.style.bottom = paddingY + "px";
        btn.style.left = paddingX + "px";
        break;
      case "BOTTOM_RIGHT":
      default:
        btn.style.bottom = paddingY + "px";
        btn.style.right = paddingX + "px";
        break;
    }
  }

  // Hide/show sticky button based on native ATC visibility
  function updateStickyVisibility() {
    const btn = document.getElementById("lafayette-sticky-atc");
    if (!btn) return;
    btn.style.display = isNativeATCVisible() ? "none" : "block";
  }

  // IntersectionObserver fallback: poll every 500ms
  function startVisibilityPolling() {
    setInterval(updateStickyVisibility, 500);
  }

  // Main logic
  async function main() {
    // License check
    const licensed = await checkLicense();
    if (!licensed) {
      // Optionally show a paywall or do nothing
      return;
    }

    createStickyButton();
    updateStickyVisibility();

    // Try IntersectionObserver if available
    const nativeBtn = document.querySelector('form[action^="/cart/add"] [type="submit"], form[action^="/cart/add"] button');
    if (window.IntersectionObserver && nativeBtn) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.length) return;
          const entry = entries[0];
          const btn = document.getElementById("lafayette-sticky-atc");
          if (!btn) return;
          btn.style.display = entry.isIntersecting ? "none" : "block";
        },
        { threshold: 0.01 }
      );
      observer.observe(nativeBtn);
    } else {
      startVisibilityPolling();
    }
  }

  // Listen for settings updates (for live preview or dynamic updates)
  window.addEventListener("message", (event) => {
    if (!event.data || typeof event.data !== "object") return;
    const { corner, paddingX, paddingY } = event.data;
    const btn = document.getElementById("lafayette-sticky-atc");
    if (btn) setButtonPosition(btn, corner, paddingX, paddingY);
  });

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
