import { CONCESSION_LABELS } from "../../../../constants/labels";

export function validateConcessionForm(itemType, formData) {
  if (!formData.name?.trim()) return CONCESSION_LABELS.validationNameRequired;
  if (formData.enabledSizes.length === 0) return CONCESSION_LABELS.validationPriceRequired;
  for (const size of formData.enabledSizes) {
    const value = formData.priceBySize[size];
    if (!value || Number(value) <= 0) return CONCESSION_LABELS.validationPricePositive;
  }
  if (formData.enabledSizes.includes("NONE") && formData.enabledSizes.length > 1) {
    return CONCESSION_LABELS.validationNoneExclusive;
  }
  if (itemType === "combo") {
    if (!formData.comboFoodItems || formData.comboFoodItems.length === 0) {
      return CONCESSION_LABELS.validationComboNeedsFood;
    }
    if (!formData.comboDrinkItems || formData.comboDrinkItems.length === 0) {
      return CONCESSION_LABELS.validationComboNeedsDrink;
    }
  }
  return null;
}
