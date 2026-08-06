// Mirrors be/util/TextNormalizeUtil.java so client-side matching (e.g. search
// suggestions) behaves the same as the backend search endpoint.
export const stripDiacritics = (input) => {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};
