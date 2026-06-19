export const MENU_EDITOR_BASIC_FIELDS = [
  "Image",
  "Enter Meal Name",
  "Chinese Name",
  "Category:",
  "Price: $",
] as const;

export const MENU_EDITOR_DETAILS_LABELS = {
  collapsedToggle: "Edit Details",
  expandedToggle: "Hide Details",
  options: "Options:",
  adjustDishRevisionOption: "Adjust Dish Revision Option",
  confirm: "Confirm",
  editDishRevisionCategory: "Edit Dish Revision Category",
  dishReviseCategory: "Dish Revise Category:",
  dishReviseCategoryHint: "default: 'Option' (E.g.: Portion Size)",
  dishReviseDetails: "Dish Revise Details:",
  dishReviseDetailsHint: "E.g.: Big",
  price: "Price: $",
  multiSelect: "Multi-Select",
  timeRangeAvailability: "Time Range Availability:",
} as const;

export function getInitialDishRevisionDraft(): {
  category: string;
  detail: string;
  price: string;
} {
  return {
    category: "",
    detail: "",
    price: "",
  };
}

export function getResetDishRevisionDraft(): {
  category: string;
  detail: string;
  price: string;
} {
  return getInitialDishRevisionDraft();
}

export function getNextDishRevisionDraftAfterConfirm(input: {
  category: string;
  preserveCategory: boolean;
}): {
  category: string;
  detail: string;
  price: string;
} {
  return {
    category: input.preserveCategory ? input.category.trim() : "",
    detail: "",
    price: "",
  };
}

type RevisionChoice = {
  id: string;
  name: string;
  priceAdjustment?: number;
};

type RevisionGroup = {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  choices: RevisionChoice[];
};

function normalizeRevisionId(value: string): string {
  return value.trim().replace(/\s+/g, "-") || "Option";
}

export function upsertDishRevisionOption(
  groups: RevisionGroup[],
  input: { category: string; detail: string; price: number }
): RevisionGroup[] {
  const category = input.category.trim() || "Option";
  const detail = input.detail.trim();
  if (!detail) return groups;

  const groupIndex = groups.findIndex((group) => group.name === category);
  if (groupIndex === -1) {
    return [
      ...groups,
      {
        id: normalizeRevisionId(category),
        name: category,
        type: "multi",
        required: false,
        choices: [
          {
            id: `${normalizeRevisionId(category)}-${normalizeRevisionId(detail)}`,
            name: detail,
            priceAdjustment: input.price,
          },
        ],
      },
    ];
  }

  return groups.map((group, index) => {
    if (index !== groupIndex) return group;
    const choiceIndex = group.choices.findIndex((choice) => choice.name === detail);
    if (choiceIndex === -1) {
      return {
        ...group,
        choices: [
          ...group.choices,
          {
            id: `${normalizeRevisionId(category)}-${normalizeRevisionId(detail)}`,
            name: detail,
            priceAdjustment: input.price,
          },
        ],
      };
    }

    return {
      ...group,
      choices: group.choices.map((choice, currentIndex) =>
        currentIndex === choiceIndex
          ? { ...choice, priceAdjustment: input.price }
          : choice
      ),
    };
  });
}

export function toggleDishRevisionMultiSelect(
  groups: RevisionGroup[],
  category: string
): RevisionGroup[] {
  return groups.map((group) =>
    group.name === category
      ? { ...group, type: group.type === "multi" ? "single" : "multi" }
      : group
  );
}

export function deleteDishRevisionOption(
  groups: RevisionGroup[],
  category: string,
  detail: string
): RevisionGroup[] {
  return groups
    .map((group) =>
      group.name === category
        ? {
            ...group,
            choices: group.choices.filter((choice) => choice.name !== detail),
          }
        : group
    )
    .filter((group) => group.choices.length > 0);
}
