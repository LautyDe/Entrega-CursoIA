"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { recipeCatalog } from "../lib/agents/catalog";
import { argentinaCardTypes, benefitSourceForProvider, canonicalPaymentProvider, compatiblePromotions, paymentKey, paymentMethodsForPromotion, promotionMatchesStore, validatePaymentProvider, verifiedPromotions } from "../lib/argentina-payments";
import { findNearbySupermarkets, type Coordinates, type NearbyStore } from "../lib/nearby-stores";
import { migrateLegacyPayment, promotionSaving, selectBestPromotion, type CardType, type PaymentMethod } from "../lib/payments";
import { MEALBOARD_STORAGE_KEY, parseStoredState, serializeStoredState } from "../lib/persistence";
import { extractPublicBenefitReferences, publicBenefitMatchesStore } from "../lib/public-benefit-extraction";
import { StoreMap, type StoreDeal } from "./store-map";
import { PaymentProviderCombobox } from "./payment-provider-combobox";

type MealSlot = "breakfast" | "lunch" | "snack" | "dinner";
type Meal = {
  id: string; day: string; shortDay: string; date: number;
  breakfast: string; breakfastMeta: string;
  lunch: string; lunchMeta: string;
  snack: string; snackMeta: string;
  dinner: string; dinnerMeta: string;
};
type Ingredient = {
  id: number; name: string; amount: string; expiry: string; price: number;
  purchaseDate: string; expiryDate: string;
};
type ShoppingItem = { id: number; name: string; amount: string; price: number; checked: boolean };
type Profile = {
  name: string; budget: number; level: string; dislikes: string;
  likes: string;
  allergies: string; appliances: string; paymentBank: string; paymentCardType: CardType;
  paymentMethods: PaymentMethod[]; nutrition: boolean;
  city: string; planningDay: string; plannedMeals: MealSlot[];
};
type CommunityComment = { id: number; author: string; text: string };
type CommunityCalendar = {
  id: string; creator: string; title: string; rating: number; ratings: number;
  saves: number; tag: string; accent: string; description: string;
  favorite: boolean; followed: boolean; comments: CommunityComment[];
  reported?: boolean; own?: boolean; moderation?: string;
};
type MemoryRecord = { id: number; text: string; kind: string; createdAt: string };
type PurchaseRecord = {
  id: number; date: string; spent: number; saved: number; store: string; discount: string;
};
type WeeklyReview = {
  id: number; date: string; prepared: number; liked: string; easy: string;
  spent: number; discountUsed: boolean; reason: string;
};
type AppState = {
  week: Meal[]; inventory: Ingredient[]; shopping: ShoppingItem[];
  profile: Profile; savings: number; feedback: string[];
  recipeGuides: Record<string, string[]>; community: CommunityCalendar[];
  memory: MemoryRecord[]; purchases: PurchaseRecord[]; reviews: WeeklyReview[];
};
type AgentRun = {
  id: string; name: string; role: string; status: "completed";
  observation: string; decision: string; output: string;
};
type AgentDefinition = { id: string; name: string; role: string };
type PublicBenefitDiscovery = {
  provider: string; sourceUrl?: string; sourceLabel?: string;
  status: "available" | "unavailable" | "unsupported";
  checkedAt: string; publicBenefits: string[]; message: string;
  pagesChecked?: number; usefulPages?: string[];
};
type StoreBenefitDiscovery = {
  store: string; sourceUrl: string; sourceLabel: string;
  status: "available" | "unavailable"; checkedAt: string; message: string;
  pagesChecked?: number; usefulPages?: string[];
  references: Array<ReturnType<typeof extractPublicBenefitReferences>[number] & { provider: string; sourceUrl: string; sourceLabel: string }>;
};
type PlanResponse = {
  mode: string; summary: string; agentTrace: string[];
  week: Meal[]; shopping: Omit<ShoppingItem, "id">[];
  agentRun: AgentRun[]; recipeGuides: Record<string, string[]>;
  estimatedCost: number; estimatedSaving: number;
  communitySource: string; warnings: string[];
  promotionDiscoveries: PublicBenefitDiscovery[];
};
type ModalName =
  | "plan" | "recipe" | "feedback" | "notice" | "agents" | "community"
  | "publish" | "scan" | "inventory-edit" | "meal-edit" | "missed" | "memory-edit";

const slotDefinitions: Array<{ id: MealSlot; label: string; icon: string }> = [
  { id: "breakfast", label: "Desayuno", icon: "☼" },
  { id: "lunch", label: "Almuerzo", icon: "◒" },
  { id: "snack", label: "Merienda", icon: "◌" },
  { id: "dinner", label: "Cena", icon: "☾" },
];

const initialWeek: Meal[] = [
  { id: "lun", day: "Lunes", shortDay: "Lun", date: 27, breakfast: "Avena con banana", breakfastMeta: "8 min · Fácil", lunch: "Ensalada de lentejas", lunchMeta: "20 min · Fácil", snack: "Yogur con granola", snackMeta: "5 min · Fácil", dinner: "Sopa de verduras", dinnerMeta: "30 min · Fácil" },
  { id: "mar", day: "Martes", shortDay: "Mar", date: 28, breakfast: "Tostadas con queso y fruta", breakfastMeta: "7 min · Fácil", lunch: "Pasta al pomodoro", lunchMeta: "25 min · Fácil", snack: "Licuado de banana y avena", snackMeta: "6 min · Fácil", dinner: "Tortilla de papas", dinnerMeta: "35 min · Fácil" },
  { id: "mie", day: "Miércoles", shortDay: "Mié", date: 29, breakfast: "Huevos revueltos con tostadas", breakfastMeta: "12 min · Fácil", lunch: "Bowl de quinoa", lunchMeta: "30 min · Media", snack: "Yogur con granola", snackMeta: "5 min · Fácil", dinner: "Salteado de verduras", dinnerMeta: "25 min · Fácil" },
  { id: "jue", day: "Jueves", shortDay: "Jue", date: 30, breakfast: "Avena con banana", breakfastMeta: "8 min · Fácil", lunch: "Wrap de pollo", lunchMeta: "20 min · Fácil", snack: "Tostadas con queso y fruta", snackMeta: "7 min · Fácil", dinner: "Arroz con pollo", dinnerMeta: "35 min · Fácil" },
  { id: "vie", day: "Viernes", shortDay: "Vie", date: 31, breakfast: "Yogur con granola", breakfastMeta: "5 min · Fácil", lunch: "Guiso de lentejas", lunchMeta: "45 min · Media", snack: "Licuado de banana y avena", snackMeta: "6 min · Fácil", dinner: "Pescado al horno", dinnerMeta: "35 min · Media" },
  { id: "sab", day: "Sábado", shortDay: "Sáb", date: 1, breakfast: "Huevos revueltos con tostadas", breakfastMeta: "12 min · Fácil", lunch: "Sándwich completo", lunchMeta: "15 min · Fácil", snack: "Yogur con granola", snackMeta: "5 min · Fácil", dinner: "Crema de zapallo", dinnerMeta: "30 min · Fácil" },
  { id: "dom", day: "Domingo", shortDay: "Dom", date: 2, breakfast: "Tostadas con queso y fruta", breakfastMeta: "7 min · Fácil", lunch: "Ensalada mixta", lunchMeta: "15 min · Fácil", snack: "Avena con banana", snackMeta: "8 min · Fácil", dinner: "Fideos con verduras", dinnerMeta: "25 min · Fácil" },
];

const initialInventory: Ingredient[] = [
  { id: 1, name: "Huevos", amount: "6 unidades", expiry: "10 días", price: 2900, purchaseDate: "2026-07-24", expiryDate: "2026-08-07" },
  { id: 2, name: "Tomates", amount: "4 unidades", expiry: "5 días", price: 2100, purchaseDate: "2026-07-25", expiryDate: "2026-08-02" },
  { id: 3, name: "Cebolla", amount: "3 unidades", expiry: "14 días", price: 1200, purchaseDate: "2026-07-24", expiryDate: "2026-08-11" },
  { id: 4, name: "Espinaca", amount: "1 atado", expiry: "2 días", price: 1500, purchaseDate: "2026-07-27", expiryDate: "2026-07-30" },
  { id: 5, name: "Arroz", amount: "700 g", expiry: "8 meses", price: 2600, purchaseDate: "2026-07-12", expiryDate: "2027-03-12" },
  { id: 6, name: "Leche", amount: "1 litro", expiry: "1 día", price: 1800, purchaseDate: "2026-07-26", expiryDate: "2026-07-29" },
];

const initialShopping: ShoppingItem[] = [
  { id: 101, name: "Lentejas", amount: "500 g", price: 1900, checked: false },
  { id: 102, name: "Pechuga de pollo", amount: "700 g", price: 5600, checked: false },
  { id: 103, name: "Pescado", amount: "500 g", price: 6200, checked: false },
  { id: 104, name: "Zapallo", amount: "1 kg", price: 2100, checked: false },
  { id: 105, name: "Pasta seca", amount: "1 paquete", price: 1700, checked: false },
];

const defaultProfile: Profile = {
  name: "Lucía Díaz", budget: 35000, level: "Principiante", dislikes: "Aceitunas",
  likes: "Lentejas, pasta y verduras",
  allergies: "Ninguna", appliances: "Horno, anafe, microondas y licuadora",
  paymentBank: "Banco Nación", paymentCardType: "Crédito",
  paymentMethods: [{ bank: "Banco Nación", cardType: "Crédito" }], nutrition: true, city: "Ciudad de Buenos Aires",
  planningDay: "Domingo", plannedMeals: ["lunch", "dinner"],
};

const initialCommunity: CommunityCalendar[] = [
  { id: "sofi", creator: "Cocina con Sofi", title: "Semana rica por menos", rating: 4.9, ratings: 384, saves: 2400, tag: "Económico", accent: "tomato", description: "Siete días de platos rendidores, simples y con ingredientes fáciles de conseguir.", favorite: false, followed: false, comments: [{ id: 1, author: "Mica", text: "Gasté menos y no pedí delivery." }, { id: 2, author: "Juan", text: "Muy fácil de adaptar." }] },
  { id: "fede", creator: "Fede en 20'", title: "Todo listo en 20 minutos", rating: 4.8, ratings: 271, saves: 1800, tag: "Rápido", accent: "green", description: "Comidas cortas para semanas con poco tiempo y pocas ganas de lavar.", favorite: true, followed: true, comments: [{ id: 3, author: "Vale", text: "Ideal para volver tarde del trabajo." }] },
  { id: "una-olla", creator: "Una olla", title: "Una sola olla, cero estrés", rating: 4.7, ratings: 196, saves: 980, tag: "Principiante", accent: "gold", description: "Recetas guiadas, sin técnicas difíciles y usando un solo recipiente.", favorite: false, followed: false, comments: [{ id: 4, author: "Lucas", text: "Aprendí a cocinar con este calendario." }] },
];

const promotions = verifiedPromotions.flatMap((promotion) => promotion.banks.flatMap((bank) =>
  promotion.cardTypes.map((cardType) => ({
    day: promotion.day,
    store: promotion.storeBrands.join(", ") || "Supermercados adheridos",
    bank,
    cardType,
    discount: promotion.discount,
    cap: promotion.cap,
    sourceUrl: promotion.sourceUrl,
    verifiedAt: promotion.verifiedAt,
    validThrough: promotion.validThrough,
    method: promotion.method,
    notes: promotion.notes,
  })),
));

const initialState: AppState = {
  week: initialWeek,
  inventory: initialInventory,
  shopping: initialShopping,
  profile: defaultProfile,
  savings: 6250,
  feedback: [],
  recipeGuides: {},
  community: initialCommunity,
  memory: [
    { id: 301, text: "Preferís recetas de menos de 35 minutos.", kind: "Preferencia", createdAt: "24 jul" },
    { id: 302, text: "Los platos con lentejas suelen gustarte.", kind: "Gusto", createdAt: "19 jul" },
  ],
  purchases: [
    { id: 401, date: "17 jul", spent: 28700, saved: 5740, store: "Carrefour", discount: "20%" },
    { id: 402, date: "24 jul", spent: 24100, saved: 3615, store: "Coto", discount: "15%" },
  ],
  reviews: [
    { id: 501, date: "20 jul", prepared: 11, liked: "Ensalada de lentejas", easy: "Sí", spent: 28700, discountUsed: true, reason: "Dos días me faltó tiempo" },
  ],
};

const navItems = [
  { id: "calendar", label: "Calendario", icon: "▦" },
  { id: "explore", label: "Explorar", icon: "⌕" },
  { id: "inventory", label: "Inventario", icon: "▤" },
  { id: "shopping", label: "Compras", icon: "⌑" },
  { id: "savings", label: "Ahorro", icon: "⌁" },
  { id: "profile", label: "Perfil", icon: "○" },
];

function money(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value || 0);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function expiryUrgent(item: Ingredient) {
  if (item.expiry.toLowerCase().includes("vencid")) return true;
  const days = Number.parseInt(item.expiry);
  return Number.isFinite(days) && days <= 2 && !item.expiry.toLowerCase().includes("mes");
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "MB";
}

function MealCard({ slot, value, meta, onOpen }: {
  slot: { id: MealSlot; label: string; icon: string }; value: string; meta: string; onOpen: () => void;
}) {
  return (
    <button className="meal-card" type="button" onClick={onOpen} aria-label={`${slot.label}: ${value}`}>
      <span className="meal-label">{slot.label}</span>
      <span className="meal-icon" aria-hidden="true">{slot.icon}</span>
      <strong>{value || "Espacio libre"}</strong>
      <small>{meta || "Tocá para completar"}</small>
    </button>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedDay, setSelectedDay] = useState("lun");
  const [modal, setModal] = useState<ModalName | null>(null);
  const [planning, setPlanning] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanResponse | null>(null);
  const [agentRegistry, setAgentRegistry] = useState<AgentDefinition[]>([]);
  const [toast, setToast] = useState("");
  const [communityFilter, setCommunityFilter] = useState("Para vos");
  const [selectedCommunityId, setSelectedCommunityId] = useState("sofi");
  const [communityComment, setCommunityComment] = useState("");
  const [publishTitle, setPublishTitle] = useState("Mi semana organizada");
  const [pendingRepublish, setPendingRepublish] = useState(false);
  const [selectedMealContext, setSelectedMealContext] = useState<{ dayId: string; slot: MealSlot }>({ dayId: "lun", slot: "lunch" });
  const [mealReplacement, setMealReplacement] = useState("");
  const [missedDraft, setMissedDraft] = useState({ reason: "Me faltó tiempo", targetDay: "mar", reschedule: true });
  const [newIngredient, setNewIngredient] = useState({ name: "", amount: "", purchaseDate: todayIso(), expiry: "", expiryDate: "", price: "" });
  const [inventoryDraft, setInventoryDraft] = useState<Ingredient | null>(null);
  const [scanCandidates, setScanCandidates] = useState<Ingredient[]>([]);
  const [scanMode, setScanMode] = useState("ticket");
  const [newShopping, setNewShopping] = useState({ name: "", amount: "", price: "" });
  const [reviewDraft, setReviewDraft] = useState({ prepared: "10", liked: "", easy: "Sí", spent: "", discountUsed: true, reason: "Cumplí casi todo" });
  const [memoryDraft, setMemoryDraft] = useState<MemoryRecord | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [locationStatus, setLocationStatus] = useState("Usá tu ubicación para encontrar supermercados cercanos.");
  const [locating, setLocating] = useState(false);
  const [newPayment, setNewPayment] = useState<PaymentMethod>({ bank: "Banco Nación", cardType: "Débito" });
  const [pendingUnknownPayment, setPendingUnknownPayment] = useState<PaymentMethod | null>(null);
  const [publicBenefitDiscoveries, setPublicBenefitDiscoveries] = useState<PublicBenefitDiscovery[]>([]);
  const [storeBenefitDiscoveries, setStoreBenefitDiscoveries] = useState<StoreBenefitDiscovery[]>([]);
  const [discoveringBenefits, setDiscoveringBenefits] = useState(false);
  const [discoveringStoreBenefits, setDiscoveringStoreBenefits] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const restored = parseStoredState(localStorage.getItem(MEALBOARD_STORAGE_KEY)) as Partial<AppState> | null;
    if (restored) {
      const migrated: AppState = {
        ...initialState,
        ...restored,
        profile: {
          ...defaultProfile,
          ...(restored.profile ?? {}),
          ...migrateLegacyPayment(
            (restored.profile ?? {}) as unknown as Record<string, unknown>,
            { bank: defaultProfile.paymentBank, cardType: defaultProfile.paymentCardType },
          ),
        },
        community: restored.community ?? initialCommunity,
        memory: restored.memory ?? initialState.memory,
        purchases: restored.purchases ?? initialState.purchases,
        reviews: restored.reviews ?? initialState.reviews,
        week: (restored.week ?? initialWeek).map((day) => ({ ...initialWeek.find((base) => base.id === day.id), ...day } as Meal)),
        inventory: (restored.inventory ?? initialInventory).map((item) => ({ purchaseDate: "", expiryDate: "", ...item })),
        shopping: (restored.shopping ?? initialShopping).map((item, index) => ({ id: Date.now() + index, ...item })),
      };
      const timer = window.setTimeout(() => setState(migrated), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetch("/api/plan")
      .then((response) => response.json())
      .then((data: { agents?: AgentDefinition[] }) => data.agents && setAgentRegistry(data.agents))
      .catch(() => undefined);
  }, []);

  const persist = (next: AppState) => {
    setState(next);
    localStorage.setItem(MEALBOARD_STORAGE_KEY, serializeStoredState(next));
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const selectedMeal = useMemo(
    () => state.week.find((meal) => meal.id === selectedDay) ?? state.week[0],
    [selectedDay, state.week],
  );
  const selectedCommunity = state.community.find((calendar) => calendar.id === selectedCommunityId) ?? state.community[0];
  const shoppingTotal = state.shopping.reduce((sum, item) => sum + item.price, 0);
  const checkedTotal = state.shopping.filter((item) => item.checked).reduce((sum, item) => sum + item.price, 0);
  const budgetLeft = state.profile.budget - shoppingTotal;
  const urgentInventory = state.inventory.filter(expiryUrgent);
  const activePaymentMethods = useMemo(() => {
    const storedPaymentMethods = state.profile.paymentMethods.length
      ? state.profile.paymentMethods
      : [{ bank: state.profile.paymentBank, cardType: state.profile.paymentCardType }];
    return storedPaymentMethods.map((payment) => ({
      ...payment,
      bank: canonicalPaymentProvider(payment.bank) ?? payment.bank,
    }));
  }, [state.profile.paymentBank, state.profile.paymentCardType, state.profile.paymentMethods]);
  const compatiblePromotionList = useMemo(() => compatiblePromotions(activePaymentMethods), [activePaymentMethods]);
  const publicBenefitReferences = useMemo(() => [
    ...publicBenefitDiscoveries.flatMap((discovery) =>
      extractPublicBenefitReferences(discovery.publicBenefits).map((reference) => ({ ...reference, provider: discovery.provider, sourceUrl: discovery.sourceUrl }))),
    ...storeBenefitDiscoveries.flatMap((discovery) => discovery.references),
  ], [publicBenefitDiscoveries, storeBenefitDiscoveries]);
  const dealsByStore = useMemo(() => Object.fromEntries(nearbyStores.map((store) => {
    const verifiedDeals: StoreDeal[] = compatiblePromotionList
      .filter((promotion) => promotionMatchesStore(promotion, store.name, store.brand))
      .map((promotion) => ({
        title: promotion.title,
        day: promotion.day,
        discount: promotion.discount,
        kind: "verified" as const,
        sourceUrl: promotion.sourceUrl,
        paymentLabels: paymentMethodsForPromotion(promotion, activePaymentMethods)
          .map((method) => `${method.bank} ${method.cardType.toLowerCase()}`),
      }));
    const publicDeals: StoreDeal[] = publicBenefitReferences
      .filter((reference) => publicBenefitMatchesStore(reference, store.name, store.brand))
      .map((reference) => {
        const paymentLabels = activePaymentMethods
          .filter((method) => method.bank === reference.provider)
          .filter((method) => !reference.cardTypes.length || reference.cardTypes.includes(method.cardType))
          .map((method) => `${method.bank} ${method.cardType.toLowerCase()}`);
        return {
          title: `${reference.store} · referencia pública`,
          day: reference.day,
          discount: reference.discount,
          kind: "public-reference" as const,
          sourceUrl: reference.sourceUrl,
          paymentLabels,
        };
      })
      .filter((deal) => deal.paymentLabels.length > 0)
      .filter((deal) => !verifiedDeals.some((verified) => verified.day === deal.day && verified.discount === deal.discount));
    return [store.id, [...verifiedDeals, ...publicDeals]];
  })), [activePaymentMethods, compatiblePromotionList, nearbyStores, publicBenefitReferences]);
  const nearbyStoresWithDeals = nearbyStores.filter((store) => dealsByStore[store.id]?.length);
  const paymentCoverage = activePaymentMethods.map((payment) => ({
    payment,
    source: benefitSourceForProvider(payment.bank),
    promotions: compatiblePromotionList.filter((promotion) => promotion.banks.includes(payment.bank) && promotion.cardTypes.includes(payment.cardType)),
  }));
  const bestPromotion = activePaymentMethods
    .map((payment) => selectBestPromotion(payment, promotions))
    .filter((promotion): promotion is NonNullable<typeof promotion> => Boolean(promotion))
    .sort((a, b) => Number.parseInt(b.discount) - Number.parseInt(a.discount))[0];
  const estimatedPromoSaving = promotionSaving(shoppingTotal, bestPromotion);
  const savedFromPurchases = state.purchases.reduce((sum, purchase) => sum + purchase.saved, 0);
  const totalPrepared = state.reviews.reduce((sum, review) => sum + review.prepared, 0);

  const refreshPublicBenefits = async (silent = false) => {
    setDiscoveringBenefits(true);
    try {
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethods: activePaymentMethods }),
      });
      if (!response.ok) throw new Error("benefits");
      const result = await response.json() as { discoveries: PublicBenefitDiscovery[] };
      setPublicBenefitDiscoveries(result.discoveries);
      if (!silent) notify("Fuentes públicas actualizadas");
    } catch {
      if (!silent) notify("No pudimos consultar las fuentes oficiales ahora.");
    } finally {
      setDiscoveringBenefits(false);
    }
  };

  const refreshStoreBenefits = async (stores: NearbyStore[]) => {
    setDiscoveringStoreBenefits(true);
    try {
      const response = await fetch("/api/store-promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethods: activePaymentMethods,
          stores: stores.map(({ name, brand }) => ({ name, brand })),
        }),
      });
      if (!response.ok) throw new Error("store-benefits");
      const result = await response.json() as { discoveries: StoreBenefitDiscovery[] };
      setStoreBenefitDiscoveries(result.discoveries);
    } catch {
      setStoreBenefitDiscoveries([]);
    } finally {
      setDiscoveringStoreBenefits(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Este dispositivo no ofrece geolocalización.");
      return;
    }
    setLocating(true);
    setLocationStatus("Solicitando permiso de ubicación…");
    void refreshPublicBenefits(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const current = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setLocation(current);
      setLocationStatus("Buscando supermercados en un radio de 5 km…");
      try {
        const stores = await findNearbySupermarkets(current);
        setNearbyStores(stores);
        void refreshStoreBenefits(stores);
        setLocationStatus(stores.length ? `${stores.length} supermercados encontrados con datos de OpenStreetMap.` : "No encontramos supermercados cargados en OpenStreetMap dentro de 5 km.");
      } catch {
        setLocationStatus("No pudimos consultar los locales ahora. Podés intentarlo nuevamente.");
      } finally {
        setLocating(false);
      }
    }, () => {
      setLocating(false);
      setLocationStatus("No se compartió la ubicación. MealBoard sigue funcionando sin el mapa.");
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };

  const addPaymentMethod = () => {
    const validation = validatePaymentProvider(newPayment.bank);
    if (validation.status === "empty") {
      notify("Ingresá un banco o billetera");
      return;
    }
    if (validation.status === "suggestion") {
      setNewPayment({ ...newPayment, bank: validation.provider });
      notify(`¿Quisiste decir ${validation.provider}? Revisalo y volvé a agregarlo.`);
      return;
    }
    if (validation.status === "unknown") {
      setPendingUnknownPayment({ ...newPayment, bank: validation.provider });
      return;
    }
    savePaymentMethod({ ...newPayment, bank: validation.provider });
  };

  const savePaymentMethod = (paymentMethod: PaymentMethod) => {
    if (state.profile.paymentMethods.some((payment) => paymentKey(payment).toLowerCase() === paymentKey(paymentMethod).toLowerCase())) {
      notify("Ese medio de pago ya está seleccionado");
      return;
    }
    const paymentMethods = [...state.profile.paymentMethods, paymentMethod];
    setState({ ...state, profile: { ...state.profile, paymentMethods, paymentBank: paymentMethods[0].bank, paymentCardType: paymentMethods[0].cardType } });
    setPendingUnknownPayment(null);
  };

  const removePaymentMethod = (payment: PaymentMethod) => {
    const paymentMethods = state.profile.paymentMethods.filter((item) => paymentKey(item) !== paymentKey(payment));
    if (!paymentMethods.length) {
      notify("Mantené al menos un medio de pago");
      return;
    }
    setState({ ...state, profile: { ...state.profile, paymentMethods, paymentBank: paymentMethods[0].bank, paymentCardType: paymentMethods[0].cardType } });
  };

  const notifications = [
    ...(urgentInventory.length ? [{ icon: "!", title: `${urgentInventory.length} alimentos próximos a vencer`, detail: urgentInventory.map((item) => item.name).join(", ") }] : []),
    ...(bestPromotion ? [{ icon: "%", title: `${bestPromotion.day} de descuento`, detail: `${bestPromotion.discount} con ${bestPromotion.cardType.toLowerCase()} de ${bestPromotion.bank} en ${bestPromotion.store}.` }] : []),
    ...(shoppingTotal > state.profile.budget * .8 ? [{ icon: "$", title: "Presupuesto próximo al límite", detail: `La lista usa ${Math.round(shoppingTotal / state.profile.budget * 100)}% del presupuesto.` }] : []),
    { icon: "✓", title: "Evaluación semanal disponible", detail: "Registrá gastos, comidas y dificultades para que la memoria aprenda." },
  ];

  const visibleCommunity = state.community.filter((calendar) => {
    if (calendar.reported) return false;
    if (communityFilter === "Guardados") return calendar.favorite;
    if (communityFilter === "Seguidos") return calendar.followed;
    if (communityFilter === "Económicos") return calendar.tag === "Económico";
    if (communityFilter === "Principiantes") return calendar.tag === "Principiante";
    return true;
  }).sort((a, b) => communityFilter === "Más populares" ? b.saves - a.saves : b.rating - a.rating);

  const selectedRecipeName = state.week.find((day) => day.id === selectedMealContext.dayId)?.[selectedMealContext.slot] ?? "";
  const selectedRecipe = recipeCatalog.find((recipe) => recipe.name === selectedRecipeName);
  const currentSlotDefinition = slotDefinitions.find((slot) => slot.id === selectedMealContext.slot) ?? slotDefinitions[1];

  const openRecipe = (dayId: string, slot: MealSlot) => {
    setSelectedMealContext({ dayId, slot });
    setModal("recipe");
  };

  const generatePlan = async (preferredCommunityCalendar?: string, republish = false) => {
    setPlanning(true);
    setPendingPlan(null);
    setPendingRepublish(republish);
    setModal("plan");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: state.profile.city,
          profile: { ...state.profile, paymentMethods: activePaymentMethods },
          inventory: state.inventory.map((item) => ({ ...item, expiry: item.expiry || item.expiryDate || "Sin fecha" })),
          priorFeedback: [...state.feedback, ...state.memory.map((memory) => memory.text)],
          promotions,
          requestedMeals: state.profile.plannedMeals,
          preferredCommunityCalendar,
          refreshPublicBenefits: true,
        }),
      });
      if (!response.ok) throw new Error("plan");
      const plan = await response.json() as PlanResponse;
      setPendingPlan(plan);
      setPublicBenefitDiscoveries(plan.promotionDiscoveries ?? []);
    } catch {
      notify("No pudimos generar el plan. Probá nuevamente.");
      setModal(null);
    } finally {
      setPlanning(false);
    }
  };

  const publishCalendar = (base: AppState, title = publishTitle) => {
    const id = `own-${Date.now()}`;
    return {
      ...base,
      community: [{
        id, creator: base.profile.name, title, rating: 5, ratings: 1, saves: 0,
        tag: "Publicado por vos", accent: "tomato",
        description: `Calendario con ${base.profile.plannedMeals.length * 7} comidas, adaptado al presupuesto y al inventario.`,
        favorite: true, followed: true, comments: [], own: true,
        moderation: "Aprobado por revisión automática de seguridad.",
      }, ...base.community],
    };
  };

  const confirmPlan = () => {
    if (!pendingPlan) return;
    let next: AppState = {
      ...state,
      week: pendingPlan.week,
      shopping: pendingPlan.shopping.map((item, index) => ({ ...item, id: Date.now() + index })),
      recipeGuides: pendingPlan.recipeGuides,
      savings: pendingPlan.estimatedSaving || state.savings,
      memory: [...state.memory, {
        id: Date.now(),
        text: `El plan se inspiró en “${pendingPlan.communitySource}” y estimó ${money(pendingPlan.estimatedSaving)} de ahorro.`,
        kind: "Decisión agéntica",
        createdAt: "Hoy",
      }],
    };
    if (pendingRepublish) next = publishCalendar(next, `${pendingPlan.communitySource} · adaptado por ${state.profile.name}`);
    persist(next);
    setModal(null);
    notify(pendingRepublish ? "Calendario adaptado, confirmado y republicado" : "Calendario confirmado y lista actualizada");
  };

  const saveCalendar = (id: string) => {
    persist({
      ...state,
      community: state.community.map((calendar) => calendar.id === id
        ? { ...calendar, favorite: !calendar.favorite, saves: calendar.saves + (calendar.favorite ? -1 : 1) }
        : calendar),
    });
  };

  const followCreator = (creator: string) => {
    const shouldFollow = !state.community.some((calendar) => calendar.creator === creator && calendar.followed);
    persist({
      ...state,
      community: state.community.map((calendar) => calendar.creator === creator ? { ...calendar, followed: shouldFollow } : calendar),
    });
    notify(shouldFollow ? `Ahora seguís a ${creator}` : `Dejaste de seguir a ${creator}`);
  };

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (!communityComment.trim() || !selectedCommunity) return;
    persist({
      ...state,
      community: state.community.map((calendar) => calendar.id === selectedCommunity.id
        ? { ...calendar, comments: [...calendar.comments, { id: Date.now(), author: state.profile.name, text: communityComment.trim() }] }
        : calendar),
    });
    setCommunityComment("");
    notify("Comentario publicado");
  };

  const rateCalendar = (rating: number) => {
    if (!selectedCommunity) return;
    persist({
      ...state,
      community: state.community.map((calendar) => calendar.id === selectedCommunity.id
        ? { ...calendar, rating: Math.round(((calendar.rating * calendar.ratings + rating) / (calendar.ratings + 1)) * 10) / 10, ratings: calendar.ratings + 1 }
        : calendar),
    });
    notify(`Puntuación de ${rating} estrellas registrada`);
  };

  const reportCalendar = () => {
    if (!selectedCommunity) return;
    persist({ ...state, community: state.community.map((calendar) => calendar.id === selectedCommunity.id ? { ...calendar, reported: true } : calendar) });
    setModal(null);
    notify("Contenido reportado y ocultado para revisión");
  };

  const addIngredient = (event: FormEvent) => {
    event.preventDefault();
    if (!newIngredient.name.trim()) return;
    persist({
      ...state,
      inventory: [...state.inventory, {
        id: Date.now(), name: newIngredient.name.trim(), amount: newIngredient.amount || "1 unidad",
        expiry: newIngredient.expiry || "Sin fecha", price: Number(newIngredient.price) || 0,
        purchaseDate: newIngredient.purchaseDate, expiryDate: newIngredient.expiryDate,
      }],
    });
    setNewIngredient({ name: "", amount: "", purchaseDate: todayIso(), expiry: "", expiryDate: "", price: "" });
    notify("Ingrediente agregado al inventario");
  };

  const beginScan = (mode: string) => {
    setScanMode(mode);
    scanInputRef.current?.click();
  };

  const recognizeFile = () => {
    setScanCandidates([
      { id: Date.now(), name: "Yogur natural", amount: "4 unidades", expiry: "12 días", price: 3200, purchaseDate: todayIso(), expiryDate: "2026-08-09" },
      { id: Date.now() + 1, name: "Bananas", amount: "1 kg", expiry: "5 días", price: 2300, purchaseDate: todayIso(), expiryDate: "2026-08-02" },
      { id: Date.now() + 2, name: "Avena", amount: "500 g", expiry: "6 meses", price: 1800, purchaseDate: todayIso(), expiryDate: "2027-01-28" },
    ]);
    setModal("scan");
  };

  const confirmScan = () => {
    persist({ ...state, inventory: [...state.inventory, ...scanCandidates] });
    setModal(null);
    notify(`${scanCandidates.length} productos reconocidos y agregados`);
  };

  const saveInventoryEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!inventoryDraft) return;
    persist({ ...state, inventory: state.inventory.map((item) => item.id === inventoryDraft.id ? inventoryDraft : item) });
    setModal(null);
    notify("Producto actualizado");
  };

  const addShoppingItem = (event: FormEvent) => {
    event.preventDefault();
    if (!newShopping.name.trim()) return;
    persist({
      ...state,
      shopping: [...state.shopping, {
        id: Date.now(), name: newShopping.name.trim(), amount: newShopping.amount || "1 unidad",
        price: Number(newShopping.price) || 0, checked: false,
      }],
    });
    setNewShopping({ name: "", amount: "", price: "" });
    notify("Producto agregado a la lista");
  };

  const completePurchase = () => {
    const bought = state.shopping.filter((item) => item.checked);
    if (!bought.length) {
      notify("Marcá al menos un producto como comprado");
      return;
    }
    const purchaseId = Math.max(0, ...state.purchases.map((purchase) => purchase.id)) + 1;
    const memoryId = Math.max(0, ...state.memory.map((record) => record.id)) + 1;
    const spent = bought.reduce((sum, item) => sum + item.price, 0);
    const saved = promotionSaving(spent, bestPromotion);
    const newInventory = bought.map((item, index) => ({
      id: Date.now() + index, name: item.name, amount: item.amount, price: item.price,
      purchaseDate: todayIso(), expiryDate: "", expiry: "7 días",
    }));
    persist({
      ...state,
      inventory: [...state.inventory, ...newInventory],
      shopping: state.shopping.filter((item) => !item.checked),
      savings: state.savings + saved,
      purchases: [...state.purchases, { id: purchaseId, date: "Hoy", spent, saved, store: bestPromotion?.store ?? "Sin promoción", discount: bestPromotion?.discount ?? "0%" }],
      memory: [...state.memory, { id: memoryId, text: bestPromotion
        ? `Aprovechaste ${bestPromotion.discount} en ${bestPromotion.store} y ahorraste ${money(saved)}.`
        : `Completaste una compra sin una promoción compatible para ${state.profile.paymentCardType.toLowerCase()} de ${state.profile.paymentBank}.`, kind: "Compra", createdAt: "Hoy" }],
    });
    notify(bestPromotion ? `Compra finalizada: ${money(saved)} ahorrados` : "Compra finalizada sin promoción compatible");
  };

  const openMealEdit = () => {
    setMealReplacement(selectedRecipeName);
    setModal("meal-edit");
  };

  const confirmMealEdit = (event: FormEvent) => {
    event.preventDefault();
    const replacement = recipeCatalog.find((recipe) => recipe.name === mealReplacement);
    if (!replacement) return;
    const metaKey = `${selectedMealContext.slot}Meta` as `${MealSlot}Meta`;
    const week = state.week.map((day) => day.id === selectedMealContext.dayId
      ? { ...day, [selectedMealContext.slot]: replacement.name, [metaKey]: `${replacement.minutes} min · ${replacement.difficulty}` } as Meal
      : day);
    persist({ ...state, week });
    setModal(null);
    notify("Comida cambiada con tu confirmación");
  };

  const recordMissedMeal = (event: FormEvent) => {
    event.preventDefault();
    const source = state.week.find((day) => day.id === selectedMealContext.dayId);
    const target = state.week.find((day) => day.id === missedDraft.targetDay);
    let week = state.week;
    if (missedDraft.reschedule && source && target && source.id !== target.id) {
      const metaKey = `${selectedMealContext.slot}Meta` as `${MealSlot}Meta`;
      week = state.week.map((day) => {
        if (day.id === source.id) return { ...day, [selectedMealContext.slot]: target[selectedMealContext.slot], [metaKey]: target[metaKey] } as Meal;
        if (day.id === target.id) return { ...day, [selectedMealContext.slot]: source[selectedMealContext.slot], [metaKey]: source[metaKey] } as Meal;
        return day;
      });
    }
    const text = `No cocinaste ${selectedRecipeName}: ${missedDraft.reason.toLowerCase()}.`;
    persist({
      ...state,
      week,
      feedback: [...state.feedback, missedDraft.reason],
      memory: [...state.memory, { id: Date.now(), text, kind: "Motivo", createdAt: "Hoy" }],
    });
    setModal(null);
    notify(missedDraft.reschedule ? "Motivo guardado y comida reprogramada" : "Motivo guardado sin cambiar el calendario");
  };

  const submitReview = (event: FormEvent) => {
    event.preventDefault();
    const review: WeeklyReview = {
      id: Date.now(), date: "Hoy", prepared: Number(reviewDraft.prepared) || 0,
      liked: reviewDraft.liked || "Sin plato destacado", easy: reviewDraft.easy,
      spent: Number(reviewDraft.spent) || 0, discountUsed: reviewDraft.discountUsed, reason: reviewDraft.reason,
    };
    const memoryItems: MemoryRecord[] = [
      { id: Date.now() + 1, text: `${review.reason}. Preparaste ${review.prepared} comidas y la semana fue ${review.easy.toLowerCase()} de cumplir.`, kind: "Evaluación", createdAt: "Hoy" },
      ...(review.liked !== "Sin plato destacado" ? [{ id: Date.now() + 2, text: `Te gustó especialmente ${review.liked}.`, kind: "Gusto", createdAt: "Hoy" }] : []),
    ];
    persist({
      ...state,
      feedback: [...state.feedback, review.reason, review.easy === "No" ? "Me faltó tiempo" : "Cumplí casi todo"],
      reviews: [...state.reviews, review],
      memory: [...state.memory, ...memoryItems],
    });
    setModal(null);
    notify("Evaluación completa guardada en la memoria");
  };

  const saveMemoryEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!memoryDraft?.text.trim()) return;
    persist({ ...state, memory: state.memory.map((record) => record.id === memoryDraft.id ? memoryDraft : record) });
    setModal(null);
    notify("Dato aprendido corregido");
  };

  const titleByTab: Record<string, [string, string]> = {
    calendar: ["Mi semana", "Tu calendario, tus ingredientes y el mejor momento para comprar."],
    explore: ["Explorar", "Calendarios reales para guardar, adaptar y compartir."],
    inventory: ["Mi inventario", "Lo que tenés en casa, con cantidades, compras y vencimientos."],
    shopping: ["Lista de compras", "Solo lo necesario, en el día con mejor descuento."],
    savings: ["Ahorro y estadísticas", "Resultados semanales para tomar mejores decisiones."],
    profile: ["Mi perfil", "Preferencias, planificación y control de la memoria."],
  };

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <button className="brand" type="button" onClick={() => setActiveTab("calendar")}>
          <span className="brand-mark">M</span><span>MealBoard</span>
        </button>
        <nav className="desktop-nav">
          {navItems.map((item) => (
            <button key={item.id} className={activeTab === item.id ? "nav-item active" : "nav-item"}
              onClick={() => setActiveTab(item.id)} type="button">
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <button className="agent-status" type="button" onClick={() => setModal("agents")}>
          <span className="status-dot" />
          <span><strong>9 agentes listos</strong><small>Reglas locales + fuentes públicas</small></span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">PLANIFICA CADA {state.profile.planningDay.toUpperCase()}</p>
            <h1>{titleByTab[activeTab][0]}</h1>
            <p className="subtitle">{titleByTab[activeTab][1]}</p>
          </div>
          <div className="top-actions">
            <button className="icon-button" type="button" onClick={() => setModal("notice")} aria-label="Ver notificaciones">♢<span>{notifications.length}</span></button>
            <button className="avatar" type="button" onClick={() => setActiveTab("profile")} aria-label="Abrir perfil">{initials(state.profile.name)}</button>
          </div>
        </header>

        {activeTab === "calendar" && (
          <>
            <div className="summary-grid">
              <article className="summary-card budget-card">
                <div className="summary-heading"><span className="summary-icon">$</span><span>Presupuesto restante</span></div>
                <strong className={budgetLeft < 0 ? "negative" : ""}>{money(budgetLeft)}</strong><small>de {money(state.profile.budget)}</small>
                <div className="progress"><span style={{ width: `${Math.min(100, shoppingTotal / state.profile.budget * 100)}%` }} /></div>
              </article>
              <article className="summary-card alert-card">
                <div className="summary-heading"><span className="summary-icon">!</span><span>{urgentInventory.length} alimentos por vencer</span></div>
                <strong>{urgentInventory.length ? urgentInventory.map((item) => item.name).join(" y ") : "Todo en fecha"}</strong><small>{urgentInventory.length ? "Los agentes los priorizan" : "No hay urgencias"}</small>
              </article>
              <article className="summary-card saving-card">
                <div className="summary-heading"><span className="summary-icon">↘</span><span>Ahorro estimado</span></div>
                <strong>{money(estimatedPromoSaving || state.savings)}</strong><small>con descuentos esta semana</small>
              </article>
            </div>

            <section className="calendar-panel" aria-labelledby="calendar-title">
              <div className="panel-heading">
                <div><p className="eyebrow">PLANIFICACIÓN</p><h2 id="calendar-title">Calendario semanal</h2><small className="section-helper">{slotDefinitions.filter((slot) => state.profile.plannedMeals.includes(slot.id)).map((slot) => slot.label).join(" · ")}</small></div>
                <div className="panel-actions">
                  <button className="secondary-button" onClick={() => setActiveTab("explore")} type="button">Explorar calendarios</button>
                  <button className="primary-button" onClick={() => generatePlan()} type="button">✦ Generar con agentes</button>
                </div>
              </div>
              <div className="week-strip" role="tablist" aria-label="Días de la semana">
                {state.week.map((meal) => (
                  <button key={meal.id} role="tab" aria-selected={selectedDay === meal.id}
                    className={selectedDay === meal.id ? "day-button selected" : "day-button"}
                    onClick={() => setSelectedDay(meal.id)} type="button">
                    <span>{meal.shortDay}</span><strong>{meal.date}</strong>
                  </button>
                ))}
              </div>
              <div className={`mobile-day-detail slots-${state.profile.plannedMeals.length}`}>
                <div className="day-title"><span>{selectedMeal.day}</span><small>{selectedMeal.date} de julio</small></div>
                {slotDefinitions.filter((slot) => state.profile.plannedMeals.includes(slot.id)).map((slot) => (
                  <MealCard key={slot.id} slot={slot} value={selectedMeal[slot.id]} meta={selectedMeal[`${slot.id}Meta`]} onOpen={() => openRecipe(selectedMeal.id, slot.id)} />
                ))}
              </div>
              <div className="desktop-week-grid">
                {state.week.map((meal) => (
                  <div className="day-column" key={meal.id}>
                    <div className="day-title"><span>{meal.shortDay}</span><strong>{meal.date}</strong></div>
                    {slotDefinitions.filter((slot) => state.profile.plannedMeals.includes(slot.id)).map((slot) => (
                      <MealCard key={slot.id} slot={slot} value={meal[slot.id]} meta={meal[`${slot.id}Meta`]} onOpen={() => openRecipe(meal.id, slot.id)} />
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="lower-grid">
              <article className="ingredients-card">
                <div className="panel-heading compact">
                  <div><p className="eyebrow">INVENTARIO</p><h2>Ingredientes disponibles</h2></div>
                  <button className="text-button" onClick={() => setActiveTab("inventory")} type="button">Ver todos →</button>
                </div>
                <div className="ingredient-list">
                  {state.inventory.slice(0, 6).map((item, index) => (
                    <div className="ingredient" key={item.id}><span>{["◯", "◉", "◇", "△", "◌", "◐"][index % 6]}</span><strong>{item.name}</strong></div>
                  ))}
                </div>
              </article>
              <article className="discount-card">
                <p className="eyebrow">PRÓXIMA COMPRA</p><h2>{bestPromotion ? `${bestPromotion.day} con ${bestPromotion.discount} de ahorro` : "Sin promoción compatible"}</h2>
                <p>{bestPromotion ? `${bestPromotion.bank} tiene descuento con ${bestPromotion.cardType.toLowerCase()} en ${bestPromotion.store}. Tope ${bestPromotion.cap}.` : "No hay descuentos vigentes verificados para los medios de pago seleccionados."}</p>
                <button className="discount-action" onClick={() => setActiveTab("shopping")} type="button">Ver lista de compras <span>→</span></button>
              </article>
            </section>
          </>
        )}

        {activeTab === "explore" && (
          <section className="content-panel">
            <div className="community-toolbar">
              <div className="filter-row">
                {["Para vos", "Más populares", "Guardados", "Seguidos", "Económicos", "Principiantes"].map((filter) => (
                  <button className={communityFilter === filter ? "chip active" : "chip"} type="button" key={filter} onClick={() => setCommunityFilter(filter)}>{filter}</button>
                ))}
              </div>
              <button className="primary-button" type="button" onClick={() => setModal("publish")}>＋ Publicar mi calendario</button>
            </div>
            <div className="community-grid">
              {visibleCommunity.map((calendar) => (
                <article className={`community-card ${calendar.accent}`} key={calendar.id}>
                  <button className="cover-button" type="button" onClick={() => { setSelectedCommunityId(calendar.id); setModal("community"); }}>
                    <div className="calendar-cover"><span>{calendar.tag}</span><strong>7 días<br />{state.profile.plannedMeals.length * 7} comidas</strong></div>
                  </button>
                  <div className="community-body">
                    <div className="creator-row"><small>{calendar.creator}</small><button type="button" onClick={() => followCreator(calendar.creator)}>{calendar.followed ? "Siguiendo" : "Seguir"}</button></div>
                    <h2>{calendar.title}</h2>
                    <p>★ {calendar.rating.toFixed(1)} · {calendar.saves.toLocaleString("es-AR")} guardados</p>
                    {calendar.moderation && <small className="moderation">✓ {calendar.moderation}</small>}
                    <div className="card-actions">
                      <button className={calendar.favorite ? "secondary-button saved" : "secondary-button"} onClick={() => saveCalendar(calendar.id)} type="button">{calendar.favorite ? "♥ Guardado" : "♡ Guardar"}</button>
                      <button className="primary-button" onClick={() => generatePlan(calendar.title)} type="button">Descargar y adaptar</button>
                    </div>
                  </div>
                </article>
              ))}
              {!visibleCommunity.length && <div className="empty-state"><strong>No hay calendarios en este filtro</strong><span>Guardá o seguí creadores para encontrarlos acá.</span></div>}
            </div>
            <div className="social-note"><strong>Comunidad funcional de demostración</strong><span>Podés publicar, guardar, seguir, comentar, puntuar, reportar y adaptar. Los datos quedan guardados en este dispositivo.</span></div>
          </section>
        )}

        {activeTab === "inventory" && (
          <section className="split-layout">
            <article className="content-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">ALACENA Y HELADERA</p><h2>{state.inventory.length} productos registrados</h2></div>
                <div className="panel-actions">
                  <button className="secondary-button" onClick={() => beginScan("foto")} type="button">▧ Reconocer foto</button>
                  <button className="secondary-button" onClick={() => beginScan("ticket")} type="button">▣ Escanear ticket</button>
                </div>
              </div>
              <input className="hidden-input" ref={scanInputRef} type="file" accept="image/*" onChange={recognizeFile} aria-label="Seleccionar foto o ticket" />
              <div className="inventory-table">
                {state.inventory.map((item) => (
                  <div className="inventory-row expanded" key={item.id}>
                    <span className="food-dot" />
                    <div><strong>{item.name}</strong><small>{item.amount} · Pagaste {money(item.price)}</small><small>Compra: {item.purchaseDate || "sin registrar"} · Vence: {item.expiryDate || item.expiry}</small></div>
                    <span className={expiryUrgent(item) ? "expiry urgent" : "expiry"}>{item.expiry}</span>
                    <button className="edit-button" type="button" onClick={() => { setInventoryDraft(item); setModal("inventory-edit"); }}>Editar</button>
                    <button className="delete-button" type="button" aria-label={`Eliminar ${item.name}`} onClick={() => persist({ ...state, inventory: state.inventory.filter((food) => food.id !== item.id) })}>×</button>
                  </div>
                ))}
              </div>
            </article>
            <aside className="form-card">
              <p className="eyebrow">CARGA MANUAL</p><h2>Agregar ingrediente</h2>
              <form onSubmit={addIngredient}>
                <label>Producto<input value={newIngredient.name} onChange={(event) => setNewIngredient({ ...newIngredient, name: event.target.value })} placeholder="Ej. Yogur" required /></label>
                <label>Cantidad<input value={newIngredient.amount} onChange={(event) => setNewIngredient({ ...newIngredient, amount: event.target.value })} placeholder="Ej. 2 unidades" /></label>
                <div className="inline-fields"><label>Fecha de compra<input type="date" value={newIngredient.purchaseDate} onChange={(event) => setNewIngredient({ ...newIngredient, purchaseDate: event.target.value })} /></label><label>Precio<input type="number" value={newIngredient.price} onChange={(event) => setNewIngredient({ ...newIngredient, price: event.target.value })} placeholder="$" /></label></div>
                <label>Vencimiento aproximado<input value={newIngredient.expiry} onChange={(event) => setNewIngredient({ ...newIngredient, expiry: event.target.value })} placeholder="Ej. 5 días" /></label>
                <label>Fecha de vencimiento<input type="date" value={newIngredient.expiryDate} onChange={(event) => setNewIngredient({ ...newIngredient, expiryDate: event.target.value })} /></label>
                <button className="primary-button full" type="submit">Agregar al inventario</button>
              </form>
            </aside>
          </section>
        )}

        {activeTab === "shopping" && (<>
          <section className="split-layout shopping-layout">
            <article className="content-panel">
              <div className="panel-heading"><div><p className="eyebrow">PARA ESTA SEMANA</p><h2>{state.shopping.length} productos por comprar</h2></div><strong className="total">{money(shoppingTotal)}</strong></div>
              <div className="shopping-list">
                {state.shopping.map((item) => (
                  <div className={item.checked ? "shopping-row checked" : "shopping-row"} key={item.id}>
                    <input aria-label={`Marcar ${item.name}`} type="checkbox" checked={item.checked} onChange={() => persist({ ...state, shopping: state.shopping.map((food) => food.id === item.id ? { ...food, checked: !food.checked } : food) })} />
                    <span><strong>{item.name}</strong><small>{item.amount}</small></span><b>{money(item.price)}</b>
                    <button className="delete-button" type="button" aria-label={`Quitar ${item.name}`} onClick={() => persist({ ...state, shopping: state.shopping.filter((food) => food.id !== item.id) })}>×</button>
                  </div>
                ))}
                {!state.shopping.length && <div className="empty-state compact"><strong>Lista completa</strong><span>No tenés productos pendientes.</span></div>}
              </div>
              <form className="quick-add" onSubmit={addShoppingItem}>
                <input value={newShopping.name} onChange={(event) => setNewShopping({ ...newShopping, name: event.target.value })} placeholder="Agregar producto" aria-label="Producto" />
                <input value={newShopping.amount} onChange={(event) => setNewShopping({ ...newShopping, amount: event.target.value })} placeholder="Cantidad" aria-label="Cantidad" />
                <input type="number" value={newShopping.price} onChange={(event) => setNewShopping({ ...newShopping, price: event.target.value })} placeholder="Precio" aria-label="Precio" />
                <button className="secondary-button" type="submit">Agregar</button>
              </form>
              <div className="shopping-footer"><span>Marcado como comprado</span><strong>{money(checkedTotal)}</strong></div>
              <button className="primary-button full purchase-button" type="button" onClick={completePurchase}>Finalizar compra y actualizar inventario</button>
            </article>
            <aside className="promo-card">
              <span className="promo-badge">PROMOCIÓN VERIFICADA</span><p className="eyebrow">{bestPromotion ? `COMPRÁ EL ${bestPromotion.day.toUpperCase()}` : "SIN COINCIDENCIAS VIGENTES"}</p><h2>{bestPromotion ? `${bestPromotion.discount} con ${bestPromotion.bank}` : "No hay promoción compatible"}</h2>
              <p>{bestPromotion ? `Con ${bestPromotion.cardType.toLowerCase()} en ${bestPromotion.store}. Tope: ${bestPromotion.cap}.` : `Revisamos todos tus medios guardados sin aplicar beneficios vencidos o incompatibles.`}</p>
              <div className="promo-saving"><span>Ahorro estimado</span><strong>{money(estimatedPromoSaving)}</strong></div>
              {shoppingTotal > state.profile.budget && <div className="budget-warning">La lista supera tu presupuesto por {money(shoppingTotal - state.profile.budget)}. Podés quitar productos o generar un plan más económico.</div>}
              {bestPromotion && <><small>Verificada: {bestPromotion.verifiedAt} · {bestPromotion.validThrough ? `Vigente hasta: ${bestPromotion.validThrough}` : "La fuente no publica fecha final; requiere confirmación"}</small>{bestPromotion.notes && <small>{bestPromotion.notes}</small>}<a className="promo-source" href={bestPromotion.sourceUrl} target="_blank" rel="noreferrer">Ver condiciones oficiales ↗</a></>}
              <small>Los beneficios pueden cambiar o agotarse. Confirmalos con el banco antes de pagar.</small>
            </aside>
          </section>
          <section className="content-panel coverage-panel">
            <div className="panel-heading"><div><p className="eyebrow">COBERTURA DE BENEFICIOS</p><h2>Beneficios públicos de tus medios</h2><p>El agente consulta únicamente las fuentes oficiales asociadas a los medios seleccionados. No inicia sesión ni accede a beneficios personales.</p></div><button className="primary-button" type="button" disabled={discoveringBenefits} onClick={() => void refreshPublicBenefits()}>{discoveringBenefits ? "Consultando…" : "Actualizar fuentes oficiales"}</button></div>
            <div className="coverage-grid">{paymentCoverage.map(({ payment, source, promotions: matchingPromotions }) => {
              const discovery = publicBenefitDiscoveries.find((item) => item.provider === payment.bank);
              return <article key={paymentKey(payment)}><div><strong>{payment.bank}</strong><span>{payment.cardType}</span></div>{matchingPromotions.length ? <p className="coverage-ok">{matchingPromotions.length} promoción estructurada vigente</p> : <p className="coverage-review">Sin promoción estructurada compatible</p>}{discovery && <div className={`source-status ${discovery.status}`}><strong>{discovery.status === "available" ? "Fuente consultada" : discovery.status === "unavailable" ? "Fuente temporalmente inaccesible" : "Sin fuente asociada"}</strong><p>{discovery.message}</p>{discovery.publicBenefits.length > 0 && <details><summary>Ver {discovery.publicBenefits.length} referencias encontradas</summary><ul>{discovery.publicBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></details>}</div>}{!discovery && <p>Actualizá para consultar publicaciones públicas.</p>}{source?.notice && <p>{source.notice}</p>}{source ? <><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a><small>Fuente {source.coverage === "provider" ? "de la entidad" : "agregadora"} · revisada {source.reviewedAt}</small></> : <small>Entidad personalizada sin fuente oficial asociada.</small>}</article>;
            })}</div>
          </section>
          <section className="content-panel nearby-panel">
            <div className="panel-heading"><div><p className="eyebrow">CERCA TUYO</p><h2>Supermercados y descuentos en el mapa</h2><p>{locationStatus}{location && (discoveringStoreBenefits ? " Buscando descuentos en las secciones oficiales…" : ` ${nearbyStoresWithDeals.length} tienen descuentos compatibles cargados.`)}</p></div><button className="primary-button" type="button" disabled={locating} onClick={requestLocation}>{locating ? "Buscando…" : "Usar mi ubicación"}</button></div>
            <div className="privacy-note">La ubicación se usa solo para esta consulta y no se guarda en tu perfil ni en la memoria.</div>
            {location && storeBenefitDiscoveries.length > 0 && <div className="store-source-summary"><strong>Fuentes de supermercados consultadas</strong>{storeBenefitDiscoveries.map((discovery) => <a href={discovery.sourceUrl} target="_blank" rel="noreferrer" key={discovery.store}>{discovery.store}: {discovery.references.length ? `${discovery.references.length} coincidencias` : discovery.status === "available" ? "sin coincidencias legibles" : "no disponible"}{discovery.pagesChecked ? ` · ${discovery.pagesChecked} secciones` : ""} ↗</a>)}</div>}
            {location && <><div className="map-legend"><span><i className="deal-dot" /> Promoción verificada</span><span><i className="public-dot" /> Referencia de fuente pública</span><span><i /> Sin descuento cargado</span></div><div className="map-layout"><StoreMap location={location} stores={nearbyStores} dealsByStore={dealsByStore} /><div className="nearby-list">{[...nearbyStores].sort((left, right) => Number(Boolean(dealsByStore[right.id]?.length)) - Number(Boolean(dealsByStore[left.id]?.length)) || left.distanceKm - right.distanceKm).slice(0, 10).map((store) => {
              const storeDeals = dealsByStore[store.id] ?? [];
              return <article className={storeDeals.length ? "has-deal" : ""} key={store.id}><div><strong>{store.name}</strong><small>{store.distanceKm.toFixed(1)} km</small></div>{storeDeals.length ? storeDeals.map((deal) => <div className="store-deal-detail" key={`${deal.kind}-${deal.title}-${deal.day}`}><span className={deal.kind === "verified" ? "store-deal" : "store-public-deal"}>{deal.day}: {deal.discount} posible*</span><small>{deal.paymentLabels.join(" · ")}</small>{deal.kind === "public-reference" && <small>Referencia encontrada en la fuente oficial; revisá las condiciones.</small>}{deal.sourceUrl && <a href={deal.sourceUrl} target="_blank" rel="noreferrer">Ver condiciones</a>}</div>) : <span>Sin beneficio compatible cargado</span>}<a href={`https://www.openstreetmap.org/?mlat=${store.latitude}&mlon=${store.longitude}#map=18/${store.latitude}/${store.longitude}`} target="_blank" rel="noreferrer">Abrir mapa</a></article>;
            })}</div></div></>}
            {location && nearbyStores.length > 0 && <small>*La cercanía no garantiza adhesión a la promoción. Verificá el comercio en las condiciones oficiales.</small>}
          </section>
        </>)}

        {activeTab === "savings" && (
          <section className="content-panel">
            <div className="stat-strip">
              <div><small>Ahorro registrado</small><strong>{money(state.savings + savedFromPurchases)}</strong><span>promociones utilizadas</span></div>
              <div><small>Comidas preparadas</small><strong>{totalPrepared}</strong><span>según evaluaciones semanales</span></div>
              <div><small>Compras registradas</small><strong>{state.purchases.length}</strong><span>{money(state.purchases.reduce((sum, item) => sum + item.spent, 0))} gastados</span></div>
            </div>
            <div className="savings-grid">
              <article><p className="eyebrow">PROMOCIONES VERIFICADAS</p><h2>Oportunidades de la semana</h2>
                {promotions.map((promo) => <div className="promo-row" key={promo.day}><span>{promo.day.slice(0, 3)}</span><div><strong>{promo.discount} en {promo.store}</strong><small>{promo.bank} · {promo.cardType} · Tope {promo.cap}</small></div></div>)}
              </article>
              <article><p className="eyebrow">HISTORIAL DE COMPRAS</p><h2>Gasto y ahorro</h2>
                <div className="history-chart">
                  {state.purchases.slice(-4).map((purchase) => (
                    <div key={purchase.id}><div className="chart-label"><span>{purchase.date} · {purchase.store}</span><strong>{money(purchase.spent)}</strong></div><div className="bar-track"><span style={{ width: `${Math.min(100, purchase.spent / Math.max(state.profile.budget, 1) * 100)}%` }} /></div><small>Ahorraste {money(purchase.saved)} ({purchase.discount})</small></div>
                  ))}
                </div>
              </article>
              <article><p className="eyebrow">APRENDIZAJE</p><h2>Lo que MealBoard aprendió</h2>
                <ul className="learning-list">{state.memory.slice(-5).map((item) => <li key={item.id}>{item.text}</li>)}</ul>
                <button className="primary-button" onClick={() => setModal("feedback")} type="button">Evaluar mi semana</button>
              </article>
              <article><p className="eyebrow">EVALUACIONES</p><h2>Últimas semanas</h2>
                <div className="review-list">{state.reviews.slice().reverse().slice(0, 3).map((review) => <div key={review.id}><strong>{review.date} · {review.prepared} comidas</strong><small>{review.reason} · Gastaste {money(review.spent)} · Descuento: {review.discountUsed ? "sí" : "no"}</small></div>)}</div>
              </article>
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="profile-layout">
            <article className="profile-card">
              <div className="profile-avatar">{initials(state.profile.name)}</div><h2>{state.profile.name}</h2><p>Vive sola · {state.profile.city}</p>
              <div className="memory-badge">✓ Memoria activa · {state.memory.length} registros</div>
              <small>Podés consultar, corregir o borrar lo aprendido.</small>
            </article>
            <div className="profile-stack">
              <form className="content-panel profile-form" onSubmit={(event) => { event.preventDefault(); persist(state); notify("Preferencias guardadas"); }}>
                <div><p className="eyebrow">PERSONALIZACIÓN</p><h2>Preferencias de planificación</h2></div>
                <div className="form-grid">
                  <label>Nombre<input value={state.profile.name} onChange={(event) => setState({ ...state, profile: { ...state.profile, name: event.target.value } })} /></label>
                  <label>Ciudad<input value={state.profile.city} onChange={(event) => setState({ ...state, profile: { ...state.profile, city: event.target.value } })} /></label>
                  <label>Presupuesto semanal<input type="number" value={state.profile.budget} onChange={(event) => setState({ ...state, profile: { ...state.profile, budget: Number(event.target.value) } })} /></label>
                  <label>Día de planificación<select value={state.profile.planningDay} onChange={(event) => setState({ ...state, profile: { ...state.profile, planningDay: event.target.value } })}>{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => <option key={day}>{day}</option>)}</select></label>
                  <label>Nivel de cocina<select value={state.profile.level} onChange={(event) => setState({ ...state, profile: { ...state.profile, level: event.target.value } })}><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></select></label>
                  <fieldset className="wide payment-selector"><legend>Medios de pago disponibles</legend><p className="payment-intro">Agregá todos los medios que realmente podés usar. MealBoard buscará beneficios compatibles sin acceder a tus cuentas.</p><div className="payment-add"><PaymentProviderCombobox value={newPayment.bank} onChange={(bank) => { setNewPayment({ ...newPayment, bank }); setPendingUnknownPayment(null); }} /><label>Tipo de medio<select value={newPayment.cardType} onChange={(event) => { setNewPayment({ ...newPayment, cardType: event.target.value as CardType }); setPendingUnknownPayment(null); }}>{argentinaCardTypes.map((cardType) => <option key={cardType}>{cardType}</option>)}</select></label><button className="primary-button payment-add-button" type="button" onClick={addPaymentMethod}>+ Agregar medio</button></div>{pendingUnknownPayment && <div className="unknown-payment-warning" role="alert"><div><strong>Entidad no reconocida</strong><span>“{pendingUnknownPayment.bank}” no está en nuestra lista argentina verificada. Podés corregirla o guardarla sin promociones asociadas.</span></div><button type="button" onClick={() => setPendingUnknownPayment(null)}>Corregir</button><button type="button" onClick={() => savePaymentMethod(pendingUnknownPayment)}>Guardar igualmente</button></div>}<div className="selected-payments-heading"><strong>Medios seleccionados</strong><span>{state.profile.paymentMethods.length}</span></div><div className="payment-chips">{state.profile.paymentMethods.map((payment) => { const verified = validatePaymentProvider(payment.bank).status === "known"; return <button className={verified ? "" : "unverified"} type="button" key={paymentKey(payment)} onClick={() => removePaymentMethod(payment)} aria-label={`Quitar ${payment.cardType} de ${payment.bank}`}><span className="payment-chip-copy"><strong>{payment.bank}</strong><small>{payment.cardType}{!verified && " · No verificada"}</small></span><span aria-hidden="true">×</span></button>; })}</div><small>Seleccioná un chip para quitarlo. Las entidades no reconocidas requieren confirmación y no reciben promociones.</small></fieldset>
                  <label>Comidas e ingredientes preferidos<input value={state.profile.likes} onChange={(event) => setState({ ...state, profile: { ...state.profile, likes: event.target.value } })} /></label>
                  <label>Comidas que no te gustan<input value={state.profile.dislikes} onChange={(event) => setState({ ...state, profile: { ...state.profile, dislikes: event.target.value } })} /></label>
                  <label>Alergias y restricciones<input value={state.profile.allergies} onChange={(event) => setState({ ...state, profile: { ...state.profile, allergies: event.target.value } })} /></label>
                  <label className="wide">Electrodomésticos<input value={state.profile.appliances} onChange={(event) => setState({ ...state, profile: { ...state.profile, appliances: event.target.value } })} /></label>
                  <fieldset className="wide meal-selector"><legend>¿Qué comidas querés planificar?</legend>{slotDefinitions.map((slot) => <label key={slot.id}><input type="checkbox" checked={state.profile.plannedMeals.includes(slot.id)} onChange={(event) => { const plannedMeals = event.target.checked ? [...state.profile.plannedMeals, slot.id] : state.profile.plannedMeals.filter((item) => item !== slot.id); if (plannedMeals.length) setState({ ...state, profile: { ...state.profile, plannedMeals } }); }} />{slot.label}</label>)}</fieldset>
                  <label className="toggle wide"><input type="checkbox" checked={state.profile.nutrition} onChange={(event) => setState({ ...state, profile: { ...state.profile, nutrition: event.target.checked } })} /><span />Incluir recomendaciones nutricionales opcionales</label>
                </div>
                <div className="form-actions"><button className="secondary-button" type="button" onClick={() => { localStorage.removeItem(MEALBOARD_STORAGE_KEY); setState(initialState); notify("Datos de demostración restablecidos"); }}>Restablecer demo</button><button className="primary-button" type="submit">Guardar cambios</button></div>
              </form>
              <section className="content-panel memory-panel">
                <div className="panel-heading"><div><p className="eyebrow">MEMORIA PERSISTENTE</p><h2>Historial y control</h2></div><span className="memory-count">{state.memory.length} datos</span></div>
                <div className="memory-list">
                  {state.memory.slice().reverse().map((record) => (
                    <article key={record.id}><div><small>{record.kind} · {record.createdAt}</small><p>{record.text}</p></div><div><button type="button" onClick={() => { setMemoryDraft(record); setModal("memory-edit"); }}>Corregir</button><button type="button" onClick={() => persist({ ...state, memory: state.memory.filter((item) => item.id !== record.id) })}>Eliminar</button></div></article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </section>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navItems.map((item) => (
          <button key={item.id} type="button" className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}>
            <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </nav>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !planning) setModal(null); }}>
          <section className={["plan", "agents", "community"].includes(modal) ? "modal modal-wide" : "modal"} role="dialog" aria-modal="true" aria-label="Ventana de MealBoard">
            <button className="modal-close" type="button" onClick={() => setModal(null)} aria-label="Cerrar">×</button>

            {modal === "plan" && (
              planning
                ? <div className="planning"><span className="agent-loader">M</span><p className="eyebrow">ORQUESTACIÓN AGÉNTICA</p><h2>Nueve agentes están trabajando…</h2><div className="cycle-line"><span>Captura</span><span>Memoria</span><span>Análisis</span><span>Comunidad</span><span>Plan</span><span>Recetas</span><span>Beneficios</span><span>Compras</span><span>Evaluación</span></div></div>
                : pendingPlan && <>
                  <p className="eyebrow">PLAN LISTO PARA CONFIRMAR</p><h2>Tu nueva semana</h2><p>{pendingPlan.summary}</p>
                  <div className="plan-summary"><span>{state.profile.plannedMeals.length * 7} comidas</span><span>{money(pendingPlan.estimatedCost)} de compra</span><span>{money(pendingPlan.estimatedSaving)} de ahorro</span></div>
                  <div className="agent-run-list">{pendingPlan.agentRun.map((run, index) => <article key={run.id}><span>{index + 1}</span><div><strong>{run.name}</strong><small>{run.role}</small><p><b>Observó:</b> {run.observation}</p><p><b>Decidió:</b> {run.decision}</p><p><b>Entregó:</b> {run.output}</p></div><em>✓</em></article>)}</div>
                  {pendingPlan.warnings.length > 0 && <div className="warning-note">{pendingPlan.warnings.join(" ")}</div>}
                  {pendingPlan.estimatedCost > state.profile.budget && <div className="budget-warning">El plan supera tu presupuesto. Podés cancelar, bajar el presupuesto del perfil o confirmarlo de todos modos.</div>}
                  <div className="mode-note">✓ Ejecutado por 9 agentes independientes. Solo el agente de beneficios consulta fuentes públicas oficiales. Ningún cambio importante se aplica sin tu confirmación.</div>
                  <div className="modal-actions"><button className="secondary-button" onClick={() => setModal(null)} type="button">Cancelar</button><button className="primary-button" onClick={confirmPlan} type="button">{pendingPlan.estimatedCost > state.profile.budget ? "Confirmar de todos modos" : "Confirmar calendario"}</button></div>
                </>
            )}

            {modal === "recipe" && <>
              <p className="eyebrow">{currentSlotDefinition.label.toUpperCase()} · {state.week.find((day) => day.id === selectedMealContext.dayId)?.day.toUpperCase()}</p>
              <h2>{selectedRecipeName || "Espacio libre"}</h2>
              <div className="recipe-meta"><span>◷ {selectedRecipe?.minutes ?? "15–45"} min</span><span>◇ {selectedRecipe?.difficulty ?? "Adaptada"}</span><span>♧ 1 porción</span></div>
              <ol className="recipe-steps">{(state.recipeGuides[selectedRecipeName] ?? [
                `Prepará ${selectedRecipe?.ingredients.slice(0, 4).join(", ") || "los ingredientes indicados"}.`,
                `Cociná usando ${selectedRecipe?.appliances.join(" y ") || "una preparación simple"} y controlá el punto.`,
                "Serví una porción y guardá el sobrante de forma segura.",
              ]).map((step) => <li key={step}>{step}</li>)}</ol>
              {state.profile.nutrition && <div className="nutrition-note">Recomendación opcional: acompañá con agua y ajustá la porción a tu nivel de hambre. Esto no reemplaza consejo profesional.</div>}
              <div className="safety-note">✓ Validada según alergias, alimentos vencidos y electrodomésticos disponibles.</div>
              <div className="modal-actions wrap"><button className="secondary-button" type="button" onClick={() => { setMissedDraft({ reason: "Me faltó tiempo", targetDay: state.week.find((day) => day.id !== selectedMealContext.dayId)?.id ?? "mar", reschedule: true }); setModal("missed"); }}>No la cociné</button><button className="primary-button" type="button" onClick={openMealEdit}>Cambiar comida</button></div>
            </>}

            {modal === "meal-edit" && <form onSubmit={confirmMealEdit}><p className="eyebrow">CAMBIO CON CONFIRMACIÓN</p><h2>Elegí otra comida</h2><p>Solo mostramos recetas compatibles con este momento del día.</p><label>Reemplazo<select value={mealReplacement} onChange={(event) => setMealReplacement(event.target.value)}>{recipeCatalog.filter((recipe) => recipe.mealTypes.includes(selectedMealContext.slot)).map((recipe) => <option key={recipe.id}>{recipe.name}</option>)}</select></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal("recipe")}>Volver</button><button className="primary-button" type="submit">Confirmar cambio</button></div></form>}

            {modal === "missed" && <form onSubmit={recordMissedMeal}><p className="eyebrow">APRENDIZAJE SIN SUPOSICIONES</p><h2>¿Por qué no la cocinaste?</h2><label>Motivo<select value={missedDraft.reason} onChange={(event) => setMissedDraft({ ...missedDraft, reason: event.target.value })}><option>Me faltó tiempo</option><option>No tenía un ingrediente</option><option>No tenía ganas de cocinar</option><option>Pedí delivery</option><option>No me gustó la receta</option></select></label><label className="check-line"><input type="checkbox" checked={missedDraft.reschedule} onChange={(event) => setMissedDraft({ ...missedDraft, reschedule: event.target.checked })} />Proponerla para otro día</label>{missedDraft.reschedule && <label>Mover a<select value={missedDraft.targetDay} onChange={(event) => setMissedDraft({ ...missedDraft, targetDay: event.target.value })}>{state.week.filter((day) => day.id !== selectedMealContext.dayId).map((day) => <option value={day.id} key={day.id}>{day.day}</option>)}</select></label>}<div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal("recipe")}>Cancelar</button><button className="primary-button" type="submit">Confirmar</button></div></form>}

            {modal === "feedback" && <form onSubmit={submitReview}><p className="eyebrow">EVALUACIÓN SEMANAL</p><h2>¿Cómo te fue?</h2><p>La memoria usa estos datos en el próximo ciclo.</p><div className="form-grid"><label>Comidas que preparaste<input type="number" min="0" max="28" value={reviewDraft.prepared} onChange={(event) => setReviewDraft({ ...reviewDraft, prepared: event.target.value })} /></label><label>Cuánto gastaste<input type="number" value={reviewDraft.spent} onChange={(event) => setReviewDraft({ ...reviewDraft, spent: event.target.value })} placeholder="$" /></label><label>Plato que más te gustó<input value={reviewDraft.liked} onChange={(event) => setReviewDraft({ ...reviewDraft, liked: event.target.value })} placeholder="Ej. Tarta de espinaca" /></label><label>¿Fue fácil de cumplir?<select value={reviewDraft.easy} onChange={(event) => setReviewDraft({ ...reviewDraft, easy: event.target.value })}><option>Sí</option><option>Más o menos</option><option>No</option></select></label><label className="wide">Resultado principal<select value={reviewDraft.reason} onChange={(event) => setReviewDraft({ ...reviewDraft, reason: event.target.value })}><option>Cumplí casi todo</option><option>Gasté menos</option><option>Me faltó tiempo</option><option>No me gustó un plato</option><option>Desaproveché ingredientes</option></select></label><label className="check-line wide"><input type="checkbox" checked={reviewDraft.discountUsed} onChange={(event) => setReviewDraft({ ...reviewDraft, discountUsed: event.target.checked })} />Aproveché el descuento recomendado</label></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="submit">Guardar evaluación</button></div></form>}

            {modal === "notice" && <><p className="eyebrow">ALERTAS INTELIGENTES</p><h2>Tenés {notifications.length} novedades</h2><div className="notice-list">{notifications.map((notice) => <div key={notice.title}><span>{notice.icon}</span><p><strong>{notice.title}</strong><small>{notice.detail}</small></p></div>)}</div></>}

            {modal === "agents" && <><p className="eyebrow">ARQUITECTURA EN EJECUCIÓN</p><h2>Agentes integrados</h2><p>Cada módulo decide sobre un aspecto y entrega un estado estructurado al orquestador.</p><div className="agent-registry">{agentRegistry.map((agent, index) => <article key={agent.id}><span>{index + 1}</span><div><strong>{agent.name}</strong><small>{agent.role}</small></div><em>Activo</em></article>)}</div><div className="mode-note">La memoria queda guardada en el navegador y se vuelve a consultar en cada planificación.</div></>}

            {modal === "community" && selectedCommunity && <>
              <p className="eyebrow">{selectedCommunity.creator.toUpperCase()}</p><h2>{selectedCommunity.title}</h2><p>{selectedCommunity.description}</p>
              <div className="community-detail-stats"><span>★ {selectedCommunity.rating.toFixed(1)} ({selectedCommunity.ratings})</span><span>♥ {selectedCommunity.saves.toLocaleString("es-AR")}</span><span>{selectedCommunity.comments.length} comentarios</span></div>
              <div className="rating-row"><span>Tu puntuación:</span>{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} onClick={() => rateCalendar(rating)}>★</button>)}</div>
              <div className="comment-list">{selectedCommunity.comments.map((comment) => <div key={comment.id}><strong>{comment.author}</strong><p>{comment.text}</p></div>)}</div>
              <form className="comment-form" onSubmit={submitComment}><input value={communityComment} onChange={(event) => setCommunityComment(event.target.value)} placeholder="Escribí un comentario" aria-label="Comentario" /><button className="secondary-button" type="submit">Comentar</button></form>
              <div className="modal-actions split"><button className="report-button" type="button" onClick={reportCalendar}>Reportar contenido</button><div><button className="secondary-button" type="button" onClick={() => saveCalendar(selectedCommunity.id)}>{selectedCommunity.favorite ? "Quitar favorito" : "Guardar"}</button><button className="primary-button" type="button" onClick={() => generatePlan(selectedCommunity.title, true)}>Adaptar y republicar</button></div></div>
            </>}

            {modal === "publish" && <form onSubmit={(event) => { event.preventDefault(); persist(publishCalendar(state)); setModal(null); notify("Calendario publicado tras la revisión automática"); }}><p className="eyebrow">PUBLICAR EN LA COMUNIDAD</p><h2>Compartí tu semana</h2><p>Antes de publicarse, el agente evaluador revisa restricciones, vencimientos y contenido.</p><label>Título del calendario<input value={publishTitle} onChange={(event) => setPublishTitle(event.target.value)} required /></label><div className="publish-checks"><span>✓ Sin alimentos vencidos</span><span>✓ Compatible con tu perfil</span><span>✓ {state.profile.plannedMeals.length * 7} comidas incluidas</span></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="submit">Revisar y publicar</button></div></form>}

            {modal === "scan" && <><p className="eyebrow">RECONOCIMIENTO DE {scanMode.toUpperCase()}</p><h2>Confirmá los productos</h2><p>El reconocimiento es de demostración y nunca agrega productos sin tu confirmación.</p><div className="scan-list">{scanCandidates.map((item) => <div key={item.id}><strong>{item.name}</strong><span>{item.amount}</span><b>{money(item.price)}</b></div>)}</div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="button" onClick={confirmScan}>Agregar {scanCandidates.length} productos</button></div></>}

            {modal === "inventory-edit" && inventoryDraft && <form onSubmit={saveInventoryEdit}><p className="eyebrow">CORREGIR INVENTARIO</p><h2>{inventoryDraft.name}</h2><div className="form-grid"><label>Producto<input value={inventoryDraft.name} onChange={(event) => setInventoryDraft({ ...inventoryDraft, name: event.target.value })} /></label><label>Cantidad<input value={inventoryDraft.amount} onChange={(event) => setInventoryDraft({ ...inventoryDraft, amount: event.target.value })} /></label><label>Precio pagado<input type="number" value={inventoryDraft.price} onChange={(event) => setInventoryDraft({ ...inventoryDraft, price: Number(event.target.value) })} /></label><label>Vencimiento aproximado<input value={inventoryDraft.expiry} onChange={(event) => setInventoryDraft({ ...inventoryDraft, expiry: event.target.value })} /></label><label>Fecha de compra<input type="date" value={inventoryDraft.purchaseDate} onChange={(event) => setInventoryDraft({ ...inventoryDraft, purchaseDate: event.target.value })} /></label><label>Fecha de vencimiento<input type="date" value={inventoryDraft.expiryDate} onChange={(event) => setInventoryDraft({ ...inventoryDraft, expiryDate: event.target.value })} /></label></div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="submit">Guardar corrección</button></div></form>}

            {modal === "memory-edit" && memoryDraft && <form onSubmit={saveMemoryEdit}><p className="eyebrow">CONTROL DE MEMORIA</p><h2>Corregir dato aprendido</h2><label>Tipo<select value={memoryDraft.kind} onChange={(event) => setMemoryDraft({ ...memoryDraft, kind: event.target.value })}><option>Preferencia</option><option>Gusto</option><option>Motivo</option><option>Evaluación</option><option>Compra</option><option>Decisión agéntica</option></select></label><label>Dato aprendido<textarea value={memoryDraft.text} onChange={(event) => setMemoryDraft({ ...memoryDraft, text: event.target.value })} /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="submit">Guardar corrección</button></div></form>}
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </main>
  );
}
