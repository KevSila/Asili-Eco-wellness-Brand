import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle, Minus, Plus } from "lucide-react";

const HONEY_SLUG = "asili-raw-makueni-honey";
const WHATSAPP_NUMBER = "254717578394";

interface Variant {
  id: string;
  sku: string;
  name: string;
  priceMinor: number;
  currency: string;
  availableStock: number | null;
}

interface Product {
  slug: string;
  name: string;
  description: string | null;
  variants: Variant[];
}

interface OrderConfirmation {
  orderReference: string;
  subtotalMinor: number;
  currency: string;
  deliveryStatus: string;
  customer: { name: string };
  items: Array<{ productName: string; variantName: string; quantity: number }>;
}

type SubmitState = "idle" | "submitting" | "success" | "validation" | "stock" | "rate" | "error";

function money(minor: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function createIdempotencyKey() {
  return crypto.randomUUID();
}

export function revealOrderConfirmation(element: HTMLElement, browserWindow: Window = window) {
  browserWindow.history.replaceState(null, "", "#order-confirmation");
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.focus({ preventScroll: true });
}

export function HoneyOrderForm() {
  const [product, setProduct] = useState<Product | null>(null);
  const [catalogueError, setCatalogueError] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const confirmationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (confirmation && confirmationRef.current) revealOrderConfirmation(confirmationRef.current);
  }, [confirmation]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogue unavailable");
        return response.json() as Promise<{ products: Product[] }>;
      })
      .then(({ products }) => {
        const matchedHoney = products.find((item) => item.slug === HONEY_SLUG) ?? null;
        const honey = matchedHoney ? {
          ...matchedHoney,
          variants: [...matchedHoney.variants].sort((left, right) => left.priceMinor - right.priceMinor),
        } : null;
        setProduct(honey);
        setCatalogueError(!honey);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalogueError(true);
      });
    return () => controller.abort();
  }, []);

  const selectedItems = useMemo(() => product?.variants
    .map((variant) => ({ variant, quantity: quantities[variant.id] ?? 0 }))
    .filter((item) => item.quantity > 0) ?? [], [product, quantities]);
  const subtotalMinor = selectedItems.reduce(
    (total, item) => total + item.variant.priceMinor * item.quantity,
    0,
  );

  function changeQuantity(variant: Variant, change: number) {
    setSubmitState("idle");
    setQuantities((current) => {
      const next = Math.max(0, (current[variant.id] ?? 0) + change);
      const capped = variant.availableStock === null ? next : Math.min(next, variant.availableStock);
      return { ...current, [variant.id]: Math.min(capped, 1000) };
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === "submitting") return;
    if (selectedItems.length === 0) {
      setSubmitState("validation");
      return;
    }

    const form = new FormData(event.currentTarget);
    idempotencyKey.current ??= createIdempotencyKey();
    setSubmitState("submitting");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          customer: {
            name: form.get("name"),
            phone: form.get("phone"),
            email: form.get("email"),
          },
          deliveryLocation: form.get("deliveryLocation"),
          customerNote: form.get("customerNote"),
          items: selectedItems.map(({ variant, quantity }) => ({ variantId: variant.id, quantity })),
        }),
      });
      const body = await response.json() as {
        code?: string;
        order?: OrderConfirmation;
      };

      if (response.ok && body.order) {
        setConfirmation(body.order);
        setSubmitState("success");
        return;
      }
      if (body.code === "INSUFFICIENT_STOCK" || body.code === "PRODUCT_UNAVAILABLE") {
        idempotencyKey.current = null;
        setSubmitState("stock");
      } else if (body.code === "RATE_LIMITED") {
        setSubmitState("rate");
      } else if (response.status === 400 || body.code === "IDEMPOTENCY_CONFLICT") {
        idempotencyKey.current = null;
        setSubmitState("validation");
      } else {
        setSubmitState("error");
      }
    } catch {
      setSubmitState("error");
    }
  }

  if (confirmation) {
    const message = `Hi, I’ve placed Asili order ${confirmation.orderReference}. Please help me confirm delivery details and the delivery fee.`;
    return (
      <div id="order-confirmation" ref={confirmationRef} tabIndex={-1} className="scroll-mt-24 rounded-[2rem] border border-asili-gold/25 bg-white p-7 text-asili-green shadow-xl outline-none sm:p-10" role="status" aria-live="polite" aria-label="Order confirmation">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-asili-green text-asili-honey">
          <Check className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-asili-earth">Order received</p>
        <h3 className="mt-2 text-3xl font-bold">{confirmation.orderReference}</h3>
        <p className="mt-3 text-sm">Thank you, <strong>{confirmation.customer.name}</strong>. Your order has been recorded.</p>
        <ul className="mt-5 space-y-2 rounded-2xl bg-asili-cream p-4 text-sm">
          {confirmation.items.map((item, index) => <li key={`${item.variantName}-${index}`} className="flex justify-between gap-4"><span>{item.productName} · {item.variantName}</span><strong>× {item.quantity}</strong></li>)}
        </ul>
        <p className="mt-6 text-sm text-asili-green/60">Product subtotal</p>
        <p className="text-3xl font-black">{money(confirmation.subtotalMinor, confirmation.currency)}</p>
        <p className="mt-6 rounded-2xl bg-asili-honey/15 p-4 text-sm leading-relaxed">
          Delivery is location-based and is not included in this subtotal. We will confirm the delivery fee separately.
        </p>
        <div className="mt-5 text-sm leading-relaxed"><p><strong>Delivery status:</strong> {confirmation.deliveryStatus.replaceAll("_", " ")}</p><p className="mt-2">Next: continue on WhatsApp so we can confirm your delivery details and fee.</p></div>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-asili-green px-6 py-4 text-sm font-black text-white sm:w-auto"
        >
          Continue on WhatsApp <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submitOrder} className="rounded-[2rem] border border-asili-gold/20 bg-white p-6 text-asili-green shadow-xl sm:p-9" noValidate>
      <div className="border-b border-asili-green/10 pb-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-asili-earth">Choose your jars</p>
        {!product && !catalogueError && <p className="mt-4 text-sm text-asili-green/60">Loading current sizes and prices…</p>}
        {catalogueError && <p className="mt-4 text-sm text-red-700" role="alert">Current sizes could not be loaded. Please try again shortly.</p>}
        <div className="mt-5 space-y-3">
          {product?.variants.map((variant) => {
            const quantity = quantities[variant.id] ?? 0;
            const unavailable = variant.availableStock === 0;
            return (
              <div key={variant.sku} className="flex items-center justify-between gap-4 rounded-2xl border border-asili-green/10 p-4">
                <div>
                  <p className="font-bold">{variant.name}</p>
                  <p className="text-sm text-asili-green/65">{money(variant.priceMinor, variant.currency)}</p>
                  <p className="mt-1 text-[11px] text-asili-green/45">
                    {variant.availableStock === null ? "Availability confirmed with your order" : unavailable ? "Currently unavailable" : `${variant.availableStock} available`}
                  </p>
                </div>
                <div className="flex items-center gap-3" aria-label={`${variant.name} quantity`}>
                  <button type="button" onClick={() => changeQuantity(variant, -1)} disabled={quantity === 0} className="flex h-9 w-9 items-center justify-center rounded-full border border-asili-green/20 disabled:opacity-30" aria-label={`Remove one ${variant.name}`}><Minus className="h-4 w-4" /></button>
                  <output className="w-5 text-center font-bold">{quantity}</output>
                  <button type="button" onClick={() => changeQuantity(variant, 1)} disabled={unavailable || (variant.availableStock !== null && quantity >= variant.availableStock)} className="flex h-9 w-9 items-center justify-center rounded-full bg-asili-green text-white disabled:opacity-30" aria-label={`Add one ${variant.name}`}><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between text-lg font-bold">
          <span>Product subtotal</span><span>{money(subtotalMinor)}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-asili-green/55">Delivery is priced separately after we confirm your location.</p>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold">Name<input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-2 w-full rounded-xl border border-asili-green/15 bg-[#fbf8f1] px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
        <label className="text-sm font-bold">Kenyan phone number<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className="mt-2 w-full rounded-xl border border-asili-green/15 bg-[#fbf8f1] px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
        <label className="text-sm font-bold sm:col-span-2">Email <span className="font-normal text-asili-green/45">(optional)</span><input name="email" type="email" maxLength={254} autoComplete="email" className="mt-2 w-full rounded-xl border border-asili-green/15 bg-[#fbf8f1] px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
        <label className="text-sm font-bold sm:col-span-2">Delivery location<textarea name="deliveryLocation" required minLength={2} maxLength={240} rows={2} placeholder="Estate, town or landmark" className="mt-2 w-full resize-none rounded-xl border border-asili-green/15 bg-[#fbf8f1] px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
        <label className="text-sm font-bold sm:col-span-2">Order note <span className="font-normal text-asili-green/45">(optional)</span><textarea name="customerNote" maxLength={1000} rows={3} className="mt-2 w-full resize-none rounded-xl border border-asili-green/15 bg-[#fbf8f1] px-4 py-3 font-normal outline-none focus:border-asili-honey" /></label>
      </div>

      {submitState === "validation" && <p className="mt-5 text-sm text-red-700" role="alert">Please choose at least one jar and check all required details.</p>}
      {submitState === "stock" && <p className="mt-5 text-sm text-red-700" role="alert">That selection is not currently available. Please adjust the quantity or contact us.</p>}
      {submitState === "rate" && <p className="mt-5 text-sm text-red-700" role="alert">Too many order attempts. Please wait a few minutes and try again.</p>}
      {submitState === "error" && <p className="mt-5 text-sm text-red-700" role="alert">We could not confirm the order. Please retry; the same submission will not create a duplicate.</p>}

      <button type="submit" disabled={!product || submitState === "submitting"} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-asili-gold px-7 py-4 text-sm font-black text-asili-black disabled:cursor-not-allowed disabled:opacity-50">
        {submitState === "submitting" ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Placing order…</> : <>Place order <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
      </button>
    </form>
  );
}
