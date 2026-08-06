-- ============================================================
-- DATABASE TỔNG HỢP - MOVIE THEATER MANAGEMENT SYSTEM
-- ============================================================

-- 0. XÓA BẢNG NẾU ĐÃ TỒN TẠI (để chạy lại không bị lỗi)
DROP TABLE IF EXISTS CONCESSION_PRICE CASCADE;
DROP TABLE IF EXISTS FOOD CASCADE;
DROP TABLE IF EXISTS DRINK CASCADE;
DROP TABLE IF EXISTS COMBO CASCADE;
DROP TABLE IF EXISTS SCORE_TRANSACTION CASCADE;
DROP TABLE IF EXISTS TICKET CASCADE;
DROP TABLE IF EXISTS PAYMENT CASCADE;
DROP TABLE IF EXISTS INVOICE_CONCESSION CASCADE;
DROP TABLE IF EXISTS INVOICE_SEAT CASCADE;
DROP TABLE IF EXISTS PROMOTION_USAGE CASCADE;
DROP TABLE IF EXISTS INVOICE CASCADE;
DROP TABLE IF EXISTS PROMOTION CASCADE;
DROP TABLE IF EXISTS SCHEDULE_SEAT CASCADE;
DROP TABLE IF EXISTS SCHEDULE CASCADE;
DROP TABLE IF EXISTS GOLDEN_HOUR_CONFIG CASCADE;
DROP TABLE IF EXISTS ROOM_FORMAT CASCADE;
DROP TABLE IF EXISTS MOVIE_VERSION CASCADE;
DROP TABLE IF EXISTS VERSION CASCADE;
DROP TABLE IF EXISTS MOVIE_TYPE CASCADE;
DROP TABLE IF EXISTS TYPE CASCADE;
DROP TABLE IF EXISTS SEAT CASCADE;
DROP TABLE IF EXISTS CINEMA_ROOM CASCADE;
DROP TABLE IF EXISTS MOVIE CASCADE;
DROP TABLE IF EXISTS EMPLOYEE CASCADE;
DROP TABLE IF EXISTS MEMBER CASCADE;
DROP TABLE IF EXISTS ACCOUNT CASCADE;
DROP TABLE IF EXISTS ROLE CASCADE;

-- ============================================================
-- 1. PHÂN HỆ NGƯỜI DÙNG & TÀI KHOẢN
-- ============================================================
CREATE TABLE ROLE (
  ROLE_ID SERIAL PRIMARY KEY,
  ROLE_NAME VARCHAR(50) NOT NULL
);

CREATE TABLE ACCOUNT (
  ACCOUNT_ID VARCHAR(36) PRIMARY KEY,
  USERNAME VARCHAR(50) UNIQUE NOT NULL,
  PASSWORD VARCHAR(255) NOT NULL,
  FULL_NAME VARCHAR(255),
  EMAIL VARCHAR(255) UNIQUE,
  PHONE_NUMBER VARCHAR(20) UNIQUE,
  ADDRESS VARCHAR(500),
  DATE_OF_BIRTH DATE,
  GENDER VARCHAR(10),
  IDENTITY_CARD VARCHAR(20) UNIQUE,
  IMAGE VARCHAR(500),
  REGISTER_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  STATUS INT DEFAULT 1,
  ROLE_ID INT NOT NULL,
  CREATED_BY VARCHAR(50),
  CONSTRAINT fk_account_role FOREIGN KEY (ROLE_ID) REFERENCES ROLE(ROLE_ID)
);

CREATE TABLE MEMBER (
  MEMBER_ID VARCHAR(255) PRIMARY KEY,
  ACCOUNT_ID VARCHAR(36) UNIQUE,
  SCORE INT DEFAULT 0,
  CONSTRAINT fk_member_account FOREIGN KEY (ACCOUNT_ID) REFERENCES ACCOUNT(ACCOUNT_ID)
);

CREATE TABLE EMPLOYEE (
  EMPLOYEE_ID VARCHAR(36) PRIMARY KEY,
  ACCOUNT_ID VARCHAR(36) UNIQUE,
  CONSTRAINT fk_employee_account FOREIGN KEY (ACCOUNT_ID) REFERENCES ACCOUNT(ACCOUNT_ID)
);

-- ============================================================
-- 2. PHÂN HỆ QUẢN LÝ PHIM & THỂ LOẠI & PHIÊN BẢN
-- ============================================================
CREATE TABLE TYPE (
  TYPE_ID SERIAL PRIMARY KEY,
  TYPE_NAME VARCHAR(100) UNIQUE NOT NULL
);

-- Giá được quản lý trực tiếp trên VERSION (không còn bảng surcharge riêng):
-- BASE_PRICE = giá vé theo định dạng, VIP_PRICE/COUPLE_PRICE = phụ thu theo loại ghế.
CREATE TABLE VERSION (
  VERSION_ID SERIAL PRIMARY KEY,
  VERSION_NAME VARCHAR(100) UNIQUE NOT NULL,
  BASE_PRICE NUMERIC(38, 2) NOT NULL,
  VIP_PRICE NUMERIC(38, 2) NOT NULL,
  COUPLE_PRICE NUMERIC(38, 2) NOT NULL
);

CREATE TABLE MOVIE (
  MOVIE_ID VARCHAR(36) PRIMARY KEY,
  MOVIE_NAME_ENGLISH VARCHAR(255),
  MOVIE_NAME_VN VARCHAR(255),
  DIRECTOR VARCHAR(255),
  ACTOR VARCHAR(500),
  MOVIE_PRODUCTION_COMPANY VARCHAR(255),
  DURATION INT,
  TRAILER VARCHAR(500),
  FROM_DATE DATE,
  TO_DATE DATE,
  CONTENT TEXT,
  LARGE_IMAGE VARCHAR(500),
  SMALL_IMAGE VARCHAR(500),
  -- STATUS do backend tính/ghi từ FROM_DATE/TO_DATE (MovieStatusResolver + MovieStatusScheduler),
  -- không dùng DEFAULT cố định để tránh sai lệch với ngày chiếu thực tế.
  STATUS VARCHAR(20)
);

CREATE TABLE MOVIE_TYPE (
  MOVIE_ID VARCHAR(36),
  TYPE_ID INT,
  PRIMARY KEY (MOVIE_ID, TYPE_ID),
  CONSTRAINT fk_mt_movie FOREIGN KEY (MOVIE_ID) REFERENCES MOVIE(MOVIE_ID),
  CONSTRAINT fk_mt_type FOREIGN KEY (TYPE_ID) REFERENCES TYPE(TYPE_ID)
);

CREATE TABLE MOVIE_VERSION (
  MOVIE_ID VARCHAR(36),
  VERSION_ID INT,
  PRIMARY KEY (MOVIE_ID, VERSION_ID),
  CONSTRAINT fk_mv_movie FOREIGN KEY (MOVIE_ID) REFERENCES MOVIE(MOVIE_ID),
  CONSTRAINT fk_mv_version FOREIGN KEY (VERSION_ID) REFERENCES VERSION(VERSION_ID)
);

-- ============================================================
-- 3. PHÂN HỆ PHÒNG CHIẾU & GHẾ
-- ============================================================
CREATE TABLE CINEMA_ROOM (
  CINEMA_ROOM_ID SERIAL PRIMARY KEY,
  CINEMA_ROOM_NAME VARCHAR(100) UNIQUE NOT NULL,
  SEAT_QUANTITY INT,
  -- Format được quản lý qua bảng ROOM_FORMAT (M2M).
  STATUS VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
  CONSTRAINT chk_cinema_room_status CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
);

-- Bảng trung gian M2M: một phòng có thể hỗ trợ nhiều format
CREATE TABLE ROOM_FORMAT (
  CINEMA_ROOM_ID INT NOT NULL,
  VERSION_ID INT NOT NULL,
  PRIMARY KEY (CINEMA_ROOM_ID, VERSION_ID),
  CONSTRAINT fk_rf_room FOREIGN KEY (CINEMA_ROOM_ID) REFERENCES CINEMA_ROOM(CINEMA_ROOM_ID),
  CONSTRAINT fk_rf_version FOREIGN KEY (VERSION_ID) REFERENCES VERSION(VERSION_ID)
);

CREATE TABLE SEAT (
  SEAT_ID SERIAL PRIMARY KEY,
  CINEMA_ROOM_ID INT,
  SEAT_COLUMN VARCHAR(5),
  SEAT_ROW INT,
  SEAT_TYPE INT DEFAULT 0,
  PAIR_SEAT_ID INT,
  -- STATUS: ACTIVE = hoạt động, INACTIVE = ngừng hoạt động, AISLE = lối đi
  STATUS VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT fk_seat_room FOREIGN KEY (CINEMA_ROOM_ID) REFERENCES CINEMA_ROOM(CINEMA_ROOM_ID),
  CONSTRAINT fk_seat_pair FOREIGN KEY (PAIR_SEAT_ID) REFERENCES SEAT(SEAT_ID),
  CONSTRAINT chk_seat_status CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'AISLE'))
);

-- ============================================================
-- 4. GIÁ KHUNG GIỜ VÀNG & SUẤT CHIẾU
-- ============================================================
CREATE TABLE GOLDEN_HOUR_CONFIG (
  GOLDEN_HOUR_ID SERIAL PRIMARY KEY,
  START_TIME TIME NOT NULL,
  END_TIME TIME NOT NULL,
  DAYS_OF_WEEK VARCHAR(100) NOT NULL,
  EXTRA_PRICE NUMERIC(38, 2) NOT NULL,
  ACTIVE BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE SCHEDULE (
  SCHEDULE_ID SERIAL PRIMARY KEY,
  MOVIE_ID VARCHAR(255),
  CINEMA_ROOM_ID INT,
  START_TIME TIMESTAMP,
  END_TIME TIMESTAMP,
  BUFFER_TIME INT DEFAULT 30,
  VERSION_ID INT,
  STATUS VARCHAR(20),
  CONSTRAINT fk_schedule_movie FOREIGN KEY (MOVIE_ID) REFERENCES MOVIE(MOVIE_ID),
  CONSTRAINT fk_schedule_room FOREIGN KEY (CINEMA_ROOM_ID) REFERENCES CINEMA_ROOM(CINEMA_ROOM_ID),
  CONSTRAINT fk_schedule_version FOREIGN KEY (VERSION_ID) REFERENCES VERSION(VERSION_ID),
  CONSTRAINT schedule_status_check CHECK (STATUS IN ('SCHEDULED', 'CANCELLED', 'DELETED'))
);

CREATE TABLE SCHEDULE_SEAT (
  SCHEDULE_SEAT_ID SERIAL PRIMARY KEY,
  SCHEDULE_ID INT,
  SEAT_ID INT,
  SEAT_STATUS INT DEFAULT 0,
  RESERVED_AT TIMESTAMP,
  RESERVED_BY VARCHAR(255),
  CONSTRAINT fk_ss_schedule FOREIGN KEY (SCHEDULE_ID) REFERENCES SCHEDULE(SCHEDULE_ID),
  CONSTRAINT fk_ss_seat FOREIGN KEY (SEAT_ID) REFERENCES SEAT(SEAT_ID),
  CONSTRAINT fk_ss_account FOREIGN KEY (RESERVED_BY) REFERENCES ACCOUNT(ACCOUNT_ID),
  CONSTRAINT uq_schedule_seat UNIQUE (SCHEDULE_ID, SEAT_ID)
);

-- ============================================================
-- 5. KHUYẾN MÃI, HOÁ ĐƠN, THANH TOÁN & ĐIỂM THƯỞNG
-- ============================================================
CREATE TABLE PROMOTION (
  PROMOTION_ID SERIAL PRIMARY KEY,
  TITLE VARCHAR(150) NOT NULL,
  CONTENT TEXT,
  DETAIL TEXT,
  START_TIME TIMESTAMP NOT NULL,
  END_TIME TIMESTAMP NOT NULL,
  PROMOTION_VALUE DECIMAL(12, 2) NOT NULL,
  DISCOUNT_TYPE VARCHAR(20) NOT NULL,
  USAGE_LIMIT INT,
  USED_COUNT INT NOT NULL DEFAULT 0,
  IMAGE VARCHAR(500),
  BOOKING_URL VARCHAR(500),
  STATUS VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  APPLICABLE_DAY_OF_WEEK INT,
  APPLICABLE_START_TIME TIME,
  APPLICABLE_END_TIME TIME,
  BIRTHDAY_ONLY BOOLEAN NOT NULL DEFAULT FALSE,
  ALLOW_MULTIPLE_USE_PER_CUSTOMER BOOLEAN NOT NULL DEFAULT TRUE,
  IS_DELETED INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_promotion_time CHECK (START_TIME < END_TIME),
  CONSTRAINT chk_promotion_value CHECK (PROMOTION_VALUE > 0),
  CONSTRAINT chk_promotion_discount_type CHECK (DISCOUNT_TYPE IN ('FIXED', 'PERCENT')),
  CONSTRAINT chk_promotion_percent CHECK (DISCOUNT_TYPE <> 'PERCENT' OR PROMOTION_VALUE <= 100),
  CONSTRAINT chk_promotion_usage_limit CHECK (USAGE_LIMIT IS NULL OR USAGE_LIMIT > 0),
  CONSTRAINT chk_promotion_used_count CHECK (USED_COUNT >= 0),
  CONSTRAINT chk_promotion_status CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'DELETED')),
  CONSTRAINT chk_promotion_day CHECK (APPLICABLE_DAY_OF_WEEK IS NULL OR APPLICABLE_DAY_OF_WEEK BETWEEN 1 AND 7),
  CONSTRAINT chk_promotion_applicable_time_pair CHECK (
    (APPLICABLE_START_TIME IS NULL AND APPLICABLE_END_TIME IS NULL)
    OR (APPLICABLE_START_TIME IS NOT NULL AND APPLICABLE_END_TIME IS NOT NULL)
  ),
  CONSTRAINT chk_promotion_applicable_time_order CHECK (
    APPLICABLE_START_TIME IS NULL OR APPLICABLE_START_TIME < APPLICABLE_END_TIME
  ),
  CONSTRAINT chk_promotion_deleted_flag CHECK (IS_DELETED IN (0, 1))
);

CREATE TABLE INVOICE (
  INVOICE_ID SERIAL PRIMARY KEY,
  ACCOUNT_ID VARCHAR(255),
  SCHEDULE_ID INT,
  PROMOTION_ID INT,
  BOOKING_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  TOTAL_MONEY DOUBLE PRECISION DEFAULT 0,
  ADD_SCORE INT DEFAULT 0,
  USE_SCORE INT DEFAULT 0,
  STATUS INT DEFAULT 0,
  SOLD_BY_ACCOUNT_ID VARCHAR(36),
  CONSTRAINT fk_invoice_account FOREIGN KEY (ACCOUNT_ID) REFERENCES ACCOUNT(ACCOUNT_ID),
  CONSTRAINT fk_invoice_schedule FOREIGN KEY (SCHEDULE_ID) REFERENCES SCHEDULE(SCHEDULE_ID),
  CONSTRAINT fk_invoice_promotion FOREIGN KEY (PROMOTION_ID) REFERENCES PROMOTION(PROMOTION_ID)
);

CREATE TABLE PROMOTION_USAGE (
  PROMOTION_USAGE_ID SERIAL PRIMARY KEY,
  CUSTOMER_ID VARCHAR(36) NOT NULL,
  PROMOTION_ID INT NOT NULL,
  INVOICE_ID INT NOT NULL,
  USED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_promotion_usage_account FOREIGN KEY (CUSTOMER_ID) REFERENCES ACCOUNT(ACCOUNT_ID),
  CONSTRAINT fk_promotion_usage_promotion FOREIGN KEY (PROMOTION_ID) REFERENCES PROMOTION(PROMOTION_ID),
  CONSTRAINT fk_promotion_usage_invoice FOREIGN KEY (INVOICE_ID) REFERENCES INVOICE(INVOICE_ID)
);

CREATE TABLE INVOICE_SEAT (
  INVOICE_SEAT_ID SERIAL PRIMARY KEY,
  INVOICE_ID INT,
  SCHEDULE_SEAT_ID INT,
  PRICE DOUBLE PRECISION,
  CONSTRAINT fk_is_invoice FOREIGN KEY (INVOICE_ID) REFERENCES INVOICE(INVOICE_ID),
  CONSTRAINT fk_is_ss FOREIGN KEY (SCHEDULE_SEAT_ID) REFERENCES SCHEDULE_SEAT(SCHEDULE_SEAT_ID)
);

CREATE TABLE PAYMENT (
  PAYMENT_ID SERIAL PRIMARY KEY,
  INVOICE_ID INT,
  TXN_REF VARCHAR(255),
  PAYMENT_METHOD VARCHAR(255),
  AMOUNT DOUBLE PRECISION,
  PAYMENT_STATUS VARCHAR(255),
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_invoice FOREIGN KEY (INVOICE_ID) REFERENCES INVOICE(INVOICE_ID)
);

CREATE TABLE TICKET (
  TICKET_ID SERIAL PRIMARY KEY,
  INVOICE_ID INT UNIQUE NOT NULL,
  TICKET_CODE VARCHAR(16) UNIQUE NOT NULL,
  STATUS VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
  CREATED_BY VARCHAR(36),
  CHECKED_IN_AT TIMESTAMP,
  CHECKED_IN_BY VARCHAR(36),
  CANCELLED_AT TIMESTAMP,
  CANCELLED_BY VARCHAR(36),
  SCORE_REFUNDED INT DEFAULT 0,
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  EMAIL_SENT_AT TIMESTAMP,
  CONSTRAINT fk_ticket_invoice FOREIGN KEY (INVOICE_ID) REFERENCES INVOICE(INVOICE_ID),
  CONSTRAINT fk_ticket_created_by FOREIGN KEY (CREATED_BY) REFERENCES ACCOUNT(ACCOUNT_ID),
  CONSTRAINT fk_ticket_checked_in_by FOREIGN KEY (CHECKED_IN_BY) REFERENCES ACCOUNT(ACCOUNT_ID),
  CONSTRAINT fk_ticket_cancelled_by FOREIGN KEY (CANCELLED_BY) REFERENCES ACCOUNT(ACCOUNT_ID),
  CONSTRAINT chk_ticket_status CHECK (STATUS IN ('BOOKED', 'CHECKED_IN', 'CANCELLED', 'EXPIRED'))
);

CREATE TABLE INVOICE_CONCESSION (
  INVOICE_CONCESSION_ID SERIAL PRIMARY KEY,
  INVOICE_ID INT NOT NULL,
  ITEM_TYPE VARCHAR(10) NOT NULL,
  ITEM_ID INT NOT NULL,
  ITEM_NAME VARCHAR(150) NOT NULL,
  SIZE VARCHAR(10) NOT NULL,
  UNIT_PRICE NUMERIC NOT NULL,
  QUANTITY INT NOT NULL,
  LINE_TOTAL NUMERIC NOT NULL,
  CONSTRAINT fk_invoice_concession_invoice FOREIGN KEY (INVOICE_ID) REFERENCES INVOICE(INVOICE_ID),
  CONSTRAINT chk_invoice_concession_type CHECK (ITEM_TYPE IN ('FOOD', 'DRINK', 'COMBO')),
  CONSTRAINT chk_invoice_concession_quantity CHECK (QUANTITY > 0)
);

CREATE TABLE SCORE_TRANSACTION (
  TXN_ID SERIAL PRIMARY KEY,
  MEMBER_ID VARCHAR(255),
  INVOICE_ID INT,
  TXN_TYPE VARCHAR(255),
  POINTS INT,
  BALANCE_AFTER DOUBLE PRECISION,
  TXN_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_st_member FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER(MEMBER_ID),
  CONSTRAINT fk_st_invoice FOREIGN KEY (INVOICE_ID) REFERENCES INVOICE(INVOICE_ID)
);

CREATE TABLE FOOD (
  FOOD_ID SERIAL PRIMARY KEY,
  FOOD_NAME VARCHAR(150) NOT NULL,
  DESCRIPTION TEXT,
  IMAGE VARCHAR(500),
  STATUS VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_food_status CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'DELETED'))
);
CREATE UNIQUE INDEX uq_food_name_active ON FOOD (LOWER(FOOD_NAME)) WHERE STATUS <> 'DELETED';

CREATE TABLE DRINK (
  DRINK_ID SERIAL PRIMARY KEY,
  DRINK_NAME VARCHAR(150) NOT NULL,
  DESCRIPTION TEXT,
  IMAGE VARCHAR(500),
  STATUS VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_drink_status CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'DELETED'))
);
CREATE UNIQUE INDEX uq_drink_name_active ON DRINK (LOWER(DRINK_NAME)) WHERE STATUS <> 'DELETED';

CREATE TABLE COMBO (
  COMBO_ID SERIAL PRIMARY KEY,
  COMBO_NAME VARCHAR(150) NOT NULL,
  DESCRIPTION TEXT,
  IMAGE VARCHAR(500),
  STATUS VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT chk_combo_status CHECK (STATUS IN ('ACTIVE', 'INACTIVE', 'DELETED'))
);
CREATE UNIQUE INDEX uq_combo_name_active ON COMBO (LOWER(COMBO_NAME)) WHERE STATUS <> 'DELETED';

CREATE TABLE CONCESSION_PRICE (
  CONCESSION_PRICE_ID SERIAL PRIMARY KEY,
  FOOD_ID INT,
  DRINK_ID INT,
  COMBO_ID INT,
  SIZE VARCHAR(10) NOT NULL DEFAULT 'NONE',
  PRICE NUMERIC(38, 2) NOT NULL,
  CONSTRAINT fk_cp_food FOREIGN KEY (FOOD_ID) REFERENCES FOOD(FOOD_ID),
  CONSTRAINT fk_cp_drink FOREIGN KEY (DRINK_ID) REFERENCES DRINK(DRINK_ID),
  CONSTRAINT fk_cp_combo FOREIGN KEY (COMBO_ID) REFERENCES COMBO(COMBO_ID),
  CONSTRAINT chk_cp_size CHECK (SIZE IN ('NONE', 'S', 'M', 'L')),
  CONSTRAINT chk_cp_price CHECK (PRICE > 0),
  CONSTRAINT chk_cp_owner CHECK (num_nonnulls(FOOD_ID, DRINK_ID, COMBO_ID) = 1),
  UNIQUE (FOOD_ID, SIZE),
  UNIQUE (DRINK_ID, SIZE),
  UNIQUE (COMBO_ID, SIZE)
);

CREATE TABLE COMBO_ITEM (
  COMBO_ITEM_ID SERIAL PRIMARY KEY,
  COMBO_ID INT NOT NULL,
  FOOD_ID INT,
  DRINK_ID INT,
  SIZE VARCHAR(10) NOT NULL DEFAULT 'NONE',
  QUANTITY INT NOT NULL,
  CONSTRAINT fk_ci_combo FOREIGN KEY (COMBO_ID) REFERENCES COMBO(COMBO_ID),
  CONSTRAINT fk_ci_food FOREIGN KEY (FOOD_ID) REFERENCES FOOD(FOOD_ID),
  CONSTRAINT fk_ci_drink FOREIGN KEY (DRINK_ID) REFERENCES DRINK(DRINK_ID),
  CONSTRAINT chk_ci_owner CHECK (num_nonnulls(FOOD_ID, DRINK_ID) = 1),
  CONSTRAINT chk_ci_size CHECK (SIZE IN ('NONE', 'S', 'M', 'L')),
  CONSTRAINT chk_ci_quantity CHECK (QUANTITY > 0)
);
CREATE UNIQUE INDEX uq_combo_item_food ON COMBO_ITEM (COMBO_ID, FOOD_ID, SIZE) WHERE FOOD_ID IS NOT NULL;
CREATE UNIQUE INDEX uq_combo_item_drink ON COMBO_ITEM (COMBO_ID, DRINK_ID, SIZE) WHERE DRINK_ID IS NOT NULL;

CREATE TABLE SUPPORT_REQUEST (
  SUPPORT_REQUEST_ID BIGSERIAL PRIMARY KEY,
  FULL_NAME VARCHAR(120) NOT NULL,
  EMAIL VARCHAR(150) NOT NULL,
  PHONE VARCHAR(20),
  SUBJECT VARCHAR(200) NOT NULL,
  MESSAGE TEXT NOT NULL,
  STATUS VARCHAR(20) NOT NULL DEFAULT 'NEW',
  ADMIN_NOTE TEXT,
  CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_support_status CHECK (STATUS IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
);
CREATE INDEX idx_support_request_status ON SUPPORT_REQUEST (STATUS);
CREATE INDEX idx_support_request_created_at ON SUPPORT_REQUEST (CREATED_AT DESC);

-- ============================================================
-- 6. DỮ LIỆU HẠT GIỐNG (SEED DATA)
-- ============================================================

-- Roles
INSERT INTO ROLE (ROLE_ID, ROLE_NAME) VALUES
(1, 'Admin'),
(2, 'Customer'),
(3, 'Employee');
SELECT setval('role_role_id_seq', (SELECT MAX(role_id) FROM ROLE));

-- Accounts (mật khẩu mặc định: 123456 - BCrypt)
INSERT INTO ACCOUNT (ACCOUNT_ID, USERNAME, PASSWORD, FULL_NAME, EMAIL, IDENTITY_CARD, PHONE_NUMBER, ROLE_ID) VALUES
('acc-01', 'admin',    '$2a$10$enJ6UuAnPp5rXCRRXaRYGumO7OsATX6J6NuE4b.Sl59APIqTRGavO', 'Sếp Tổng',      'admin@mtms.vn', '111222333', '0911111111', 1),
('acc-02', 'customer', '$2a$10$enJ6UuAnPp5rXCRRXaRYGumO7OsATX6J6NuE4b.Sl59APIqTRGavO', 'Khách Vip',     'customer@mtms.vn', '222333444', '0922222222', 2),
('acc-03', 'employee', '$2a$10$enJ6UuAnPp5rXCRRXaRYGumO7OsATX6J6NuE4b.Sl59APIqTRGavO', 'Nhân viên vé',  'nv@mtms.vn', '333444555', '0933333333', 3);

-- Member mapping (khởi tạo có sẵn 250 điểm tích lũy để test)
INSERT INTO MEMBER (MEMBER_ID, ACCOUNT_ID, SCORE) VALUES
('mem-01', 'acc-02', 250);

-- Employee mapping
INSERT INTO EMPLOYEE (EMPLOYEE_ID, ACCOUNT_ID) VALUES
('emp-01', 'acc-03');

-- Types (thể loại phim)
INSERT INTO TYPE (TYPE_ID, TYPE_NAME) VALUES
(1, 'Hành động'),
(2, 'Kinh dị'),
(3, 'Tình cảm'),
(4, 'Hài hước'),
(5, 'Khoa học viễn tưởng');
SELECT setval('type_type_id_seq', (SELECT MAX(type_id) FROM TYPE));

-- Versions (phiên bản chiếu + giá vé theo định dạng + phụ thu VIP/Couple)
INSERT INTO VERSION (VERSION_ID, VERSION_NAME, BASE_PRICE, VIP_PRICE, COUPLE_PRICE) VALUES
(1, '2D',   70000,  30000, 20000),
(2, '3D',  100000,  30000, 20000),
(3, 'IMAX', 120000, 30000, 20000),
(4, '4DX',  120000, 50000, 30000);
SELECT setval('version_version_id_seq', (SELECT MAX(version_id) FROM VERSION));

-- Movies (5 phim cũ + 22 phim mới = 27 phim tổng cộng)
INSERT INTO MOVIE (MOVIE_ID, MOVIE_NAME_ENGLISH, MOVIE_NAME_VN, DIRECTOR, ACTOR, MOVIE_PRODUCTION_COMPANY, DURATION, TRAILER, FROM_DATE, TO_DATE, CONTENT, LARGE_IMAGE, SMALL_IMAGE, STATUS) VALUES
-- 5 Phim cũ
('d75e8330-e40b-4130-8762-6e22f7d7df82', 'Inception',      'Kẻ Đánh Cắp Giấc Mơ', 'Christopher Nolan', 'Leonardo DiCaprio',    'Warner Bros.',      148, 'https://www.youtube.com/embed/YoHD9XEInc0', '2026-06-01', '2026-08-31', 'A thief who steals corporate secrets through use of dream-sharing technology.', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg', 'SHOWING'),
('da54ce63-d2fc-40e9-bd17-aac8e394f44e', 'Interstellar',   'Hố Đen Tử Thần',       'Christopher Nolan', 'Matthew McConaughey',  'Paramount Pictures', 169, 'https://www.youtube.com/embed/zSWdZAToXRw', '2026-06-15', '2026-08-31', 'A team of explorers travel through a wormhole in space.', 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg', 'INACTIVE'),
('3897ae38-a3ed-4264-8fe7-816d87c76c3a', 'The Hangover',   'Ba Chàng Ngự Lâm',     'Todd Phillips',     'Bradley Cooper',       'Warner Bros.',      100, 'https://www.youtube.com/embed/tcdUjFnMduI', '2026-06-20', '2026-08-31', 'Three friends wake up from a bachelor party in Las Vegas.', 'https://upload.wikimedia.org/wikipedia/en/b/b9/Hangoverposter09.jpg', 'https://upload.wikimedia.org/wikipedia/en/b/b9/Hangoverposter09.jpg', 'SHOWING'),
('60b8c101-8b3a-41af-b900-eeed8c55bd03', 'The Conjuring',  'Ám Ảnh Kinh Hoàng',    'James Wan',         'Vera Farmiga',         'New Line Cinema',   112, 'https://www.youtube.com/embed/k10ETZ42q5o', '2026-06-25', '2026-08-31', 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized.', 'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Conjuring_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Conjuring_poster.jpg', 'SHOWING'),
('f450294e-53d7-4852-8372-41143a272b0f', 'Avatar',         'Thế Thân',              'James Cameron',     'Sam Worthington',      '20th Century Fox',  162, 'https://www.youtube.com/embed/5PSNL1q36VY', '2026-07-01', '2026-08-31', 'A paraplegic marine dispatched to the moon Pandora on a unique mission.', 'https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg', 'SHOWING'),
-- 22 Phim mới
('e29f6001-9db5-43d6-8ccd-c3f26fc30417', 'SUPERGIRL', 'SUPERGIRL', 'Craig Gillespie', 'Milly Alcock, Matthias Schoenaerts, Eve Ridley, David Krumholtz, Emily Beecham, Jason Momoa', '', 108, 'https://www.youtube.com/embed/vvhWi0hzO-w', '2026-06-26', '2026-08-25', '“Supergirl” – bom tấn mới nhất từ DC Studios – sẽ chính thức đổ bộ các rạp chiếu toàn cầu vào mùa hè này, với Milly Alcock đảm nhận vai kép Supergirl/Kara Zor-El.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/m/a/main_poster_e29f6001-9db5-43d6-8ccd-c3f26fc30417_t13_5.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/m/a/main_poster_e29f6001-9db5-43d6-8ccd-c3f26fc30417_t13_5.jpg', 'INACTIVE'),
('134bc0f2-b4dc-4fc7-b209-a7688b71a036', 'OBSESSION', 'ÁM ẢNH', 'Curry Barker', 'Michael Johnston, Inde Navarrette, Cooper Tomlinson, Megan Lawless, Andy Richter', '', 109, 'https://www.youtube.com/embed/wPZOlaGhDFA', '2026-06-19', '2026-08-18', 'Bear, một chàng trai si tình, đã bẻ gãy món đồ chơi bí ẩn mang tên "Liễu Ước Nguyện" để đổi lấy tình yêu của cô gái mình thầm thương. Điều ước nhanh chóng trở thành hiện thực, nhưng hạnh phúc mà anh hằng mong đợi lại dần biến thành cơn ác mộng.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/o/b/obs_payoff_1920x1080.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/o/b/obs_payoff_470x700.jpg', 'SHOWING'),
('fde20041-070d-41b3-8acf-d130bd21e65f', 'TOY STORY 5', 'CÂU CHUYỆN ĐỒ CHƠI 5', 'Kenna Harris, Andrew Stanton', 'Keanu Reeves, Tom Hanks, Annie Potts', '', 102, 'https://www.youtube.com/embed/V05gf0OnpU4', '2026-06-19', '2026-08-18', 'Các món đồ chơi đã trở lại trong Toy Story 5 của Disney và Pixar, và lần này sẽ là cuộc đối đầu giữa đồ chơi và công nghệ.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/p/o/poster_cau_chuyen_do_choi_5_.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_cau_chuyen_do_choi_5_.jpg', 'SHOWING'),
('a1b4994f-ddbf-40db-913e-06a325305cb4', 'BACKROOMS', 'BACKROOMS: THỰC THỂ QUỶ QUYỆT', 'Kane Parsons', 'Chiwetel Ejiofor, Renate Reinsve, Mark Duplass', '', 110, 'https://www.youtube.com/embed/s5vWwGFiS8M', '2026-06-26', '2026-08-25', 'Clark (Chiwetel Ejiofor), một chủ cửa hàng nội thất, vô tình phát hiện cánh cửa bí ẩn dưới tầng hầm. Bước qua đó, anh bị cuốn vào một chiều không gian vô tinh với những căn phòng màu vàng méo mó, liên tục lặp lại.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-backroom.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-backroom.jpg', 'SHOWING'),
('e4c3fc67-040f-4e26-9049-22874755c5cf', 'COLONY', 'COLONY: BẦY XÁC SỐNG', 'YEON Sang-ho', 'Gianna JUN, KOO Kyo-hwan, JI Chang-wook, Shin Hyun-been, KIM Shin-rock, GO Soo', '', 122, 'https://www.youtube.com/embed/NI5iE1R8HgQ', '2026-06-12', '2026-08-11', 'Khi một dịch bệnh bí ẩn bùng phát tại tòa cao ốc giữa trung tâm Seoul, những người sống sót bị mắc kẹt và buộc phải chiến đấu để thoát thân.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-e4c3fc67-040f-4e26-9049-22874755c5cf.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-e4c3fc67-040f-4e26-9049-22874755c5cf.jpg', 'SHOWING'),
('30cd0fb4-322d-47e0-af2f-769a46ce41a0', 'LAU CHU HOA', 'LẦU CHÚ HỎA', 'HÙNG TRẦN', 'TRẦN KỲ ANH, NGUYỄN MINH THỜI, NGỌC CHI BẢO, PHỤNG HOÀNG, NGUYỄN CÔNG NƯƠNG, DŨNG HÀ', '', 94, 'https://www.youtube.com/embed/bN0_D-k-2r8', '2026-06-12', '2026-08-11', 'Một nhóm streamer livestream khám phá Lầu Chú Hỏa, dinh thự bỏ hoang gắn với truyền thuyết về con ma nhà họ Hứa. Buổi livestream nhanh chóng biến thành nơi “tạo nghiệp – trả nghiệp”.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/-/l/-lch.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-lch.jpg', 'SHOWING'),
('708bddbb-90fd-4a11-9f7c-26eea5ebab65', 'MADAMES THANH SAC', 'MESDAMES THANH SẮC', 'Thắng Vũ', 'Thanh Hằng, Hồng Ánh, Lương Thế Thành', '', 125, 'https://www.youtube.com/embed/FIoDvHBZjUs', '2026-06-19', '2026-08-18', 'Cuộc đời của đại mỹ nhân Cầm Thanh và Madame Sắc - bà chủ vũ trường Kim Đô giàu có và sở hữu nhiều kim cương.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/m/a/madames_main_thumb.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/m/a/main_mts_cinema.jpg', 'SHOWING'),
('c1a0c12f-fe8a-4a23-8c22-79c70574eae4', 'CAGED BUTTERFLY', 'MINH HÔN TRONG LỒNG BƯỚM', 'Hạo Hàn - Vương Triết', 'Lý Mộng, Khương Trác Quân, Lưu Tư Vỹ, Chu Triết, Vương Ninh', '', 91, 'https://www.youtube.com/embed/OVhwV0VbI2I', '2026-06-26', '2026-08-25', 'Biệt thự nhà họ Lục, hay còn gọi diệp phủ, từ lâu nổi tiếng là một căn nhà ma ám đầy bí ẩn. Nhiều hiện tượng kinh hoàng liên tiếp xảy ra.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/1/0/1080wx650h-minhhon.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-minhon.jpg', 'SHOWING'),
('6c30a6be-d390-4127-afef-d648743ed618', 'ONCE A THIEF', 'TUNG HOÀNH TỨ HẢI', 'John Woo', 'Chow Yun Fat, Leslie Cheung, Cherie Chung, Kenneth Tsang', '', 109, 'https://www.youtube.com/embed/-DT1isH9qbM', '2026-06-26', '2026-08-25', 'Ba đứa trẻ mồ côi được một tên siêu trộm nuôi dưỡng và đào tạo thành những tên trộm khét tiếng nhất Hong Kong.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/1/0/1080wx608h-thief.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-thief.jpg', 'SHOWING'),
('711a8f25-a6b3-416b-8797-3ea2b39c6991', 'DORAEMON MOVIE 45', 'NOBITA VÀ LÂU ĐÀI DƯỚI ĐÁY BIỂN', 'Tetsuo Yajima', 'Wasabi Mizuta, Megumi Oohara, Yumi Kakazu, Subaru Kimura, Tomokazu Seki', '', 101, 'https://www.youtube.com/embed/u3JgYkmuK78', '2026-05-22', '2026-07-21', 'Nobita và các bạn quyết định cắm trại giữa lòng đại dương theo đề xuất của Doraemon.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/9/8/980x448__1_.png', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_doraemon_movie_2026_g_c.jpg', 'SHOWING'),
('e2df1d2b-d58f-4ac6-96c7-91c55d8cf471', 'LIEU TRAI', 'LIÊU TRAI LAN NHƯỢT TỰ', 'Yuemei Cui, Heyu Huang, Yilin Liu', NULL, '', 112, 'https://www.youtube.com/embed/T4UZUKHgR0k', '2026-06-26', '2026-08-25', 'Siêu phẩm kỹ xảo từ Light Chaser làm sống dậy Liêu Trai Chí Dị của Bồ Tùng Linh.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-lieutrai.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-lieutrai.jpg', 'SHOWING'),
('cb1b7ef7-fe5e-4f2c-bfa9-777be3e428c3', 'PONYO', 'CÔ BÉ PONY O', 'MIYAZAKI HAYAO', NULL, '', 101, 'https://www.youtube.com/embed/JjRBesJJQ8E', '2026-06-12', '2026-08-11', 'Cô bé cá vàng Ponyo gặp cậu bé Sosuke và bắt đầu hành trình kỳ diệu.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/p/o/poster_kctr_-_c_b_cb1b7ef7-fe5e-4f2c-bfa9-777be3e428c3.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_kctr_-_c_b_cb1b7ef7-fe5e-4f2c-bfa9-777be3e428c3.jpg', 'SHOWING'),
('107b8940-e16a-4a22-93ef-8b56637a815a', 'WHITE SNAKE', 'BẠCH XÀ: MỘT KIẾP NHÂN GIAN', 'Jianxi Chen, Jiakai Li', NULL, '', 133, 'https://www.youtube.com/embed/ldWM08f3zL0', '2026-06-19', '2026-08-18', 'Bạch Tố Trinh bước vào thế giới loài người để báo đáp ân tình trong quá khứ.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-bachxa.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-bachxa.jpg', 'SHOWING'),
('2c58494c-4950-4e42-8d49-a161199c1439', 'DEVIL BLACK CAT', 'LINH MIÊU BÁO THÙ', 'Anuwat Thanomrod', 'Anna Glucks, Indy Intad Leowrakwong, Wayne Falconer, Nuttanee Sittisamarn', '', 87, NULL, '2026-06-26', '2026-08-25', 'Sarah đến một ngôi làng bị ám bởi truyền thuyết về Quỷ Mèo Đen và khám phá nghi lễ hiến tế cổ xưa.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-linhmiu.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-linhmiu.jpg', 'SHOWING'),
('ba1429a0-465b-4c9a-b5ad-888b0b581dbe', 'YOUR NAME', 'TÊN CẬU LÀ GÌ', 'Shinkai Makoto', 'Kamiki Ryunosuke, Kamishiraishi Mone, Narita Ryo', '', 107, NULL, '2026-06-05', '2026-08-04', 'Hai nhân vật vô tình bị hoán đổi thân thể qua những giấc mơ.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/y/o/your_name_localized_adaptation_social_1920_x_1080.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/y/o/your_name_localized_adaptation_social_470_x_700.jpg', 'SHOWING'),
('75f160d6-eb3f-4ae6-a7da-e745f9913d40', 'YEN CHI KHAU', 'YÊN CHI KHÂU', 'STANLEY KWAN', 'Trương Quốc Vinh, Mai Diễm Phương', '', 98, 'https://www.youtube.com/embed/E6Hn9mr53dM', '2026-06-12', '2026-08-11', 'Một tác phẩm kinh điển điện ảnh nghệ thuật đầy cảm xúc.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/1/0/1080wx650h-yck.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-yck.jpg', 'SHOWING'),
('1971c334-5b31-45e8-aeb0-068cb5bcdcf2', 'ASSASSINATION CLASSROOM', 'LỚP HỌC ÁM SÁT: GIỜ CỦA CHÚNG TA', 'Masaki Kitamura', 'Shintarô Asanuma, Mai Fuchigami, Saki Fujita', '', 86, 'https://www.youtube.com/embed/bjkwRzGSe-E', '2026-06-05', '2026-08-04', 'Một sinh vật tốc độ Mach 20 trở thành thầy giáo của lớp học đặc biệt.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-assassin.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-assassin.jpg', 'SHOWING'),
('6f072f1c-06cb-43fe-86db-a6e6a549c616', 'MARSUPILAMI', 'SIÊU QUẬY MARSUPILAMI', 'Philippe Lacheau', 'Philippe Lacheau, Jamel Debbouze, Tarek Boudali', '', 99, 'https://www.youtube.com/embed/xzc6xQfWq4E', '2026-06-05', '2026-08-04', 'Một cuộc phiêu lưu hài hước xoay quanh sinh vật Marsupilami.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/4/7/470x700marsu.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470x700marsu.jpg', 'SHOWING'),
('7bcf14ef-a10f-4fd2-9dad-788026b2c218', 'GOHAN', 'TẠM BIỆT GOHAN', 'Chayanop Boonprakob - Baz Poonpiriya - Atta Hemwadee', 'Yasushi Kitajima, Poe Mamhe Thar, Jinjett Wattanasin, Tontawan Tantivejakul', '', 140, 'https://www.youtube.com/embed/PaGtIdi8ONk', '2026-05-15', '2026-07-14', 'Câu chuyện cảm động về thời gian, hội ngộ và chia ly cùng một chú chó.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/t/h/thumb_3.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/2/_/2.2._7bcf14ef-a10f-4fd2-9dad-788026b2c218_-_main_poster_-_size_web_app.jpg', 'ENDED'),
('ccd92621-99fb-47d6-a60f-c1be24fca4ac', 'OC MUON HON', 'ỐC MƯỢN HỒN', 'Đinh Tuấn Vũ', 'Quốc Trường, Tiểu Vy, Anh Phạm, Yên Đan, Anh Đức, Lương Gia Huy, Nguyễn Văn Chung', '', 109, 'https://www.youtube.com/embed/-HoO0gKvxhM', '2026-06-01', '2026-07-31', '"ỐC MƯỢN HỒN - MÀN "MƯỢN XÁC HOÀN HỒN" CHÍNH THẤT & TIỂU TAM TÁO BẠO NHẤT HÈ NÀY!', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-omh_1.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-omh_1.jpg', 'SHOWING'),
('2be56227-0635-4d61-870f-1b601e8a5d92', 'MICHAEL', 'MICHAEL', 'Antoine Fuqua', 'Jaafar Jackson, Nia Long, Laura Harrier, Juliano Krue Valdi, Miles Teller, Colman Domingo', '', 127, 'https://www.youtube.com/embed/q-Ap6oHz1js', '2026-04-22', '2026-06-21', 'Bộ phim mang đến góc nhìn chân thực hơn về Michael Jackson.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/m/v/mvn_badonesheet_700x1000.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/m/v/mvn_badonesheet_700x1000.jpg', 'ENDED'),
('882184ac-a72b-427b-a536-50d5a189337c', 'KINGS WARDEN', 'DƯỚI BÓNG ĐIỆN HẠ', 'Chang Hang-jun', 'Yoo Hai-jin, Park Ji-hoon, Yoo Ji-tae, Jeon Mi-do', '', 117, 'https://www.youtube.com/embed/aPsEOR-WK6U', '2026-04-10', '2026-06-09', 'Vị vua trẻ Danjong bị lật đổ và đày đến vùng Cheongnyeongpo.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/t/h/thumb-main_1_5.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/t/h/the_king_s_warden_main_poster.jpg', 'ENDED'),
-- 5 phim sắp chiếu (chỉ biết ngày khởi chiếu chính thức; TO_DATE là mốc tạm +60 ngày, cần cập nhật khi có ngày công bố thật)
('b4f08d5b-d3cc-4c88-b9b0-5e3bf649435a', 'GODZILLA MINUS ZERO', 'GODZILLA MINUS ZERO', 'Takashi Yamazaki', 'Ryunosuke Kamiki, Minami Hamabe, Yuki Yamada, Sakura Ando', 'Toho Studios', 125, 'https://www.youtube.com/embed/C-turCJCrbA', '2026-11-06', '2027-01-05', 'Lấy bối cảnh năm 1949, hai năm sau các sự kiện trong Godzilla Minus One, phim tiếp tục câu chuyện gia đình Shikishima khi họ phải đối mặt với một thảm họa mới từ Godzilla.', 'https://upload.wikimedia.org/wikipedia/en/0/09/Godzilla_Minus_Zero_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/0/09/Godzilla_Minus_Zero_poster.jpg', 'UPCOMING'),
('2f559c30-9c3c-4546-a98b-5bf0a3bc9ba6', 'THE EMINENCE IN SHADOW: LOST ECHOES', 'THE EMINENCE IN SHADOW: LOST ECHOES', 'Kazuya Nakanishi', 'Seiichiro Yamashita, Yui Horie, Inori Minase, Takehito Koyasu', 'Nexus', 110, 'https://www.youtube.com/embed/CejicD1u_rE', '2027-01-01', '2027-03-02', 'Phần phim điện ảnh nối tiếp trực tiếp mùa 2, theo chân Cid Kagenou bị dịch chuyển trở lại Nhật Bản hiện đại trong một hành trình mới.', 'https://upload.wikimedia.org/wikipedia/en/d/df/Eminence-in-shadow-lost-echoes.png', 'https://upload.wikimedia.org/wikipedia/en/d/df/Eminence-in-shadow-lost-echoes.png', 'UPCOMING'),
('de638654-0710-474d-8d6c-2f5a23f30fcd', 'GODZILLA X KONG: SUPERNOVA', 'GODZILLA X KONG: SUPERNOVA', 'Grant Sputore', 'Kaitlyn Dever, Dan Stevens, Jack O''Connell, Alycia Debnam-Carey, Matthew Modine, Delroy Lindo, Sam Neill', 'Legendary Pictures', 120, 'https://www.youtube.com/embed/K86xzGi1x6s', '2027-03-26', '2027-05-25', 'Godzilla và Kong đối mặt với một cơn bão quái vật chấn động địa cầu, khám phá mối quan hệ mong manh giữa con người và các Titan tiền sử.', 'https://upload.wikimedia.org/wikipedia/commons/9/95/Godzilla_x_Kong_Supernova_Logo.png', 'https://upload.wikimedia.org/wikipedia/commons/9/95/Godzilla_x_Kong_Supernova_Logo.png', 'UPCOMING'),
('f3e93a31-5d35-400f-8cf5-684da231c29b', 'AVENGERS: DOOMSDAY', 'AVENGERS: DOOMSDAY', 'Anthony Russo, Joe Russo', 'Robert Downey Jr., Chris Evans, Chris Hemsworth, Pedro Pascal, Paul Rudd, Anthony Mackie', 'Marvel Studios', 165, 'https://www.youtube.com/embed/4jVs_LB2BHg', '2026-12-18', '2027-02-16', '14 tháng sau sự kiện Thunderbolts*, các anh hùng từ ba vũ trụ khác nhau - Avengers, Wakanda, Fantastic Four và X-Men - buộc phải hợp lực đối đầu mối đe dọa mang tên Doctor Doom.', 'https://upload.wikimedia.org/wikipedia/en/e/ee/Avengers_Doomsday_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/e/ee/Avengers_Doomsday_poster.jpg', 'UPCOMING'),
('a73ca3eb-6c8e-42f3-9755-d3307988913c', 'AVENGERS: SECRET WARS', 'AVENGERS: SECRET WARS', 'Anthony Russo, Joe Russo', NULL, 'Marvel Studios', 180, NULL, '2027-12-17', '2028-02-15', 'Chương cuối của Multiverse Saga, nơi các vũ trụ va chạm và số phận của toàn bộ đa vũ trụ được định đoạt.', 'https://media.themoviedb.org/t/p/w300_and_h450_face/f0YBuh4hyiAheXhh4JnJWoKi9g5.jpg', 'https://media.themoviedb.org/t/p/w300_and_h450_face/f0YBuh4hyiAheXhh4JnJWoKi9g5.jpg', 'UPCOMING');

-- Movie Types (ánh xạ thể loại)
INSERT INTO MOVIE_TYPE (MOVIE_ID, TYPE_ID) VALUES
('d75e8330-e40b-4130-8762-6e22f7d7df82', 1),
('d75e8330-e40b-4130-8762-6e22f7d7df82', 5),
('da54ce63-d2fc-40e9-bd17-aac8e394f44e', 1),
('da54ce63-d2fc-40e9-bd17-aac8e394f44e', 5),
('3897ae38-a3ed-4264-8fe7-816d87c76c3a', 4),
('60b8c101-8b3a-41af-b900-eeed8c55bd03', 2),
('f450294e-53d7-4852-8372-41143a272b0f', 1),
('f450294e-53d7-4852-8372-41143a272b0f', 5),
('e29f6001-9db5-43d6-8ccd-c3f26fc30417', 1),
('e29f6001-9db5-43d6-8ccd-c3f26fc30417', 5),
('134bc0f2-b4dc-4fc7-b209-a7688b71a036', 2),
('fde20041-070d-41b3-8acf-d130bd21e65f', 4),
('a1b4994f-ddbf-40db-913e-06a325305cb4', 2),
('e4c3fc67-040f-4e26-9049-22874755c5cf', 2),
('30cd0fb4-322d-47e0-af2f-769a46ce41a0', 2),
('708bddbb-90fd-4a11-9f7c-26eea5ebab65', 3),
('c1a0c12f-fe8a-4a23-8c22-79c70574eae4', 2),
('6c30a6be-d390-4127-afef-d648743ed618', 1),
('711a8f25-a6b3-416b-8797-3ea2b39c6991', 4),
('e2df1d2b-d58f-4ac6-96c7-91c55d8cf471', 5),
('cb1b7ef7-fe5e-4f2c-bfa9-777be3e428c3', 4),
('107b8940-e16a-4a22-93ef-8b56637a815a', 3),
('2c58494c-4950-4e42-8d49-a161199c1439', 2),
('ba1429a0-465b-4c9a-b5ad-888b0b581dbe', 3),
('75f160d6-eb3f-4ae6-a7da-e745f9913d40', 3),
('1971c334-5b31-45e8-aeb0-068cb5bcdcf2', 4),
('6f072f1c-06cb-43fe-86db-a6e6a549c616', 4),
('7bcf14ef-a10f-4fd2-9dad-788026b2c218', 3),
('ccd92621-99fb-47d6-a60f-c1be24fca4ac', 2),
('2be56227-0635-4d61-870f-1b601e8a5d92', 3),
('882184ac-a72b-427b-a536-50d5a189337c', 1),
('b4f08d5b-d3cc-4c88-b9b0-5e3bf649435a', 1),
('b4f08d5b-d3cc-4c88-b9b0-5e3bf649435a', 5),
('2f559c30-9c3c-4546-a98b-5bf0a3bc9ba6', 1),
('de638654-0710-474d-8d6c-2f5a23f30fcd', 1),
('de638654-0710-474d-8d6c-2f5a23f30fcd', 5),
('f3e93a31-5d35-400f-8cf5-684da231c29b', 1),
('f3e93a31-5d35-400f-8cf5-684da231c29b', 5),
('a73ca3eb-6c8e-42f3-9755-d3307988913c', 1),
('a73ca3eb-6c8e-42f3-9755-d3307988913c', 5);

-- Movie Versions (ánh xạ phiên bản)
INSERT INTO MOVIE_VERSION (MOVIE_ID, VERSION_ID) VALUES
('d75e8330-e40b-4130-8762-6e22f7d7df82', 1),
('da54ce63-d2fc-40e9-bd17-aac8e394f44e', 3),
('3897ae38-a3ed-4264-8fe7-816d87c76c3a', 1),
('60b8c101-8b3a-41af-b900-eeed8c55bd03', 2),
('f450294e-53d7-4852-8372-41143a272b0f', 4),
('e29f6001-9db5-43d6-8ccd-c3f26fc30417', 1),
('e29f6001-9db5-43d6-8ccd-c3f26fc30417', 2),
('134bc0f2-b4dc-4fc7-b209-a7688b71a036', 1),
('fde20041-070d-41b3-8acf-d130bd21e65f', 1),
('a1b4994f-ddbf-40db-913e-06a325305cb4', 1),
('e4c3fc67-040f-4e26-9049-22874755c5cf', 1),
('30cd0fb4-322d-47e0-af2f-769a46ce41a0', 1),
('708bddbb-90fd-4a11-9f7c-26eea5ebab65', 1),
('c1a0c12f-fe8a-4a23-8c22-79c70574eae4', 1),
('6c30a6be-d390-4127-afef-d648743ed618', 1),
('711a8f25-a6b3-416b-8797-3ea2b39c6991', 1),
('e2df1d2b-d58f-4ac6-96c7-91c55d8cf471', 1),
('cb1b7ef7-fe5e-4f2c-bfa9-777be3e428c3', 1),
('107b8940-e16a-4a22-93ef-8b56637a815a', 1),
('2c58494c-4950-4e42-8d49-a161199c1439', 1),
('ba1429a0-465b-4c9a-b5ad-888b0b581dbe', 1),
('75f160d6-eb3f-4ae6-a7da-e745f9913d40', 1),
('1971c334-5b31-45e8-aeb0-068cb5bcdcf2', 1),
('6f072f1c-06cb-43fe-86db-a6e6a549c616', 1),
('7bcf14ef-a10f-4fd2-9dad-788026b2c218', 1),
('ccd92621-99fb-47d6-a60f-c1be24fca4ac', 1),
('2be56227-0635-4d61-870f-1b601e8a5d92', 1),
('882184ac-a72b-427b-a536-50d5a189337c', 1),
('b4f08d5b-d3cc-4c88-b9b0-5e3bf649435a', 1),
('b4f08d5b-d3cc-4c88-b9b0-5e3bf649435a', 3),
('2f559c30-9c3c-4546-a98b-5bf0a3bc9ba6', 1),
('de638654-0710-474d-8d6c-2f5a23f30fcd', 1),
('de638654-0710-474d-8d6c-2f5a23f30fcd', 3),
('f3e93a31-5d35-400f-8cf5-684da231c29b', 1),
('f3e93a31-5d35-400f-8cf5-684da231c29b', 3),
('a73ca3eb-6c8e-42f3-9755-d3307988913c', 1),
('a73ca3eb-6c8e-42f3-9755-d3307988913c', 3);

-- Cinema Rooms (Phòng 1/2/5 = 2D+3D, Phòng 3 = IMAX riêng, Phòng 4 = 4DX riêng)
INSERT INTO CINEMA_ROOM (cinema_room_id, cinema_room_name, seat_quantity, status) VALUES
(1, 'Phòng 1', 80,  'ACTIVE'),
(2, 'Phòng 2', 80,  'ACTIVE'),
(3, 'Phòng 3', 100, 'ACTIVE'),
(4, 'Phòng 4', 48,  'ACTIVE'),
(5, 'Phòng 5', 80,  'ACTIVE')
ON CONFLICT (cinema_room_name) DO NOTHING;
SELECT setval('cinema_room_cinema_room_id_seq', (SELECT MAX(cinema_room_id) FROM CINEMA_ROOM));

-- Room Formats (M2M: gán format cho từng phòng)
-- Chỉ 2D + 3D được phép đi cùng nhau; các định dạng khác (IMAX/4DX) phải đứng một mình.
-- Phòng 1/2/5: 2D (1) + 3D (2) -- Phòng 3: IMAX (3) -- Phòng 4: 4DX (4)
INSERT INTO ROOM_FORMAT (cinema_room_id, version_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 2),
(3, 3),
(4, 4),
(5, 1), (5, 2)
ON CONFLICT DO NOTHING;

-- Seats: Phòng 1/2/5 = 8x10 (80 ghế), Phòng 3 = 10x10 (100 ghế, IMAX), Phòng 4 = 6x8 (48 ghế, 4DX)
-- Khối ghế giữa được đánh dấu VIP (seat_type = 1)
DO $$
DECLARE
    room RECORD;
    rowNum INT;
    colNum INT;
    sType INT;
    sId INT := 1;
    vipRowFrom INT;
    vipRowTo INT;
    vipColFrom INT;
    vipColTo INT;
BEGIN
    FOR room IN
        SELECT cinema_room_id AS id,
               CASE cinema_room_id WHEN 3 THEN 10 WHEN 4 THEN 6 ELSE 8 END AS rows,
               CASE cinema_room_id WHEN 3 THEN 10 WHEN 4 THEN 8 ELSE 10 END AS cols
        FROM CINEMA_ROOM ORDER BY cinema_room_id
    LOOP
        vipRowFrom := GREATEST(1, room.rows / 2 - 1);
        vipRowTo   := LEAST(room.rows, room.rows / 2 + 2);
        vipColFrom := GREATEST(1, room.cols / 4);
        vipColTo   := LEAST(room.cols, room.cols - room.cols / 4);

        FOR rowNum IN 1..room.rows LOOP
            FOR colNum IN 1..room.cols LOOP
                IF rowNum BETWEEN vipRowFrom AND vipRowTo AND colNum BETWEEN vipColFrom AND vipColTo THEN
                    sType := 1;
                ELSE
                    sType := 0;
                END IF;

                INSERT INTO SEAT (SEAT_ID, CINEMA_ROOM_ID, SEAT_ROW, SEAT_COLUMN, SEAT_TYPE, STATUS)
                VALUES (sId, room.id, rowNum, colNum::varchar, sType, 'ACTIVE')
                ON CONFLICT DO NOTHING;
                sId := sId + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
SELECT setval('seat_seat_id_seq', (SELECT MAX(seat_id) FROM SEAT));

-- Golden Hour (khung giờ vàng 18:00-21:00 mọi ngày, phụ thu 20.000đ)
INSERT INTO GOLDEN_HOUR_CONFIG (START_TIME, END_TIME, DAYS_OF_WEEK, EXTRA_PRICE, ACTIVE)
SELECT '18:00', '21:00', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY', 20000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM GOLDEN_HOUR_CONFIG);

-- Active Promotions (Khuyến mãi hiện hoạt)
INSERT INTO PROMOTION (PROMOTION_ID, TITLE, CONTENT, DETAIL, START_TIME, END_TIME, PROMOTION_VALUE, DISCOUNT_TYPE, USAGE_LIMIT, USED_COUNT, IMAGE, BOOKING_URL, STATUS, BIRTHDAY_ONLY, IS_DELETED) VALUES
(1, 'KM10', 'Giảm giá 10%', 'Áp dụng cho mọi hóa đơn đặt vé online', '2026-06-01 00:00:00', '2026-12-31 23:59:59', 10.00, 'PERCENT', 1000, 0, '', '', 'ACTIVE', FALSE, 0),
(2, 'GIAM50K', 'Giảm ngay 50.000đ', 'Giảm trực tiếp 50k vào tổng tiền hóa đơn', '2026-06-01 00:00:00', '2026-12-31 23:59:59', 50000.00, 'FIXED', 1000, 0, '', '', 'ACTIVE', FALSE, 0)
ON CONFLICT DO NOTHING;
SELECT setval('promotion_promotion_id_seq', (SELECT MAX(promotion_id) FROM PROMOTION));

INSERT INTO FOOD (FOOD_NAME, DESCRIPTION, IMAGE, STATUS) VALUES
('Sweet Popcorn', NULL, 'https://images.pexels.com/photos/8652476/pexels-photo-8652476.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Cheese Popcorn', NULL, 'https://images.pexels.com/photos/5603924/pexels-photo-5603924.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Hotdog', NULL, 'https://images.pexels.com/photos/4113470/pexels-photo-4113470.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Snack Tray', NULL, 'https://images.pexels.com/photos/12557546/pexels-photo-12557546.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');

INSERT INTO DRINK (DRINK_NAME, DESCRIPTION, IMAGE, STATUS) VALUES
('Coca-Cola', NULL, 'https://images.pexels.com/photos/8879617/pexels-photo-8879617.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Sprite', NULL, 'https://images.pexels.com/photos/9996448/pexels-photo-9996448.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Bottled Water', NULL, 'https://images.pexels.com/photos/31699476/pexels-photo-31699476/free-photo-of-close-up-of-plastic-bottles-with-green-caps.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');

INSERT INTO COMBO (COMBO_NAME, DESCRIPTION, IMAGE, STATUS) VALUES
('Solo Combo', '1 medium popcorn + 1 medium drink', 'https://images.pexels.com/photos/7234254/pexels-photo-7234254.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Couple Combo', '1 large popcorn + 2 large drinks', 'https://images.pexels.com/photos/7234253/pexels-photo-7234253.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE'),
('Family Combo', '2 large popcorns + 4 medium drinks', 'https://images.pexels.com/photos/7328496/pexels-photo-7328496.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');

INSERT INTO CONCESSION_PRICE (FOOD_ID, SIZE, PRICE) VALUES
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Sweet Popcorn'), 'S', 45000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Sweet Popcorn'), 'M', 55000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Sweet Popcorn'), 'L', 65000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Cheese Popcorn'), 'S', 50000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Cheese Popcorn'), 'M', 60000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Cheese Popcorn'), 'L', 70000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Hotdog'), 'NONE', 40000),
((SELECT FOOD_ID FROM FOOD WHERE FOOD_NAME = 'Snack Tray'), 'NONE', 65000);

INSERT INTO CONCESSION_PRICE (DRINK_ID, SIZE, PRICE) VALUES
((SELECT DRINK_ID FROM DRINK WHERE DRINK_NAME = 'Coca-Cola'), 'M', 35000),
((SELECT DRINK_ID FROM DRINK WHERE DRINK_NAME = 'Coca-Cola'), 'L', 45000),
((SELECT DRINK_ID FROM DRINK WHERE DRINK_NAME = 'Sprite'), 'M', 35000),
((SELECT DRINK_ID FROM DRINK WHERE DRINK_NAME = 'Sprite'), 'L', 45000),
((SELECT DRINK_ID FROM DRINK WHERE DRINK_NAME = 'Bottled Water'), 'NONE', 25000);

INSERT INTO CONCESSION_PRICE (COMBO_ID, SIZE, PRICE) VALUES
((SELECT COMBO_ID FROM COMBO WHERE COMBO_NAME = 'Solo Combo'), 'NONE', 89000),
((SELECT COMBO_ID FROM COMBO WHERE COMBO_NAME = 'Couple Combo'), 'NONE', 159000),
((SELECT COMBO_ID FROM COMBO WHERE COMBO_NAME = 'Family Combo'), 'NONE', 219000);

-- Clear old schedules to seed clean
DELETE FROM SCHEDULE_SEAT;
DELETE FROM SCHEDULE;

-- Insert Schedules for the next 7 days dynamically: for every ACTIVE room, cycle
-- round-robin through every movie whose version matches one of that room's
-- supported formats (via ROOM_FORMAT / MOVIE_VERSION), skipping INACTIVE/UNSCHEDULED
-- movies, packing shows back-to-back from 08:00 with a 30-minute buffer, stopping
-- once a show would start after 23:00 (last-show-start cutoff).
DO $$
DECLARE
    day_offset INT;
    curr_date DATE;
    room_rec RECORD;
    open_min CONSTANT INT := 8 * 60;
    close_min CONSTANT INT := 23 * 60;
    buffer_min CONSTANT INT := 30;
    mv_ids VARCHAR[];
    mv_versions INT[];
    mv_durations INT[];
    mv_count INT;
    mv_idx INT;
    show_start_min INT;
    show_end_min INT;
BEGIN
    FOR day_offset IN 0..6 LOOP
        curr_date := CURRENT_DATE + day_offset;

        FOR room_rec IN SELECT cinema_room_id FROM CINEMA_ROOM WHERE status = 'ACTIVE' ORDER BY cinema_room_id LOOP
            SELECT array_agg(x.movie_id ORDER BY x.movie_id),
                   array_agg(x.version_id ORDER BY x.movie_id),
                   array_agg(x.duration ORDER BY x.movie_id)
            INTO mv_ids, mv_versions, mv_durations
            FROM (
                SELECT DISTINCT ON (m.movie_id) m.movie_id, rf.version_id, m.duration
                FROM ROOM_FORMAT rf
                JOIN MOVIE_VERSION mv ON mv.version_id = rf.version_id
                JOIN MOVIE m ON m.movie_id = mv.movie_id
                WHERE rf.cinema_room_id = room_rec.cinema_room_id
                  AND (m.status IS NULL OR m.status NOT IN ('INACTIVE', 'UNSCHEDULED'))
                ORDER BY m.movie_id, rf.version_id
            ) x;

            mv_count := COALESCE(array_length(mv_ids, 1), 0);
            CONTINUE WHEN mv_count = 0;

            -- Vary the starting movie per room/day so the catalog rotates instead of always opening on the same title.
            mv_idx := (room_rec.cinema_room_id + day_offset) % mv_count;
            show_start_min := open_min;

            WHILE show_start_min <= close_min LOOP
                show_end_min := show_start_min + mv_durations[mv_idx + 1];
                INSERT INTO SCHEDULE (movie_id, cinema_room_id, start_time, end_time, buffer_time, version_id, status)
                VALUES (
                    mv_ids[mv_idx + 1],
                    room_rec.cinema_room_id,
                    (curr_date + (show_start_min || ' minutes')::interval)::timestamp,
                    (curr_date + (show_end_min || ' minutes')::interval)::timestamp,
                    buffer_min,
                    mv_versions[mv_idx + 1],
                    'SCHEDULED'
                );
                show_start_min := show_end_min + buffer_min;
                mv_idx := (mv_idx + 1) % mv_count;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
SELECT setval('schedule_schedule_id_seq', (SELECT MAX(schedule_id) FROM SCHEDULE));

SET client_encoding = 'UTF8';
