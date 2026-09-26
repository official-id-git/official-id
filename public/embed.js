/*!
 * official.id embed loader
 * Pemakaian:
 *   <div class="official-id-tree" data-slug="kailoka"></div>
 *   <script src="https://official.id/embed.js" async></script>
 *
 * Opsi data-*: data-bg="solid" | data-max-width="420px" | data-height="560" | data-title="..."
 */
(function () {
  var script = document.currentScript;
  var ORIGIN = script ? new URL(script.src).origin : (typeof window !== "undefined" ? window.location.origin : "https://official.id");

  function mount(el) {
    if (el.getAttribute("data-oid-mounted")) return;
    var slug = el.getAttribute("data-slug");
    if (!slug) return;
    el.setAttribute("data-oid-mounted", "1");

    var params = new URLSearchParams();
    if (el.getAttribute("data-bg") === "solid") params.set("bg", "solid");

    var iframe = document.createElement("iframe");
    iframe.src = ORIGIN + "/embed/" + encodeURIComponent(slug.toLowerCase()) + (params.toString() ? "?" + params : "");
    iframe.title = el.getAttribute("data-title") || "QR " + slug;
    iframe.loading = "lazy";
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("allow", "web-share; clipboard-write");
    iframe.style.cssText =
      "display:block;width:100%;border:0;margin:0 auto;background:transparent;color-scheme:normal;" +
      "max-width:" + (el.getAttribute("data-max-width") || "480px") + ";" +
      "height:" + (el.getAttribute("data-height") || "620") + "px;";
    el.appendChild(iframe);
  }

  // Tinggi iframe mengikuti konten (dikirim oleh halaman embed)
  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || !e.data || e.data.type !== "official-id:resize") return;
    var frames = document.querySelectorAll("iframe");
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) {
        frames[i].style.height = Math.max(200, Number(e.data.height) || 0) + "px";
      }
    }
  });

  function scan() {
    var nodes = document.querySelectorAll(".official-id-tree[data-slug]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();

  // Dukung SPA / page builder yang menyisipkan elemen belakangan
  if ("MutationObserver" in window) {
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
