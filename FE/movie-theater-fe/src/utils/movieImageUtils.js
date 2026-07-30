import posterImg from '../assets/imgs/Vidu_Film.jpeg';

/** Ảnh mẫu trong DB seed (tên file, chưa phải URL). */
const SEED_SMALL_IMAGES = {
  'small1.jpg': 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
  'small2.jpg': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
  'small3.jpg': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80',
  'small4.jpg': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
  'small5.jpg': 'https://images.unsplash.com/photo-1460889418202-14ebd473d78c?w=500&auto=format&fit=crop&q=80',
};

const SEED_LARGE_IMAGES = {
  'large1.jpg': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
  'large2.jpg': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
  'large3.jpg': 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80',
  'large4.jpg': 'https://images.unsplash.com/photo-1505635339356-d7b6d926b245?w=1200&auto=format&fit=crop&q=80',
  'large5.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
};

const normalizeImageUrl = (image) => {
  if (!image || (!image.startsWith('http://') && !image.startsWith('https://'))) {
    return image;
  }
  return image.replace('/media/catalog_product/', '/media/catalog/product/');
};

const resolveImage = (image, seedMap) => {
  if (!image) return null;

  const normalized = normalizeImageUrl(image);
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return seedMap[image] || null;
};

const getMovieFields = (imageOrMovie) => {
  if (!imageOrMovie) {
    return { smallImage: null, largeImage: null };
  }
  if (typeof imageOrMovie === 'object') {
    return {
      smallImage: imageOrMovie.smallImage || null,
      largeImage: imageOrMovie.largeImage || null,
    };
  }
  return { smallImage: imageOrMovie, largeImage: null };
};

/**
 * Danh sách URL ảnh theo thứ tự ưu tiên (dùng cho onError fallback).
 */
export const getMovieImageCandidates = (imageOrMovie, fallback = posterImg) => {
  const { smallImage, largeImage } = getMovieFields(imageOrMovie);
  const candidates = [
    resolveImage(smallImage, SEED_SMALL_IMAGES),
    resolveImage(largeImage, SEED_LARGE_IMAGES),
    fallback,
  ].filter(Boolean);

  return [...new Set(candidates)];
};

/**
 * Lấy URL poster phim từ DB.
 * @param {string|{ smallImage?: string, largeImage?: string }} imageOrMovie
 */
export const getMovieImageUrl = (imageOrMovie, fallback = posterImg) => {
  return getMovieImageCandidates(imageOrMovie, fallback)[0] || fallback;
};

export const getMovieBannerUrl = (imageOrMovie, fallback = posterImg) => {
  if (!imageOrMovie) return fallback;

  const { smallImage, largeImage } = getMovieFields(imageOrMovie);

  return (
    resolveImage(largeImage, SEED_LARGE_IMAGES) ||
    resolveImage(smallImage, SEED_SMALL_IMAGES) ||
    fallback
  );
};
