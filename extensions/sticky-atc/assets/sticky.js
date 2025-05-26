// Sticky Add to Cart extension script

(function () {
  // Utility: get shop domain from window.Shopify or URL
  function getShopDomain() {
    if (window.Shopify && window.Shopify.shop) {
      return window.Shopify.shop;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("shop");
  }

  // Utility: get productId from product page (works for most OS 2.0 themes)
  function getProductId() {
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

  // Set button position based on settings.position
  function setButtonPosition(btn, position) {
    btn.style.top = btn.style.right = btn.style.bottom = btn.style.left = "auto";
    switch (position) {
      case "bottom-left":
        btn.style.bottom = "20px";
        btn.style.left = "20px";
        break;
      case "bottom-right":
      default:
        btn.style.bottom = "20px";
        btn.style.right = "20px";
        break;
    }
  }

  // Create sticky button
  function createStickyButton(settings) {
    let btn = document.getElementById("lafayette-sticky-atc");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "lafayette-sticky-atc";
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
      document.body.appendChild(btn);
    }
    btn.innerText = settings.buttonText || "Add to Cart";
    setButtonPosition(btn, settings.position);

    btn.onclick = async function () {
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
          setTimeout(() => (btn.innerText = settings.buttonText || "Add to Cart"), 1500);
        } else {
          btn.innerText = "Error";
        }
      } catch {
        btn.innerText = "Error";
      }
      btn.disabled = false;
    };
    return btn;
  }

  // Hide/show sticky button based on native ATC visibility
  function updateStickyVisibility(settings) {
    const btn = document.getElementById("lafayette-sticky-atc");
    if (!btn) return;
    btn.style.display = isNativeATCVisible() ? "none" : "block";
    setButtonPosition(btn, settings.position);
  }

  // IntersectionObserver fallback: poll every 500ms
  function startVisibilityPolling(settings) {
    setInterval(() => updateStickyVisibility(settings), 500);
  }

  // Main logic: fetch settings and render sticky button if enabled
  async function main() {
    const shop = getShopDomain();
    if (!shop) return;

    try {
      const res = await fetch(`/api/storefront-settings?shop=${encodeURIComponent(shop)}`);
      if (!res.ok) return;
      const { data: settings } = await res.json();
      if (!settings || !settings.isEnabled) {
        // Remove sticky button if present
        const btn = document.getElementById("lafayette-sticky-atc");
        if (btn) btn.remove();
        return;
      }

      createStickyButton(settings);
      updateStickyVisibility(settings);

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
            setButtonPosition(btn, settings.position);
          },
          { threshold: 0.01 }
        );
        observer.observe(nativeBtn);
      } else {
        startVisibilityPolling(settings);
      }
    } catch (e) {
      // Fail silently
    }
  }

  // Listen for settings updates (for live preview or dynamic updates)
  window.addEventListener("message", (event) => {
    if (!event.data || typeof event.data !== "object") return;
    const { position, isEnabled, buttonText } = event.data;
    const btn = document.getElementById("lafayette-sticky-atc");
    if (btn) {
      if (typeof isEnabled === "boolean" && !isEnabled) {
        btn.remove();
      } else {
        if (position) setButtonPosition(btn, position);
        if (buttonText) btn.innerText = buttonText;
      }
    }
  });

  // Wait for DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
