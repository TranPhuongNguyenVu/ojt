export const MIN_FORMAT_RATIO = 1;
export const MAX_FORMAT_RATIO = 20;

export const computeFormatWeights = (movie, formatRatios) => {
  const versions = movie?.versions || [];
  const enabledVersions = formatRatios
    ? versions.filter((v) => Object.prototype.hasOwnProperty.call(formatRatios, String(v.versionId)))
    : [];
  if (enabledVersions.length === 0) {
    const first = [...versions].sort((a, b) => a.versionId - b.versionId)[0];
    return first ? [{ versionId: first.versionId, versionName: first.versionName, percent: 100 }] : [];
  }
  const ratioOf = (v) => formatRatios[String(v.versionId)] ?? MIN_FORMAT_RATIO;
  const sum = enabledVersions.reduce((s, v) => s + ratioOf(v), 0) || 1;
  return enabledVersions.map((v) => ({
    versionId: v.versionId,
    versionName: v.versionName,
    percent: (ratioOf(v) / sum) * 100,
  }));
};
