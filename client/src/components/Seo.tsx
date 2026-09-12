import { useEffect } from "react";

export function Seo({
  title,
  description,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
  path?: string;
}) {
  const full = title.includes("IVA") ? title : `${title} | IVA Accessories`;
  const desc =
    description ??
    "IVA Accessories — koleksion i përzgjedhur i çantave, syzeve dhe portofolave. Pagesë në dorëzim.";

  useEffect(() => {
    document.title = full;
    const ensure = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (selector.includes("property")) el.setAttribute("property", selector.match(/property="([^"]+)"/)![1]);
        if (selector.includes("name=")) el.setAttribute("name", selector.match(/name="([^"]+)"/)![1]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    ensure('meta[name="description"]', "content", desc);
    ensure('meta[property="og:title"]', "content", full);
    ensure('meta[property="og:description"]', "content", desc);
    if (image) ensure('meta[property="og:image"]', "content", image);
  }, [full, desc, image]);

  return null;
}
