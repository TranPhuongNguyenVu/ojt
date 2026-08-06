export const MIN_FORMAT_RATIO = 1;
export const MAX_FORMAT_RATIO = 20;

/**
 * Classifies each version of a movie into either:
 *   - "ratio"  : 2D/3D-style — the version shares a room with at least one other version,
 *                so a numeric ratio between them makes sense.
 *   - "toggle" : 4DX/IMAX-style — the version only appears in rooms that support exactly
 *                that one format, so a simple ON/OFF checkbox is enough.
 *
 * @param {Object}   movie         - movie object with a `versions` array
 * @param {Object[]} selectedRooms - rooms currently selected in the form (each has a `formats` array)
 * @returns {{ ratioVersionIds: Set<number>, toggleVersionIds: Set<number> }}
 */
export const classifyVersions = (movie, selectedRooms) => {
  const versions = movie?.versions || [];
  const ratioVersionIds = new Set();
  const toggleVersionIds = new Set();

  versions.forEach((v) => {
    // Rooms (among the selected ones) that support this version
    const supportingRooms = selectedRooms.filter((room) =>
      room.formats?.some((f) => f.versionId === v.versionId)
    );

    if (supportingRooms.length === 0) {
      // No selected room supports this version at all — treat as toggle (OFF by default)
      toggleVersionIds.add(v.versionId);
      return;
    }

    // If ANY supporting room also supports another version → this version is "shared" → ratio
    const isShared = supportingRooms.some((room) => (room.formats?.length ?? 0) > 1);
    if (isShared) {
      ratioVersionIds.add(v.versionId);
    } else {
      toggleVersionIds.add(v.versionId);
    }
  });

  return { ratioVersionIds, toggleVersionIds };
};

/**
 * Computes the display weight (percent) for the ratio-group versions only.
 * Toggle-group versions are not included in the output.
 *
 * `formatRatios` is the raw { [versionId]: number } map from settings state.
 * A version is "enabled" when its key is present in the map (regardless of value).
 */
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
