/**
 * Tổng hợp danh sách Type và Version từ toàn bộ phim đã load.
 * Workaround vì không có GET /api/types và GET /api/versions.
 * Chỉ trả về các type/version đã được gán cho ít nhất 1 phim.
 */
export function extractTypeAndVersionOptions(movies) {
  const typeMap = new Map();
  const versionMap = new Map();
  (movies || []).forEach((m) => {
    (m.types || []).forEach((t) => typeMap.set(t.typeId, t.typeName));
    (m.versions || []).forEach((v) => versionMap.set(v.versionId, v.versionName));
  });
  return {
    typeOptions: [...typeMap].map(([typeId, typeName]) => ({ typeId, typeName })),
    versionOptions: [...versionMap].map(([versionId, versionName]) => ({ versionId, versionName })),
  };
}
