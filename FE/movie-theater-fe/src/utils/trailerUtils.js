/**
 * Chuyển link YouTube sang URL nhúng iframe.
 * Trả về chuỗi rỗng nếu không phải link YouTube hợp lệ.
 */
export const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';

  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed.split('?')[0];
  }

  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2]?.length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }

  return '';
};

export const hasYoutubeTrailer = (url) => Boolean(getYoutubeEmbedUrl(url));
