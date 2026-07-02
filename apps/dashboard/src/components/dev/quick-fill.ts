"use client";

if (process.env.NODE_ENV === "production") {
  throw new Error("QuickFill must not be imported in production.");
}

export type QuickFillProfile =
  | "auth-sign-up"
  | "auth-sign-in"
  | "onboarding-workspace";

type QuickFillValues = Record<string, unknown>;

export type QuickFillFormAdapter<
  TValues extends QuickFillValues = QuickFillValues,
> = {
  getValues: () => TValues;
  reset: (values: TValues | QuickFillValues) => void;
  setValue: (
    name: string,
    value: unknown,
    options?: {
      shouldDirty?: boolean;
      shouldTouch?: boolean;
      shouldValidate?: boolean;
    },
  ) => void;
};

function randomId() {
  return Math.random().toString(36).slice(2, 7);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const firstNames = [
  "Amira",
  "Layla",
  "Noor",
  "Yasmin",
  "Mariam",
  "Omar",
  "Khalid",
  "Zayd",
  "Tariq",
  "Samir",
];

const lastNames = [
  "Haddad",
  "Khalil",
  "Nasser",
  "Farouk",
  "Rahman",
  "Malik",
  "Saleh",
  "Karim",
  "Hamdan",
  "Mansour",
];

const businessNames = [
  "Cedar Grove Auto",
  "Atlas MotorWorks",
  "Summit Repairs",
  "Prime Service Co",
  "Sterling Workshop",
  "Harbor Mechanics",
  "Maple Fleet Care",
  "Royal Auto Haus",
  "Silver Garage",
  "Oak Street Motors",
];

type QuickFillSeed = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  businessName: string;
};

function createSeed(): QuickFillSeed {
  const id = randomId();
  const firstName =
    firstNames[Math.floor(Math.random() * firstNames.length)] ?? "Amira";
  const lastName =
    lastNames[Math.floor(Math.random() * lastNames.length)] ?? "Haddad";
  const business =
    businessNames[Math.floor(Math.random() * businessNames.length)] ??
    "Cedar Grove Auto";
  const slug = toSlug(firstName);

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${slug}+${id}@afterservice.test`,
    password: `Afterservice-${id}`,
    businessName: business,
  };
}

export class QuickFill<
  TValues extends QuickFillValues = QuickFillValues,
  TProfile extends QuickFillProfile = QuickFillProfile,
> {
  private readonly seed: QuickFillSeed;

  constructor(private readonly form: QuickFillFormAdapter<TValues>) {
    this.seed = createSeed();
  }

  fill(profile: TProfile) {
    switch (profile) {
      case "auth-sign-up":
        return this.authSignUp();
      case "auth-sign-in":
        return this.authSignIn();
      case "onboarding-workspace":
        return this.onboardingWorkspace();
      default:
        break;
    }
  }

  authSignUp() {
    this.merge({
      name: this.seed.fullName,
      email: this.seed.email,
      password: this.seed.password,
    });
  }

  authSignIn(values?: { email?: string; password?: string }) {
    this.merge({
      email: values?.email ?? this.seed.email,
      password: values?.password ?? this.seed.password,
    });
  }

  onboardingWorkspace() {
    this.merge({
      businessName: this.seed.businessName,
      businessType: "auto-service",
      serviceCategory: "vehicle-maintenance",
      defaultFollowUpDelayDays: "7",
    });
  }

  private merge(values: QuickFillValues) {
    this.form.reset({
      ...(this.form.getValues() as QuickFillValues),
      ...values,
    });
  }
}

export function runQuickFill<
  TValues extends QuickFillValues = QuickFillValues,
  TProfile extends QuickFillProfile = QuickFillProfile,
>(
  form: QuickFillFormAdapter<TValues>,
  profile: TProfile,
  overrides?: Partial<QuickFillValues>,
) {
  const qf = new QuickFill<TValues, TProfile>(form);
  qf.fill(profile);
  if (overrides) {
    form.reset({
      ...(form.getValues() as QuickFillValues),
      ...overrides,
    });
  }
}
