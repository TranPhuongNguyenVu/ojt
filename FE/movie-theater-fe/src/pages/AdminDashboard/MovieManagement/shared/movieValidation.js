/** Client-side validation for movie form. Returns error string or null. */
export function validateMovieForm(formData) {
  if (!formData.movieNameVn?.trim()) return "Vui lòng nhập tên phim (tiếng Việt).";
  if (!formData.movieNameEnglish?.trim()) return "Vui lòng nhập tên phim (tiếng Anh).";
  if (!formData.duration || Number(formData.duration) <= 0) return "Thời lượng phim phải lớn hơn 0 phút.";
  if (!formData.trailer?.trim()) return "Vui lòng nhập trailer.";
  if (!formData.largeImage?.trim()) return "Vui lòng nhập/tải lên ảnh poster lớn.";
  if (!formData.smallImage?.trim()) return "Vui lòng nhập/tải lên ảnh poster nhỏ.";
  const hasFromDate = Boolean(formData.fromDate);
  const hasToDate = Boolean(formData.toDate);
  if (hasFromDate !== hasToDate)
    return "Vui lòng nhập đủ cả ngày khởi chiếu và ngày kết thúc, hoặc để trống cả hai.";
  if (hasFromDate && hasToDate && formData.toDate < formData.fromDate)
    return "Ngày kết thúc phải sau hoặc bằng ngày khởi chiếu.";
  if (formData.typeIds.length === 0) return "Vui lòng chọn ít nhất một thể loại.";
  if (formData.versionIds.length === 0) return "Vui lòng chọn ít nhất một định dạng.";
  return null;
}
