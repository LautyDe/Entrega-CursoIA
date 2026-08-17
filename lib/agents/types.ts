export type IngredientInput = {
  id?: number;
  name: string;
  amount: string;
  expiry: string;
  price?: number;
};

export type ProfileInput = {
  name?: string;
  budget: number;
  level: string;
  likes?: string;
  dislikes: string;
  allergies: string;
  appliances: string;
  paymentBank: string;
  paymentCardType: CardType;
  paymentMethods?: PaymentMethod[];
  nutrition?: boolean;
};

export type PromotionInput = {
  day: string;
  store: string;
  bank: string;
  cardType: CardType;
  sourceUrl?: string;
  verifiedAt?: string;
  validThrough?: string;
  method?: string;
  notes?: string;
  discount: string;
  cap: string;
};

export type PlanRequest = {
  city?: string;
  profile: ProfileInput;
  inventory: IngredientInput[];
  priorFeedback?: string[];
  promotions?: PromotionInput[];
  requestedMeals?: string[];
  preferredCommunityCalendar?: string;
};

export type MealSlot = "breakfast" | "lunch" | "snack" | "dinner";

export type RecipeDefinition = {
  id: string;
  name: string;
  minutes: number;
  difficulty: "Fácil" | "Media";
  estimatedCost: number;
  ingredients: string[];
  appliances: string[];
  tags: string[];
  mealTypes: MealSlot[];
};

export type MealDay = {
  id: string;
  day: string;
  shortDay: string;
  date: number;
  breakfast: string;
  breakfastMeta: string;
  lunch: string;
  lunchMeta: string;
  snack: string;
  snackMeta: string;
  dinner: string;
  dinnerMeta: string;
};

export type ShoppingItem = {
  name: string;
  amount: string;
  price: number;
  checked: boolean;
};

export type AgentRun = {
  id: string;
  name: string;
  role: string;
  status: "completed";
  observation: string;
  decision: string;
  output: string;
};

export type WorkingState = {
  input: PlanRequest;
  inventoryNames: string[];
  urgentIngredients: string[];
  expiredIngredients: string[];
  avoidTerms: string[];
  availableAppliances: string[];
  memorySignals: string[];
  preferredTags: string[];
  communitySource: string;
  candidateRecipes: RecipeDefinition[];
  selectedRecipes: RecipeDefinition[];
  week: MealDay[];
  recipeGuides: Record<string, string[]>;
  shopping: ShoppingItem[];
  estimatedCost: number;
  estimatedSaving: number;
  bestPromotion?: PromotionInput;
  warnings: string[];
  trace: AgentRun[];
};

export type PlanResult = {
  mode: "local-agents";
  summary: string;
  agentTrace: string[];
  agentRun: AgentRun[];
  week: MealDay[];
  shopping: ShoppingItem[];
  recipeGuides: Record<string, string[]>;
  estimatedCost: number;
  estimatedSaving: number;
  communitySource: string;
  warnings: string[];
};

export type AgentDefinition = {
  id: string;
  name: string;
  role: string;
};

export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function addRun(
  state: WorkingState,
  run: Omit<AgentRun, "status">,
): WorkingState {
  return { ...state, trace: [...state.trace, { ...run, status: "completed" }] };
}
import type { CardType, PaymentMethod } from "../payments";
