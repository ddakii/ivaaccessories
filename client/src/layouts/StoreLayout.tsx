import { FormEvent, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useSettings } from "../lib/hooks";
import { useCart } from "../lib/cart";
import { mediaUrl } from "../lib/utils";
import { api } from "../lib/api";
import { toast } from "sonner";
import { sq } from "../lib/i18n";

const NAV = [
  { to: "/", label: sq.nav.home },
  { to: "/shop", label: sq.nav.shop },
  { to: "/shop/bags", label: sq.nav.bags },
  { to: "/shop/sunglasses", label: sq.nav.sunglasses },
  { to: "/shop/wallets", label: sq.nav.wallets },
  { to: "/shop/jewelry", label: sq.nav.jewelry },
  { to: "/shop/women", label: sq.nav.women },
  { to: "/shop/men", label: sq.nav.men },
  { to: "/about", label: sq.nav.about },
  { to: "/contact", label: sq.nav.contact },
];

function NavItems({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/" || item.to === "/shop"}
          onClick={onClick}
          className={({ isActive }) =>
            `${className ?? ""} ${isActive ? "text-gold" : "text-ink"}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function StoreLayout() {
  const { data: settings } = useSettings();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const logo = settings?.storeLogo ? mediaUrl(settings.storeLogo) : null;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-ink">
      <div className="sticky top-0 z-40 bg-white">
        {settings?.announcementBarEnabled && settings.announcementBarText ? (
          <div className="no-scrollbar overflow-x-auto bg-ink px-4 py-2 text-center text-[11px] tracking-wide text-white whitespace-nowrap">
            {settings.announcementBarText}
          </div>
        ) : null}

        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label={sq.openMenu}>
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-3">
              {logo ? <img src={logo} alt="" className="h-8 w-auto" /> : null}
              <span className="text-center">
                <span className="block text-xl font-medium uppercase tracking-[0.18em] leading-none">IVA</span>
                <span className="block text-[10px] uppercase tracking-brand text-gold">Accessories</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-5 text-[12px] uppercase tracking-[0.18em] xl:flex">
              <NavItems className="luxury-underline pb-1" />
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => setSearchOpen((v) => !v)} aria-label={sq.search}>
                <Search size={18} />
              </button>
              <Link to="/cart" className="relative" aria-label={sq.shoppingBag}>
                <ShoppingBag size={18} />
                {count > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[10px] text-white">
                    {count}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
          {searchOpen ? (
            <form onSubmit={onSearch} className="border-t border-line px-4 py-3 md:px-8">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={sq.search}
                className="w-full border-b border-ink bg-transparent py-2 text-base outline-none"
              />
            </form>
          ) : null}
        </header>

        <nav
          className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line px-4 py-3 text-[11px] uppercase tracking-brand xl:hidden"
          aria-label="Kategoritë"
        >
          <NavItems className="shrink-0 whitespace-nowrap" />
        </nav>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-xl font-medium uppercase tracking-[0.18em]">IVA</span>
            <button onClick={() => setOpen(false)} aria-label={sq.closeMenu}>
              <X />
            </button>
          </div>
          <nav className="flex flex-col gap-4 px-6 py-8 text-lg uppercase tracking-brand">
            <NavItems onClick={() => setOpen(false)} />
          </nav>
        </div>
      ) : null}

      <main>
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  );
}

function StoreFooter() {
  const { data: settings } = useSettings();
  const [email, setEmail] = useState("");
  const year = useMemo(() => new Date().getFullYear(), []);

  async function subscribe(event: FormEvent) {
    event.preventDefault();
    try {
      await api.post("/api/newsletter", { email });
      toast.success(sq.newsletterOk);
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : sq.newsletterFail);
    }
  }

  return (
    <footer className="mt-12 border-t border-line bg-ivory md:mt-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:gap-12 md:px-8 md:py-16">
        <div>
          <p className="text-xl font-medium uppercase tracking-[0.18em]">IVA</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {settings?.footerText}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-brand text-gold">{sq.footer.shop}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/shop/bags">{sq.nav.bags}</Link>
            <Link to="/shop/sunglasses">{sq.nav.sunglasses}</Link>
            <Link to="/shop/wallets">{sq.nav.wallets}</Link>
            <Link to="/shop/jewelry">{sq.nav.jewelry}</Link>
            <Link to="/shop">{sq.footer.all}</Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-brand text-gold">{sq.footer.info}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/about">{sq.nav.about}</Link>
            <Link to="/contact">{sq.nav.contact}</Link>
            <Link to="/track-order">{sq.footer.track}</Link>
            <Link to="/returns">{sq.footer.returns}</Link>
            <Link to="/privacy">{sq.footer.privacy}</Link>
            <Link to="/terms">{sq.footer.terms}</Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-brand text-gold">{sq.footer.newsletter}</p>
          <p className="mt-4 text-sm text-muted">{sq.footer.newsletterText}</p>
          <form onSubmit={subscribe} className="mt-4 flex border-b border-ink">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={sq.footer.email}
              className="w-full bg-transparent py-2 text-base outline-none"
            />
            <button className="shrink-0 text-[11px] uppercase tracking-brand">{sq.footer.join}</button>
          </form>
        </div>
      </div>
      <div className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        © {year} IVA Accessories. {sq.footer.cod}
      </div>
    </footer>
  );
}
