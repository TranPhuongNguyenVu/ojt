package org.example.be.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.example.be.dto.ConfirmPaymentRequest;
import org.example.be.dto.VnPayRedirectResponseDTO;
import org.example.be.entity.Invoice;
import org.example.be.service.BookingService;
import org.example.be.util.VnPaySecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/payment/vnpay")
public class VnPayPaymentController {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Autowired
    private BookingService bookingService;

    @PostMapping("/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPayment(@RequestBody ConfirmPaymentRequest request, HttpServletRequest servletRequest) {
        try {
            // 1. Tạo hóa đơn PENDING ở cơ sở dữ liệu và khóa ghế tạm thời
            Invoice invoice = bookingService.createInvoicePending(request);
            Integer invoiceId = invoice.getInvoiceId();
            String orderInfo = "Thanh toan ve xem phim qua VNPay - Hoa don #" + invoiceId;

            String url = buildPaymentUrl(invoiceId, invoice.getTotalMoney(), orderInfo, servletRequest);

            VnPayRedirectResponseDTO dto = VnPayRedirectResponseDTO.builder()
                    .payUrl(url)
                    .invoiceId(invoiceId)
                    .build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage(), "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi tạo link thanh toán VNPay: " + e.getMessage(),
                            "error", "Lỗi tạo link thanh toán VNPay: " + e.getMessage()));
        }
    }

    @PostMapping("/recreate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> recreatePayment(@RequestParam("invoiceId") Integer invoiceId, HttpServletRequest servletRequest) {
        try {
            // 1. Lấy hóa đơn và kiểm tra sở hữu của khách hàng đang đăng nhập
            Invoice invoice = bookingService.getPendingInvoiceForCurrentUser(invoiceId);
            String orderInfo = "Thanh toan lai ve xem phim qua VNPay - Hoa don #" + invoiceId;

            String url = buildPaymentUrl(invoiceId, invoice.getTotalMoney(), orderInfo, servletRequest);

            return ResponseEntity.ok(Map.of("payUrl", url, "invoiceId", invoiceId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/verify-return")
    public ResponseEntity<?> verifyReturn(@RequestParam Map<String, String> params) {
        try {
            String receivedHash = params.get("vnp_SecureHash");
            Map<String, String> filteredParams = new HashMap<>(params);
            filteredParams.remove("vnp_SecureHash");
            filteredParams.remove("vnp_SecureHashType");

            String hashData = buildHashData(filteredParams);
            String computedHash = VnPaySecurity.hmacSHA512(hashData, hashSecret);

            if (receivedHash == null || !computedHash.equalsIgnoreCase(receivedHash)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Chữ ký không hợp lệ"));
            }

            String txnRef = params.get("vnp_TxnRef");
            Integer invoiceId = Integer.parseInt(txnRef.split("-")[1]);
            String responseCode = params.get("vnp_ResponseCode");
            String transactionNo = params.get("vnp_TransactionNo");
            BigDecimal amount = new BigDecimal(params.get("vnp_Amount")).divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);

            if ("00".equals(responseCode)) {
                bookingService.completeVnPayPayment(invoiceId, transactionNo, amount.doubleValue());
                return ResponseEntity.ok(Map.of("success", true, "invoiceId", invoiceId));
            } else {
                bookingService.failVnPayPayment(invoiceId);
                return ResponseEntity.ok(Map.of("success", false, "invoiceId", invoiceId, "responseCode", responseCode));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    private String buildPaymentUrl(Integer invoiceId, Double amount, String orderInfo, HttpServletRequest servletRequest) {
        String txnRef = "INV-" + invoiceId + "-" + System.currentTimeMillis();

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode);

        BigDecimal vnpAmount = BigDecimal.valueOf(amount).multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP);
        vnpParams.put("vnp_Amount", vnpAmount.toPlainString());
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", servletRequest.getRemoteAddr());

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        vnpParams.put("vnp_CreateDate", formatter.format(cld.getTime()));

        Calendar expire = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        expire.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", formatter.format(expire.getTime()));

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8))
                        .append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                if (itr.hasNext()) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }

        String secureHash = VnPaySecurity.hmacSHA512(hashData.toString(), hashSecret);
        query.append("&vnp_SecureHash=").append(secureHash);

        return payUrl + "?" + query;
    }

    private String buildHashData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                if (itr.hasNext()) hashData.append('&');
            }
        }
        return hashData.toString();
    }
}
