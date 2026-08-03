package org.example.be.controller;

import org.example.be.dto.ConfirmPaymentRequest;
import org.example.be.dto.MomoIPNRequestDTO;
import org.example.be.dto.MomoRedirectResponseDTO;
import org.example.be.entity.Invoice;
import org.example.be.service.BookingService;
import org.example.be.util.MomoSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/momo")
@CrossOrigin(origins = "*")
public class MomoPaymentController {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.endpoint}")
    private String endpoint;

    @Value("${momo.redirect-url}")
    private String redirectUrl;

    @Value("${momo.ipn-url}")
    private String ipnUrl;

    @Autowired
    private BookingService bookingService;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody ConfirmPaymentRequest request) {
        try {
            // 1. Tạo hóa đơn PENDING ở cơ sở dữ liệu và khóa ghế tạm thời
            Invoice invoice = bookingService.createInvoicePending(request);
            Integer invoiceId = invoice.getInvoiceId();
            long amount = Math.round(invoice.getTotalMoney());

            // 2. Thiết lập orderId và requestId duy nhất của giao dịch MoMo
            String orderId = "INV-" + invoiceId + "-" + System.currentTimeMillis();
            String requestId = "REQ-" + invoiceId + "-" + System.currentTimeMillis();
            String orderInfo = "Thanh toan ve xem phim qua MoMo - Hoa don #" + invoiceId;
            String extraData = ""; // Có thể gửi thông tin phụ nếu cần
            String requestType = "payWithMethod";

            // 3. Xây dựng chuỗi hash thô (raw hash) theo quy chuẩn MoMo v2
            String rawHash = "accessKey=" + accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + ipnUrl +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + partnerCode +
                    "&redirectUrl=" + redirectUrl +
                    "&requestId=" + requestId +
                    "&requestType=" + requestType;

            System.out.println("MoMo Raw Hash: " + rawHash);

            // 4. Ký số HMAC-SHA256
            String signature = MomoSecurity.signHmacSHA256(rawHash, secretKey);
            System.out.println("MoMo Signature: " + signature);

            // 5. Chuẩn bị payload JSON gửi tới MoMo
            Map<String, Object> payload = new HashMap<>();
            payload.put("partnerCode", partnerCode);
            payload.put("accessKey", accessKey);
            payload.put("partnerName", "Cinema Elite");
            payload.put("storeId", "CinemaEliteStore");
            payload.put("requestId", requestId);
            payload.put("amount", amount);
            payload.put("orderId", orderId);
            payload.put("orderInfo", orderInfo);
            payload.put("redirectUrl", redirectUrl);
            payload.put("ipnUrl", ipnUrl);
            payload.put("lang", "vi");
            payload.put("extraData", extraData);
            payload.put("requestType", requestType);
            payload.put("orderExpireTime", 30);
            payload.put("signature", signature);

            // 6. Gửi request POST tới MoMo Sandbox API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("payUrl")) {
                String payUrl = (String) responseBody.get("payUrl");
                MomoRedirectResponseDTO dto = MomoRedirectResponseDTO.builder()
                        .payUrl(payUrl)
                        .invoiceId(invoiceId)
                        .build();
                return ResponseEntity.ok(dto);
            } else {
                String message = responseBody != null && responseBody.containsKey("message") 
                        ? (String) responseBody.get("message") 
                        : "Lỗi không xác định từ MoMo API";
                // Đánh dấu hóa đơn thất bại nếu không tạo được link thanh toán
                bookingService.failMomoPayment(invoiceId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", message));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo link thanh toán MoMo: " + e.getMessage()));
        }
    }

    @PostMapping("/ipn")
    public ResponseEntity<Void> receiveIPN(@RequestBody MomoIPNRequestDTO ipn) {
        try {
            System.out.println("Nhận thông báo IPN MoMo: " + ipn);

            // 1. Xác thực chữ ký số từ MoMo để chống gian lận dữ liệu
            String rawHash = "accessKey=" + accessKey +
                    "&amount=" + ipn.getAmount() +
                    "&extraData=" + (ipn.getExtraData() != null ? ipn.getExtraData() : "") +
                    "&message=" + (ipn.getMessage() != null ? ipn.getMessage() : "") +
                    "&orderId=" + ipn.getOrderId() +
                    "&orderInfo=" + (ipn.getOrderInfo() != null ? ipn.getOrderInfo() : "") +
                    "&orderType=" + (ipn.getOrderType() != null ? ipn.getOrderType() : "") +
                    "&partnerCode=" + ipn.getPartnerCode() +
                    "&payType=" + (ipn.getPayType() != null ? ipn.getPayType() : "") +
                    "&requestId=" + ipn.getRequestId() +
                    "&responseTime=" + ipn.getResponseTime() +
                    "&resultCode=" + ipn.getResultCode() +
                    "&transId=" + ipn.getTransId();

            String expectedSignature = MomoSecurity.signHmacSHA256(rawHash, secretKey);

            if (!expectedSignature.equals(ipn.getSignature())) {
                System.err.println("Chữ ký IPN MoMo KHÔNG HỢP LỆ! Bỏ qua cập nhật.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // 2. Trích xuất invoiceId từ orderId
            String[] parts = ipn.getOrderId().split("-");
            Integer invoiceId = Integer.parseInt(parts[1]);

            // 3. Xử lý cập nhật vé tùy theo resultCode
            if (ipn.getResultCode() == 0) {
                // Thành công
                bookingService.completeMomoPayment(invoiceId, ipn.getTransId().toString(), ipn.getAmount().doubleValue());
                System.out.println("IPN MoMo: Thanh toán hóa đơn #" + invoiceId + " THÀNH CÔNG.");
            } else {
                // Thất bại
                bookingService.failMomoPayment(invoiceId);
                System.out.println("IPN MoMo: Thanh toán hóa đơn #" + invoiceId + " THẤT BẠI (Code: " + ipn.getResultCode() + ")");
            }

            // 4. Trả về HTTP 204 No Content cho MoMo trong vòng 15 giây theo tiêu chuẩn MoMo
            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            System.err.println("Lỗi xử lý IPN MoMo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/verify-redirect")
    public ResponseEntity<?> verifyRedirect(
            @RequestParam("resultCode") Integer resultCode,
            @RequestParam("orderId") String orderId,
            @RequestParam(value = "transId", required = false) String transId,
            @RequestParam(value = "amount", required = false) Double amount) {
        try {
            if (orderId == null || !orderId.contains("-")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid orderId format"));
            }
            // Trích xuất invoiceId
            String[] parts = orderId.split("-");
            Integer invoiceId = Integer.parseInt(parts[1]);

            if (resultCode != null && resultCode == 0) {
                // Đảm bảo cập nhật trạng thái trong trường hợp IPN đến chậm hơn redirect của client
                bookingService.completeMomoPayment(invoiceId, transId != null ? transId : "MOMO-TRANS", amount != null ? amount : 0.0);
                return ResponseEntity.ok(Map.of("success", true, "invoiceId", invoiceId));
            } else {
                bookingService.failMomoPayment(invoiceId);
                return ResponseEntity.ok(Map.of("success", false, "invoiceId", invoiceId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/recreate")
    public ResponseEntity<?> recreatePayment(@RequestParam("invoiceId") Integer invoiceId) {
        try {
            // 1. Lấy hóa đơn và kiểm tra sở hữu của khách hàng đang đăng nhập
            Invoice invoice = bookingService.getPendingInvoiceForCurrentUser(invoiceId);
            long amount = Math.round(invoice.getTotalMoney());

            // 2. Thiết lập orderId và requestId duy nhất mới của giao dịch MoMo
            String orderId = "INV-" + invoiceId + "-" + System.currentTimeMillis();
            String requestId = "REQ-" + invoiceId + "-" + System.currentTimeMillis();
            String orderInfo = "Thanh toan lai ve xem phim qua MoMo - Hoa don #" + invoiceId;
            String extraData = ""; // Có thể gửi thông tin phụ nếu cần
            String requestType = "payWithMethod";

            // 3. Xây dựng chuỗi hash thô (raw hash) theo quy chuẩn MoMo
            String rawHash = "accessKey=" + accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + ipnUrl +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + partnerCode +
                    "&redirectUrl=" + redirectUrl +
                    "&requestId=" + requestId +
                    "&requestType=" + requestType;

            System.out.println("MoMo Recreate Raw Hash: " + rawHash);

            // 4. Ký số HMAC-SHA256
            String signature = MomoSecurity.signHmacSHA256(rawHash, secretKey);
            System.out.println("MoMo Recreate Signature: " + signature);

            // 5. Chuẩn bị payload JSON gửi tới MoMo
            Map<String, Object> payload = new HashMap<>();
            payload.put("partnerCode", partnerCode);
            payload.put("accessKey", accessKey);
            payload.put("partnerName", "Cinema Elite");
            payload.put("storeId", "CinemaEliteStore");
            payload.put("requestId", requestId);
            payload.put("amount", amount);
            payload.put("orderId", orderId);
            payload.put("orderInfo", orderInfo);
            payload.put("redirectUrl", redirectUrl);
            payload.put("ipnUrl", ipnUrl);
            payload.put("lang", "vi");
            payload.put("extraData", extraData);
            payload.put("requestType", requestType);
            payload.put("orderExpireTime", 30);
            payload.put("signature", signature);

            // 6. Gửi request POST tới MoMo Sandbox API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            System.out.println("MoMo Recreate Response: " + responseBody);

            if (responseBody != null && responseBody.containsKey("payUrl")) {
                String payUrl = (String) responseBody.get("payUrl");
                return ResponseEntity.ok(Map.of("payUrl", payUrl, "invoiceId", invoiceId));
            } else {
                String message = responseBody != null && responseBody.containsKey("message")
                        ? (String) responseBody.get("message")
                        : "Không nhận được payUrl từ MoMo.";
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Lỗi tạo link thanh toán MoMo: " + message));
            }

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }
}
