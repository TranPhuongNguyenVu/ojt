--
-- PostgreSQL database dump
--



-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.score_transaction DROP CONSTRAINT IF EXISTS fk_st_member CASCADE;
ALTER TABLE IF EXISTS ONLY public.score_transaction DROP CONSTRAINT IF EXISTS fk_st_invoice CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule_seat DROP CONSTRAINT IF EXISTS fk_ss_seat CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule_seat DROP CONSTRAINT IF EXISTS fk_ss_schedule CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule_seat DROP CONSTRAINT IF EXISTS fk_ss_account CASCADE;
ALTER TABLE IF EXISTS ONLY public.seat DROP CONSTRAINT IF EXISTS fk_seat_room CASCADE;
ALTER TABLE IF EXISTS ONLY public.seat DROP CONSTRAINT IF EXISTS fk_seat_pair CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule DROP CONSTRAINT IF EXISTS fk_schedule_version CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule DROP CONSTRAINT IF EXISTS fk_schedule_room CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule DROP CONSTRAINT IF EXISTS fk_schedule_movie CASCADE;
ALTER TABLE IF EXISTS ONLY public.room_format DROP CONSTRAINT IF EXISTS fk_rf_version CASCADE;
ALTER TABLE IF EXISTS ONLY public.room_format DROP CONSTRAINT IF EXISTS fk_rf_room CASCADE;
ALTER TABLE IF EXISTS ONLY public.payment DROP CONSTRAINT IF EXISTS fk_payment_invoice CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie_version DROP CONSTRAINT IF EXISTS fk_mv_version CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie_version DROP CONSTRAINT IF EXISTS fk_mv_movie CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie_type DROP CONSTRAINT IF EXISTS fk_mt_type CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie_type DROP CONSTRAINT IF EXISTS fk_mt_movie CASCADE;
ALTER TABLE IF EXISTS ONLY public.member DROP CONSTRAINT IF EXISTS fk_member_account CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice_seat DROP CONSTRAINT IF EXISTS fk_is_ss CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice_seat DROP CONSTRAINT IF EXISTS fk_is_invoice CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice DROP CONSTRAINT IF EXISTS fk_invoice_schedule CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice DROP CONSTRAINT IF EXISTS fk_invoice_promotion CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice DROP CONSTRAINT IF EXISTS fk_invoice_account CASCADE;
ALTER TABLE IF EXISTS ONLY public.employee DROP CONSTRAINT IF EXISTS fk_employee_account CASCADE;
ALTER TABLE IF EXISTS ONLY public.cancelled_ticket DROP CONSTRAINT IF EXISTS fk_ct_invoice CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS fk_cp_food CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS fk_cp_drink CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS fk_cp_combo CASCADE;
ALTER TABLE IF EXISTS ONLY public.account DROP CONSTRAINT IF EXISTS fk_account_role CASCADE;
DROP INDEX IF EXISTS public.uq_food_name_active;
DROP INDEX IF EXISTS public.uq_drink_name_active;
DROP INDEX IF EXISTS public.uq_combo_name_active;
ALTER TABLE IF EXISTS ONLY public.version DROP CONSTRAINT IF EXISTS version_version_name_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.version DROP CONSTRAINT IF EXISTS version_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule_seat DROP CONSTRAINT IF EXISTS uq_schedule_seat CASCADE;
ALTER TABLE IF EXISTS ONLY public.type DROP CONSTRAINT IF EXISTS type_type_name_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.type DROP CONSTRAINT IF EXISTS type_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.seat DROP CONSTRAINT IF EXISTS seat_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.score_transaction DROP CONSTRAINT IF EXISTS score_transaction_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule_seat DROP CONSTRAINT IF EXISTS schedule_seat_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.schedule DROP CONSTRAINT IF EXISTS schedule_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.room_format DROP CONSTRAINT IF EXISTS room_format_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.role DROP CONSTRAINT IF EXISTS role_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.promotion DROP CONSTRAINT IF EXISTS promotion_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.payment DROP CONSTRAINT IF EXISTS payment_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie_version DROP CONSTRAINT IF EXISTS movie_version_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie_type DROP CONSTRAINT IF EXISTS movie_type_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.movie DROP CONSTRAINT IF EXISTS movie_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.member DROP CONSTRAINT IF EXISTS member_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.member DROP CONSTRAINT IF EXISTS member_account_id_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice_seat DROP CONSTRAINT IF EXISTS invoice_seat_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.invoice DROP CONSTRAINT IF EXISTS invoice_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.golden_hour_config DROP CONSTRAINT IF EXISTS golden_hour_config_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.food DROP CONSTRAINT IF EXISTS food_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.employee DROP CONSTRAINT IF EXISTS employee_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.employee DROP CONSTRAINT IF EXISTS employee_account_id_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.drink DROP CONSTRAINT IF EXISTS drink_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS concession_price_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS concession_price_food_id_size_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS concession_price_drink_id_size_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.concession_price DROP CONSTRAINT IF EXISTS concession_price_combo_id_size_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.combo DROP CONSTRAINT IF EXISTS combo_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.cinema_room DROP CONSTRAINT IF EXISTS cinema_room_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.cinema_room DROP CONSTRAINT IF EXISTS cinema_room_cinema_room_name_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.cancelled_ticket DROP CONSTRAINT IF EXISTS cancelled_ticket_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.cancelled_ticket DROP CONSTRAINT IF EXISTS cancelled_ticket_invoice_id_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.account DROP CONSTRAINT IF EXISTS account_username_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.account DROP CONSTRAINT IF EXISTS account_pkey CASCADE;
ALTER TABLE IF EXISTS ONLY public.account DROP CONSTRAINT IF EXISTS account_phone_number_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.account DROP CONSTRAINT IF EXISTS account_identity_card_key CASCADE;
ALTER TABLE IF EXISTS ONLY public.account DROP CONSTRAINT IF EXISTS account_email_key CASCADE;
ALTER TABLE IF EXISTS public.version ALTER COLUMN version_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.type ALTER COLUMN type_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.seat ALTER COLUMN seat_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.score_transaction ALTER COLUMN txn_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.schedule_seat ALTER COLUMN schedule_seat_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.schedule ALTER COLUMN schedule_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.role ALTER COLUMN role_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.promotion ALTER COLUMN promotion_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.payment ALTER COLUMN payment_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.invoice_seat ALTER COLUMN invoice_seat_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.invoice ALTER COLUMN invoice_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.golden_hour_config ALTER COLUMN golden_hour_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.food ALTER COLUMN food_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.drink ALTER COLUMN drink_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.concession_price ALTER COLUMN concession_price_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.combo ALTER COLUMN combo_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.cinema_room ALTER COLUMN cinema_room_id DROP IDENTITY IF EXISTS;
ALTER TABLE IF EXISTS public.cancelled_ticket ALTER COLUMN cancelled_id DROP IDENTITY IF EXISTS;
DROP SEQUENCE IF EXISTS public.version_version_id_seq;
DROP TABLE IF EXISTS public.version;
DROP SEQUENCE IF EXISTS public.type_type_id_seq;
DROP TABLE IF EXISTS public.type;
DROP SEQUENCE IF EXISTS public.seat_seat_id_seq;
DROP TABLE IF EXISTS public.seat;
DROP SEQUENCE IF EXISTS public.score_transaction_txn_id_seq;
DROP TABLE IF EXISTS public.score_transaction;
DROP SEQUENCE IF EXISTS public.schedule_seat_schedule_seat_id_seq;
DROP TABLE IF EXISTS public.schedule_seat;
DROP SEQUENCE IF EXISTS public.schedule_schedule_id_seq;
DROP TABLE IF EXISTS public.schedule;
DROP TABLE IF EXISTS public.room_format;
DROP SEQUENCE IF EXISTS public.role_role_id_seq;
DROP TABLE IF EXISTS public.role;
DROP SEQUENCE IF EXISTS public.promotion_promotion_id_seq;
DROP TABLE IF EXISTS public.promotion;
DROP SEQUENCE IF EXISTS public.payment_payment_id_seq;
DROP TABLE IF EXISTS public.payment;
DROP TABLE IF EXISTS public.movie_version;
DROP TABLE IF EXISTS public.movie_type;
DROP TABLE IF EXISTS public.movie;
DROP TABLE IF EXISTS public.member;
DROP SEQUENCE IF EXISTS public.invoice_seat_invoice_seat_id_seq;
DROP TABLE IF EXISTS public.invoice_seat;
DROP SEQUENCE IF EXISTS public.invoice_invoice_id_seq;
DROP TABLE IF EXISTS public.invoice;
DROP SEQUENCE IF EXISTS public.golden_hour_config_golden_hour_id_seq;
DROP TABLE IF EXISTS public.golden_hour_config;
DROP SEQUENCE IF EXISTS public.food_food_id_seq;
DROP TABLE IF EXISTS public.food;
DROP TABLE IF EXISTS public.employee;
DROP SEQUENCE IF EXISTS public.drink_drink_id_seq;
DROP TABLE IF EXISTS public.drink;
DROP SEQUENCE IF EXISTS public.concession_price_concession_price_id_seq;
DROP TABLE IF EXISTS public.concession_price;
DROP SEQUENCE IF EXISTS public.combo_combo_id_seq;
DROP TABLE IF EXISTS public.combo;
DROP SEQUENCE IF EXISTS public.cinema_room_cinema_room_id_seq;
DROP TABLE IF EXISTS public.cinema_room;
DROP SEQUENCE IF EXISTS public.cancelled_ticket_cancelled_id_seq;
DROP TABLE IF EXISTS public.cancelled_ticket;
DROP TABLE IF EXISTS public.account;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    account_id character varying(36) NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(255),
    email character varying(255),
    phone_number character varying(20),
    address character varying(500),
    date_of_birth date,
    gender character varying(10),
    identity_card character varying(20),
    image character varying(500),
    register_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status integer DEFAULT 1,
    role_id integer NOT NULL,
    created_by character varying(50)
);




--
-- Name: cancelled_ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cancelled_ticket (
    cancelled_id integer NOT NULL,
    invoice_id integer,
    cancelled_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reason character varying(500),
    cancelled_by character varying(36),
    source character varying(10) DEFAULT 'member'::character varying,
    score_refunded integer DEFAULT 0
);




--
-- Name: cancelled_ticket_cancelled_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cancelled_ticket_cancelled_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: cancelled_ticket_cancelled_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cancelled_ticket_cancelled_id_seq OWNED BY public.cancelled_ticket.cancelled_id;


--
-- Name: cinema_room; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cinema_room (
    cinema_room_id integer NOT NULL,
    cinema_room_name character varying(100) NOT NULL,
    seat_quantity integer,
    status character varying(20) DEFAULT 'INACTIVE'::character varying NOT NULL
);




--
-- Name: cinema_room_cinema_room_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cinema_room_cinema_room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: cinema_room_cinema_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cinema_room_cinema_room_id_seq OWNED BY public.cinema_room.cinema_room_id;


--
-- Name: combo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combo (
    combo_id integer NOT NULL,
    combo_name character varying(150) NOT NULL,
    description text,
    image character varying(500),
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    CONSTRAINT chk_combo_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DELETED'::character varying])::text[])))
);




--
-- Name: combo_combo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.combo_combo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: combo_combo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.combo_combo_id_seq OWNED BY public.combo.combo_id;


--
-- Name: concession_price; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.concession_price (
    concession_price_id integer NOT NULL,
    food_id integer,
    drink_id integer,
    combo_id integer,
    size character varying(10) DEFAULT 'NONE'::character varying NOT NULL,
    price numeric(38,2) NOT NULL,
    CONSTRAINT chk_cp_owner CHECK ((num_nonnulls(food_id, drink_id, combo_id) = 1)),
    CONSTRAINT chk_cp_price CHECK ((price > (0)::numeric)),
    CONSTRAINT chk_cp_size CHECK (((size)::text = ANY ((ARRAY['NONE'::character varying, 'S'::character varying, 'M'::character varying, 'L'::character varying])::text[])))
);




--
-- Name: concession_price_concession_price_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.concession_price_concession_price_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: concession_price_concession_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.concession_price_concession_price_id_seq OWNED BY public.concession_price.concession_price_id;


--
-- Name: drink; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drink (
    drink_id integer NOT NULL,
    drink_name character varying(150) NOT NULL,
    description text,
    image character varying(500),
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    CONSTRAINT chk_drink_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DELETED'::character varying])::text[])))
);




--
-- Name: drink_drink_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drink_drink_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: drink_drink_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drink_drink_id_seq OWNED BY public.drink.drink_id;


--
-- Name: employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee (
    employee_id character varying(36) NOT NULL,
    account_id character varying(36)
);




--
-- Name: food; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food (
    food_id integer NOT NULL,
    food_name character varying(150) NOT NULL,
    description text,
    image character varying(500),
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    CONSTRAINT chk_food_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DELETED'::character varying])::text[])))
);




--
-- Name: food_food_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.food_food_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: food_food_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.food_food_id_seq OWNED BY public.food.food_id;


--
-- Name: golden_hour_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.golden_hour_config (
    golden_hour_id integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    days_of_week character varying(100) NOT NULL,
    extra_price numeric(38,2) NOT NULL,
    active boolean DEFAULT true NOT NULL
);




--
-- Name: golden_hour_config_golden_hour_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.golden_hour_config_golden_hour_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: golden_hour_config_golden_hour_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.golden_hour_config_golden_hour_id_seq OWNED BY public.golden_hour_config.golden_hour_id;


--
-- Name: invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice (
    invoice_id integer NOT NULL,
    account_id character varying(255),
    schedule_id integer,
    promotion_id integer,
    booking_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_money double precision DEFAULT 0,
    add_score integer DEFAULT 0,
    use_score integer DEFAULT 0,
    status integer DEFAULT 0,
    sold_by_account_id character varying(255)
);




--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_invoice_id_seq OWNED BY public.invoice.invoice_id;


--
-- Name: invoice_seat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_seat (
    invoice_seat_id integer NOT NULL,
    invoice_id integer,
    schedule_seat_id integer,
    price double precision
);




--
-- Name: invoice_seat_invoice_seat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_seat_invoice_seat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: invoice_seat_invoice_seat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_seat_invoice_seat_id_seq OWNED BY public.invoice_seat.invoice_seat_id;


--
-- Name: member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member (
    member_id character varying(255) NOT NULL,
    account_id character varying(36),
    score integer DEFAULT 0
);




--
-- Name: movie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie (
    movie_id character varying(36) NOT NULL,
    movie_name_english character varying(255),
    movie_name_vn character varying(255),
    director character varying(255),
    actor character varying(500),
    movie_production_company character varying(255),
    duration integer,
    trailer character varying(500),
    from_date date,
    to_date date,
    content text,
    large_image character varying(500),
    small_image character varying(500),
    status character varying(20)
);




--
-- Name: movie_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie_type (
    movie_id character varying(36) NOT NULL,
    type_id integer NOT NULL
);




--
-- Name: movie_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movie_version (
    movie_id character varying(36) NOT NULL,
    version_id integer NOT NULL
);




--
-- Name: payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment (
    payment_id integer NOT NULL,
    invoice_id integer,
    txn_ref character varying(255),
    payment_method character varying(255),
    amount double precision,
    payment_status character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_payment_id_seq OWNED BY public.payment.payment_id;


--
-- Name: promotion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotion (
    promotion_id integer NOT NULL,
    title character varying(150) NOT NULL,
    content text,
    detail text,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    promotion_value numeric(12,2) NOT NULL,
    discount_type character varying(20) NOT NULL,
    usage_limit integer,
    used_count integer DEFAULT 0 NOT NULL,
    image character varying(500),
    booking_url character varying(500),
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    applicable_day_of_week integer,
    applicable_start_time time without time zone,
    applicable_end_time time without time zone,
    birthday_only boolean DEFAULT false NOT NULL,
    is_deleted integer DEFAULT 0 NOT NULL,
    CONSTRAINT chk_promotion_applicable_time_order CHECK (((applicable_start_time IS NULL) OR (applicable_start_time < applicable_end_time))),
    CONSTRAINT chk_promotion_applicable_time_pair CHECK ((((applicable_start_time IS NULL) AND (applicable_end_time IS NULL)) OR ((applicable_start_time IS NOT NULL) AND (applicable_end_time IS NOT NULL)))),
    CONSTRAINT chk_promotion_day CHECK (((applicable_day_of_week IS NULL) OR ((applicable_day_of_week >= 1) AND (applicable_day_of_week <= 7)))),
    CONSTRAINT chk_promotion_deleted_flag CHECK ((is_deleted = ANY (ARRAY[0, 1]))),
    CONSTRAINT chk_promotion_discount_type CHECK (((discount_type)::text = ANY ((ARRAY['FIXED'::character varying, 'PERCENT'::character varying])::text[]))),
    CONSTRAINT chk_promotion_percent CHECK ((((discount_type)::text <> 'PERCENT'::text) OR (promotion_value <= (100)::numeric))),
    CONSTRAINT chk_promotion_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'DELETED'::character varying])::text[]))),
    CONSTRAINT chk_promotion_time CHECK ((start_time < end_time)),
    CONSTRAINT chk_promotion_usage_limit CHECK (((usage_limit IS NULL) OR (usage_limit > 0))),
    CONSTRAINT chk_promotion_used_count CHECK ((used_count >= 0)),
    CONSTRAINT chk_promotion_value CHECK ((promotion_value > (0)::numeric))
);




--
-- Name: promotion_promotion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promotion_promotion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: promotion_promotion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promotion_promotion_id_seq OWNED BY public.promotion.promotion_id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);




--
-- Name: role_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: role_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_role_id_seq OWNED BY public.role.role_id;


--
-- Name: room_format; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_format (
    cinema_room_id integer NOT NULL,
    version_id integer NOT NULL
);




--
-- Name: schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule (
    schedule_id integer NOT NULL,
    movie_id character varying(255),
    cinema_room_id integer,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    buffer_time integer DEFAULT 30,
    version_id integer,
    status character varying(20),
    CONSTRAINT schedule_status_check CHECK (((status)::text = ANY ((ARRAY['SCHEDULED'::character varying, 'SOLD_OUT'::character varying, 'CANCELLED'::character varying, 'DELETED'::character varying])::text[])))
);




--
-- Name: schedule_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: schedule_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_schedule_id_seq OWNED BY public.schedule.schedule_id;


--
-- Name: schedule_seat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_seat (
    schedule_seat_id integer NOT NULL,
    schedule_id integer,
    seat_id integer,
    seat_status integer DEFAULT 0,
    reserved_at timestamp without time zone,
    reserved_by character varying(255),
    CONSTRAINT chk_schedule_seat_status CHECK ((seat_status = ANY (ARRAY[0, 1, 2])))
);




--
-- Name: COLUMN schedule_seat.seat_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.schedule_seat.seat_status IS '0=AVAILABLE, 1=BOOKED, 2=DRAFT (đang giữ tạm chờ thanh toán)';


--
-- Name: schedule_seat_schedule_seat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_seat_schedule_seat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: schedule_seat_schedule_seat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_seat_schedule_seat_id_seq OWNED BY public.schedule_seat.schedule_seat_id;


--
-- Name: score_transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.score_transaction (
    txn_id integer NOT NULL,
    member_id character varying(255),
    invoice_id integer,
    txn_type character varying(255),
    points integer,
    balance_after double precision,
    txn_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: score_transaction_txn_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.score_transaction_txn_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: score_transaction_txn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.score_transaction_txn_id_seq OWNED BY public.score_transaction.txn_id;


--
-- Name: seat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seat (
    seat_id integer NOT NULL,
    cinema_room_id integer,
    seat_column character varying(5),
    seat_row integer,
    seat_type integer DEFAULT 0,
    pair_seat_id integer,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL
);




--
-- Name: seat_seat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seat_seat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: seat_seat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seat_seat_id_seq OWNED BY public.seat.seat_id;


--
-- Name: type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type (
    type_id integer NOT NULL,
    type_name character varying(100) NOT NULL
);




--
-- Name: type_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: type_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_type_id_seq OWNED BY public.type.type_id;


--
-- Name: version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.version (
    version_id integer NOT NULL,
    version_name character varying(100) NOT NULL,
    base_price numeric(38,2) NOT NULL,
    vip_price numeric(38,2) NOT NULL,
    couple_price numeric(38,2) NOT NULL
);




--
-- Name: version_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.version_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: version_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.version_version_id_seq OWNED BY public.version.version_id;


--
-- Name: cancelled_ticket cancelled_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_ticket ALTER COLUMN cancelled_id SET DEFAULT nextval('public.cancelled_ticket_cancelled_id_seq'::regclass);


--
-- Name: cinema_room cinema_room_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cinema_room ALTER COLUMN cinema_room_id SET DEFAULT nextval('public.cinema_room_cinema_room_id_seq'::regclass);


--
-- Name: combo combo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo ALTER COLUMN combo_id SET DEFAULT nextval('public.combo_combo_id_seq'::regclass);


--
-- Name: concession_price concession_price_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price ALTER COLUMN concession_price_id SET DEFAULT nextval('public.concession_price_concession_price_id_seq'::regclass);


--
-- Name: drink drink_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drink ALTER COLUMN drink_id SET DEFAULT nextval('public.drink_drink_id_seq'::regclass);


--
-- Name: food food_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food ALTER COLUMN food_id SET DEFAULT nextval('public.food_food_id_seq'::regclass);


--
-- Name: golden_hour_config golden_hour_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.golden_hour_config ALTER COLUMN golden_hour_id SET DEFAULT nextval('public.golden_hour_config_golden_hour_id_seq'::regclass);


--
-- Name: invoice invoice_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoice_invoice_id_seq'::regclass);


--
-- Name: invoice_seat invoice_seat_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_seat ALTER COLUMN invoice_seat_id SET DEFAULT nextval('public.invoice_seat_invoice_seat_id_seq'::regclass);


--
-- Name: payment payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment ALTER COLUMN payment_id SET DEFAULT nextval('public.payment_payment_id_seq'::regclass);


--
-- Name: promotion promotion_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion ALTER COLUMN promotion_id SET DEFAULT nextval('public.promotion_promotion_id_seq'::regclass);


--
-- Name: role role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN role_id SET DEFAULT nextval('public.role_role_id_seq'::regclass);


--
-- Name: schedule schedule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule ALTER COLUMN schedule_id SET DEFAULT nextval('public.schedule_schedule_id_seq'::regclass);


--
-- Name: schedule_seat schedule_seat_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_seat ALTER COLUMN schedule_seat_id SET DEFAULT nextval('public.schedule_seat_schedule_seat_id_seq'::regclass);


--
-- Name: score_transaction txn_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_transaction ALTER COLUMN txn_id SET DEFAULT nextval('public.score_transaction_txn_id_seq'::regclass);


--
-- Name: seat seat_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat ALTER COLUMN seat_id SET DEFAULT nextval('public.seat_seat_id_seq'::regclass);


--
-- Name: type type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type ALTER COLUMN type_id SET DEFAULT nextval('public.type_type_id_seq'::regclass);


--
-- Name: version version_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version ALTER COLUMN version_id SET DEFAULT nextval('public.version_version_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.account VALUES ('acc-01', 'admin', '$2a$10$enJ6UuAnPp5rXCRRXaRYGumO7OsATX6J6NuE4b.Sl59APIqTRGavO', 'Sếp Tổng', 'admin@mtms.vn', '0911111111', NULL, NULL, NULL, '111222333', NULL, '2026-07-20 08:26:24.764127', 1, 1, NULL);
INSERT INTO public.account VALUES ('acc-02', 'customer', '$2a$10$enJ6UuAnPp5rXCRRXaRYGumO7OsATX6J6NuE4b.Sl59APIqTRGavO', 'Khách Vip', 'customer@mtms.vn', '0922222222', NULL, NULL, NULL, '222333444', NULL, '2026-07-20 08:26:24.764127', 1, 2, NULL);
INSERT INTO public.account VALUES ('acc-03', 'employee', '$2a$10$enJ6UuAnPp5rXCRRXaRYGumO7OsATX6J6NuE4b.Sl59APIqTRGavO', 'Nhân viên vé', 'nv@mtms.vn', '0933333333', NULL, NULL, NULL, '333444555', NULL, '2026-07-20 08:26:24.764127', 1, 3, NULL);
INSERT INTO public.account VALUES ('3fc816e9-74d9-4b06-84ee-87efee4f8ecb', 'testuser_auto_99', '$2a$10$p6DRQwnbMI52fEmh85pmjuuiy6Mzri3ktPT434fL9nkRDyFRAO1by', 'Auto Test', 'autotest99@example.com', '0999999999', NULL, NULL, NULL, NULL, NULL, '2026-07-23 21:07:54.929525', 0, 2, 'Customer');


--
-- Data for Name: cancelled_ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cinema_room; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.cinema_room VALUES (1, 'Phòng 1', 80, 'ACTIVE');
INSERT INTO public.cinema_room VALUES (2, 'Phòng 2', 80, 'ACTIVE');
INSERT INTO public.cinema_room VALUES (3, 'Phòng 3', 100, 'ACTIVE');
INSERT INTO public.cinema_room VALUES (4, 'Phòng 4', 48, 'ACTIVE');
INSERT INTO public.cinema_room VALUES (5, 'Phòng 5', 80, 'ACTIVE');


--
-- Data for Name: combo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.combo VALUES (1, 'Solo Combo', '1 medium popcorn + 1 medium drink', 'https://images.pexels.com/photos/7234254/pexels-photo-7234254.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.combo VALUES (2, 'Couple Combo', '1 large popcorn + 2 large drinks', 'https://images.pexels.com/photos/7234253/pexels-photo-7234253.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.combo VALUES (3, 'Family Combo', '2 large popcorns + 4 medium drinks', 'https://images.pexels.com/photos/7328496/pexels-photo-7328496.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.combo VALUES (4, 'Combo Couple Vip', '2 Bap M + 2 Coca L', 'https://example.com/combo.jpg', 'ACTIVE');


--
-- Data for Name: concession_price; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.concession_price VALUES (4, 2, NULL, NULL, 'S', 50000.00);
INSERT INTO public.concession_price VALUES (5, 2, NULL, NULL, 'M', 60000.00);
INSERT INTO public.concession_price VALUES (6, 2, NULL, NULL, 'L', 70000.00);
INSERT INTO public.concession_price VALUES (7, 3, NULL, NULL, 'NONE', 40000.00);
INSERT INTO public.concession_price VALUES (8, 4, NULL, NULL, 'NONE', 65000.00);
INSERT INTO public.concession_price VALUES (9, NULL, 1, NULL, 'M', 35000.00);
INSERT INTO public.concession_price VALUES (10, NULL, 1, NULL, 'L', 45000.00);
INSERT INTO public.concession_price VALUES (11, NULL, 2, NULL, 'M', 35000.00);
INSERT INTO public.concession_price VALUES (12, NULL, 2, NULL, 'L', 45000.00);
INSERT INTO public.concession_price VALUES (13, NULL, 3, NULL, 'NONE', 25000.00);
INSERT INTO public.concession_price VALUES (14, NULL, NULL, 1, 'NONE', 89000.00);
INSERT INTO public.concession_price VALUES (15, NULL, NULL, 2, 'NONE', 159000.00);
INSERT INTO public.concession_price VALUES (16, NULL, NULL, 3, 'NONE', 219000.00);
INSERT INTO public.concession_price VALUES (17, 5, NULL, NULL, 'M', 45000.00);
INSERT INTO public.concession_price VALUES (18, 5, NULL, NULL, 'L', 55000.00);
INSERT INTO public.concession_price VALUES (19, NULL, 4, NULL, 'M', 30000.00);
INSERT INTO public.concession_price VALUES (20, NULL, 4, NULL, 'L', 35000.00);
INSERT INTO public.concession_price VALUES (21, NULL, NULL, 4, 'NONE', 120000.00);
INSERT INTO public.concession_price VALUES (29, 1, NULL, NULL, 'NONE', 44.00);


--
-- Data for Name: drink; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.drink VALUES (1, 'Coca-Cola', NULL, 'https://images.pexels.com/photos/8879617/pexels-photo-8879617.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.drink VALUES (2, 'Sprite', NULL, 'https://images.pexels.com/photos/9996448/pexels-photo-9996448.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.drink VALUES (3, 'Bottled Water', NULL, 'https://images.pexels.com/photos/31699476/pexels-photo-31699476/free-photo-of-close-up-of-plastic-bottles-with-green-caps.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.drink VALUES (4, 'Coca Cola Zero', 'Nuoc ngot khong duong', 'https://example.com/coca.jpg', 'ACTIVE');


--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employee VALUES ('emp-01', 'acc-03');


--
-- Data for Name: food; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.food VALUES (1, 'Sweet Popcorn', NULL, 'https://images.pexels.com/photos/8652476/pexels-photo-8652476.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.food VALUES (2, 'Cheese Popcorn', NULL, 'https://images.pexels.com/photos/5603924/pexels-photo-5603924.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.food VALUES (3, 'Hotdog', NULL, 'https://images.pexels.com/photos/4113470/pexels-photo-4113470.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.food VALUES (4, 'Snack Tray', NULL, 'https://images.pexels.com/photos/12557546/pexels-photo-12557546.jpeg?cs=tinysrgb&dpr=1&w=500', 'ACTIVE');
INSERT INTO public.food VALUES (5, 'Bap Bo Pho Mai', 'Bap bo vi pho mai thom ngon', 'https://example.com/popcorn.jpg', 'ACTIVE');


--
-- Data for Name: golden_hour_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.golden_hour_config VALUES (1, '18:00:00', '21:00:00', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY', 20000.00, true);


--
-- Data for Name: invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.invoice VALUES (1, 'acc-02', 183, NULL, '2026-07-20 08:30:15.417944', 140000, 7, 0, 1, NULL);
INSERT INTO public.invoice VALUES (2, 'acc-02', 1, NULL, '2026-07-20 08:37:25.698034', 70000, 3, 0, 1, NULL);
INSERT INTO public.invoice VALUES (4, 'acc-02', 2, NULL, '2026-07-20 08:49:56.947797', 527000, 26, 0, 1, NULL);
INSERT INTO public.invoice VALUES (5, 'acc-02', 2, NULL, '2026-07-20 08:50:42.614013', 349000, 17, 0, 1, NULL);
INSERT INTO public.invoice VALUES (3, 'acc-02', 184, NULL, '2026-07-20 08:45:28.151907', 140000, 7, 0, 2, NULL);
INSERT INTO public.invoice VALUES (6, 'acc-02', 31, NULL, '2026-07-21 08:52:26.909193', 448000, 22, 0, 1, NULL);
INSERT INTO public.invoice VALUES (7, 'acc-02', 31, NULL, '2026-07-21 08:52:38.264628', 259000, 12, 0, 1, NULL);
INSERT INTO public.invoice VALUES (8, NULL, 1, NULL, '2026-07-23 21:19:24.777786', 70000, 0, 0, 1, 'acc-03');
INSERT INTO public.invoice VALUES (9, 'acc-02', 190, NULL, '2026-07-23 21:31:40.156067', 90000, 4, 0, 2, NULL);
INSERT INTO public.invoice VALUES (10, 'acc-02', 127, NULL, '2026-07-24 08:43:10.180343', 289000, 14, 0, 2, NULL);
INSERT INTO public.invoice VALUES (11, 'acc-02', 106, NULL, '2026-07-24 09:59:25.085925', 100000, 5, 0, 1, NULL);
INSERT INTO public.invoice VALUES (12, 'acc-02', 131, NULL, '2026-07-24 10:27:39.257658', 456000, 22, 114, 2, NULL);
INSERT INTO public.invoice VALUES (13, 'acc-01', 156, NULL, '2026-07-24 16:29:53.846953', 300000, 15, 0, 1, NULL);


--
-- Data for Name: invoice_seat; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.invoice_seat VALUES (1, 1, 1, 90000);
INSERT INTO public.invoice_seat VALUES (2, 1, 2, 90000);
INSERT INTO public.invoice_seat VALUES (3, 2, 3, 70000);
INSERT INTO public.invoice_seat VALUES (4, 3, 4, 120000);
INSERT INTO public.invoice_seat VALUES (5, 3, 5, 120000);
INSERT INTO public.invoice_seat VALUES (6, 4, 6, 130000);
INSERT INTO public.invoice_seat VALUES (7, 5, 7, 130000);
INSERT INTO public.invoice_seat VALUES (8, 6, 8, 100000);
INSERT INTO public.invoice_seat VALUES (9, 6, 9, 100000);
INSERT INTO public.invoice_seat VALUES (10, 7, 10, 100000);
INSERT INTO public.invoice_seat VALUES (11, 8, 12, 70000);
INSERT INTO public.invoice_seat VALUES (12, 9, 23, 70000);
INSERT INTO public.invoice_seat VALUES (13, 10, 27, 100000);
INSERT INTO public.invoice_seat VALUES (14, 10, 28, 100000);
INSERT INTO public.invoice_seat VALUES (15, 11, 38, 100000);
INSERT INTO public.invoice_seat VALUES (16, 12, 40, 100000);
INSERT INTO public.invoice_seat VALUES (17, 12, 41, 100000);
INSERT INTO public.invoice_seat VALUES (18, 12, 42, 100000);
INSERT INTO public.invoice_seat VALUES (19, 12, 43, 70000);
INSERT INTO public.invoice_seat VALUES (20, 12, 44, 100000);
INSERT INTO public.invoice_seat VALUES (21, 12, 45, 100000);
INSERT INTO public.invoice_seat VALUES (22, 13, 51, 100000);
INSERT INTO public.invoice_seat VALUES (23, 13, 48, 100000);
INSERT INTO public.invoice_seat VALUES (24, 13, 47, 100000);


--
-- Data for Name: member; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.member VALUES ('ea34b003-a2b9-4e26-a0f5-e4e7120269ec', '3fc816e9-74d9-4b06-84ee-87efee4f8ecb', 0);
INSERT INTO public.member VALUES ('mem-01', 'acc-02', 342);


--
-- Data for Name: movie; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.movie VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Inception', 'Kẻ Đánh Cắp Giấc Mơ', 'Christopher Nolan', 'Leonardo DiCaprio', 'Warner Bros.', 148, 'https://www.youtube.com/embed/YoHD9XEInc0', '2026-06-01', '2026-08-31', 'A thief who steals corporate secrets through use of dream-sharing technology.', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('550e8400-e29b-41d4-a716-446655440002', 'Interstellar', 'Hố Đen Tử Thần', 'Christopher Nolan', 'Matthew McConaughey', 'Paramount Pictures', 169, 'https://www.youtube.com/embed/zSWdZAToXRw', '2026-06-15', '2026-08-31', 'A team of explorers travel through a wormhole in space.', 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg', 'DELETED');
INSERT INTO public.movie VALUES ('550e8400-e29b-41d4-a716-446655440003', 'The Hangover', 'Ba Chàng Ngự Lâm', 'Todd Phillips', 'Bradley Cooper', 'Warner Bros.', 100, 'https://www.youtube.com/embed/tcdUjFnMduI', '2026-06-20', '2026-08-31', 'Three friends wake up from a bachelor party in Las Vegas.', 'https://upload.wikimedia.org/wikipedia/en/b/b9/Hangoverposter09.jpg', 'https://upload.wikimedia.org/wikipedia/en/b/b9/Hangoverposter09.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('550e8400-e29b-41d4-a716-446655440004', 'The Conjuring', 'Ám Ảnh Kinh Hoàng', 'James Wan', 'Vera Farmiga', 'New Line Cinema', 112, 'https://www.youtube.com/embed/k10ETZ42q5o', '2026-06-25', '2026-08-31', 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized.', 'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Conjuring_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Conjuring_poster.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('550e8400-e29b-41d4-a716-446655440005', 'Avatar', 'Thế Thân', 'James Cameron', 'Sam Worthington', '20th Century Fox', 162, 'https://www.youtube.com/embed/5PSNL1q36VY', '2026-07-01', '2026-08-31', 'A paraplegic marine dispatched to the moon Pandora on a unique mission.', 'https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg', 'https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('supergirl', 'SUPERGIRL', 'SUPERGIRL', 'Craig Gillespie', 'Milly Alcock, Matthias Schoenaerts, Eve Ridley, David Krumholtz, Emily Beecham, Jason Momoa', '', 108, 'https://www.youtube.com/embed/vvhWi0hzO-w', '2026-06-26', '2026-08-25', '“Supergirl” – bom tấn mới nhất từ DC Studios – sẽ chính thức đổ bộ các rạp chiếu toàn cầu vào mùa hè này, với Milly Alcock đảm nhận vai kép Supergirl/Kara Zor-El.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/m/a/main_poster_supergirl_t13_5.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/m/a/main_poster_supergirl_t13_5.jpg', 'DELETED');
INSERT INTO public.movie VALUES ('obsession', 'OBSESSION', 'ÁM ẢNH', 'Curry Barker', 'Michael Johnston, Inde Navarrette, Cooper Tomlinson, Megan Lawless, Andy Richter', '', 109, 'https://www.youtube.com/embed/wPZOlaGhDFA', '2026-06-19', '2026-08-18', 'Bear, một chàng trai si tình, đã bẻ gãy món đồ chơi bí ẩn mang tên "Liễu Ước Nguyện" để đổi lấy tình yêu của cô gái mình thầm thương. Điều ước nhanh chóng trở thành hiện thực, nhưng hạnh phúc mà anh hằng mong đợi lại dần biến thành cơn ác mộng.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/o/b/obs_payoff_1920x1080.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/o/b/obs_payoff_470x700.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('toy-story-5', 'TOY STORY 5', 'CÂU CHUYỆN ĐỒ CHƠI 5', 'Kenna Harris, Andrew Stanton', 'Keanu Reeves, Tom Hanks, Annie Potts', '', 102, 'https://www.youtube.com/embed/V05gf0OnpU4', '2026-06-19', '2026-08-18', 'Các món đồ chơi đã trở lại trong Toy Story 5 của Disney và Pixar, và lần này sẽ là cuộc đối đầu giữa đồ chơi và công nghệ.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/p/o/poster_cau_chuyen_do_choi_5_.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_cau_chuyen_do_choi_5_.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('backrooms', 'BACKROOMS', 'BACKROOMS: THỰC THỂ QUỶ QUYỆT', 'Kane Parsons', 'Chiwetel Ejiofor, Renate Reinsve, Mark Duplass', '', 110, 'https://www.youtube.com/embed/s5vWwGFiS8M', '2026-06-26', '2026-08-25', 'Clark (Chiwetel Ejiofor), một chủ cửa hàng nội thất, vô tình phát hiện cánh cửa bí ẩn dưới tầng hầm. Bước qua đó, anh bị cuốn vào một chiều không gian vô tinh với những căn phòng màu vàng méo mó, liên tục lặp lại.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-backroom.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-backroom.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('colony', 'COLONY', 'COLONY: BẦY XÁC SỐNG', 'YEON Sang-ho', 'Gianna JUN, KOO Kyo-hwan, JI Chang-wook, Shin Hyun-been, KIM Shin-rock, GO Soo', '', 122, 'https://www.youtube.com/embed/NI5iE1R8HgQ', '2026-06-12', '2026-08-11', 'Khi một dịch bệnh bí ẩn bùng phát tại tòa cao ốc giữa trung tâm Seoul, những người sống sót bị mắc kẹt và buộc phải chiến đấu để thoát thân.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-colony.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-colony.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('lau-chu-hoa', 'LAU CHU HOA', 'LẦU CHÚ HỎA', 'HÙNG TRẦN', 'TRẦN KỲ ANH, NGUYỄN MINH THỜI, NGỌC CHI BẢO, PHỤNG HOÀNG, NGUYỄN CÔNG NƯƠNG, DŨNG HÀ', '', 94, 'https://www.youtube.com/embed/bN0_D-k-2r8', '2026-06-12', '2026-08-11', 'Một nhóm streamer livestream khám phá Lầu Chú Hỏa, dinh thự bỏ hoang gắn với truyền thuyết về con ma nhà họ Hứa. Buổi livestream nhanh chóng biến thành nơi “tạo nghiệp – trả nghiệp”.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/-/l/-lch.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-lch.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('madames-thanh-sac', 'MADAMES THANH SAC', 'MESDAMES THANH SẮC', 'Thắng Vũ', 'Thanh Hằng, Hồng Ánh, Lương Thế Thành', '', 125, 'https://www.youtube.com/embed/FIoDvHBZjUs', '2026-06-19', '2026-08-18', 'Cuộc đời của đại mỹ nhân Cầm Thanh và Madame Sắc - bà chủ vũ trường Kim Đô giàu có và sở hữu nhiều kim cương.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/m/a/madames_main_thumb.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/m/a/main_mts_cinema.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('caged-butterfly', 'CAGED BUTTERFLY', 'MINH HÔN TRONG LỒNG BƯỚM', 'Hạo Hàn - Vương Triết', 'Lý Mộng, Khương Trác Quân, Lưu Tư Vỹ, Chu Triết, Vương Ninh', '', 91, 'https://www.youtube.com/embed/OVhwV0VbI2I', '2026-06-26', '2026-08-25', 'Biệt thự nhà họ Lục, hay còn gọi diệp phủ, từ lâu nổi tiếng là một căn nhà ma ám đầy bí ẩn. Nhiều hiện tượng kinh hoàng liên tiếp xảy ra.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/1/0/1080wx650h-minhhon.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-minhon.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('once-a-thief', 'ONCE A THIEF', 'TUNG HOÀNH TỨ HẢI', 'John Woo', 'Chow Yun Fat, Leslie Cheung, Cherie Chung, Kenneth Tsang', '', 109, 'https://www.youtube.com/embed/-DT1isH9qbM', '2026-06-26', '2026-08-25', 'Ba đứa trẻ mồ côi được một tên siêu trộm nuôi dưỡng và đào tạo thành những tên trộm khét tiếng nhất Hong Kong.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/1/0/1080wx608h-thief.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-thief.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('lieu-trai-nhuoc-tu', 'LIEU TRAI', 'LIÊU TRAI LAN NHƯỢT TỰ', 'Yuemei Cui, Heyu Huang, Yilin Liu', NULL, '', 112, 'https://www.youtube.com/embed/T4UZUKHgR0k', '2026-06-26', '2026-08-25', 'Siêu phẩm kỹ xảo từ Light Chaser làm sống dậy Liêu Trai Chí Dị của Bồ Tùng Linh.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-lieutrai.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-lieutrai.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('ponyo', 'PONYO', 'CÔ BÉ PONY O', 'MIYAZAKI HAYAO', NULL, '', 101, 'https://www.youtube.com/embed/JjRBesJJQ8E', '2026-06-12', '2026-08-11', 'Cô bé cá vàng Ponyo gặp cậu bé Sosuke và bắt đầu hành trình kỳ diệu.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/p/o/poster_kctr_-_c_b_ponyo.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_kctr_-_c_b_ponyo.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('devil-black-cat', 'DEVIL BLACK CAT', 'LINH MIÊU BÁO THÙ', 'Anuwat Thanomrod', 'Anna Glucks, Indy Intad Leowrakwong, Wayne Falconer, Nuttanee Sittisamarn', '', 87, NULL, '2026-06-26', '2026-08-25', 'Sarah đến một ngôi làng bị ám bởi truyền thuyết về Quỷ Mèo Đen và khám phá nghi lễ hiến tế cổ xưa.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-linhmiu.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-linhmiu.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('your-name', 'YOUR NAME', 'TÊN CẬU LÀ GÌ', 'Shinkai Makoto', 'Kamiki Ryunosuke, Kamishiraishi Mone, Narita Ryo', '', 107, NULL, '2026-06-05', '2026-08-04', 'Hai nhân vật vô tình bị hoán đổi thân thể qua những giấc mơ.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/y/o/your_name_localized_adaptation_social_1920_x_1080.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/y/o/your_name_localized_adaptation_social_470_x_700.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('yen-chi-khau', 'YEN CHI KHAU', 'YÊN CHI KHÂU', 'STANLEY KWAN', 'Trương Quốc Vinh, Mai Diễm Phương', '', 98, 'https://www.youtube.com/embed/E6Hn9mr53dM', '2026-06-12', '2026-08-11', 'Một tác phẩm kinh điển điện ảnh nghệ thuật đầy cảm xúc.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/1/0/1080wx650h-yck.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470wx700h-yck.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('assassination-classroom', 'ASSASSINATION CLASSROOM', 'LỚP HỌC ÁM SÁT: GIỜ CỦA CHÚNG TA', 'Masaki Kitamura', 'Shintarô Asanuma, Mai Fuchigami, Saki Fujita', '', 86, 'https://www.youtube.com/embed/bjkwRzGSe-E', '2026-06-05', '2026-08-04', 'Một sinh vật tốc độ Mach 20 trở thành thầy giáo của lớp học đặc biệt.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-assassin.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-assassin.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('marsupilami', 'MARSUPILAMI', 'SIÊU QUẬY MARSUPILAMI', 'Philippe Lacheau', 'Philippe Lacheau, Jamel Debbouze, Tarek Boudali', '', 99, 'https://www.youtube.com/embed/xzc6xQfWq4E', '2026-06-05', '2026-08-04', 'Một cuộc phiêu lưu hài hước xoay quanh sinh vật Marsupilami.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/4/7/470x700marsu.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/4/7/470x700marsu.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('gohan', 'GOHAN', 'TẠM BIỆT GOHAN', 'Chayanop Boonprakob - Baz Poonpiriya - Atta Hemwadee', 'Yasushi Kitajima, Poe Mamhe Thar, Jinjett Wattanasin, Tontawan Tantivejakul', '', 140, 'https://www.youtube.com/embed/PaGtIdi8ONk', '2026-05-15', '2026-07-14', 'Câu chuyện cảm động về thời gian, hội ngộ và chia ly cùng một chú chó.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/t/h/thumb_3.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/2/_/2.2._gohan_-_main_poster_-_size_web_app.jpg', 'ENDED');
INSERT INTO public.movie VALUES ('oc-muon-hon', 'OC MUON HON', 'ỐC MƯỢN HỒN', 'Đinh Tuấn Vũ', 'Quốc Trường, Tiểu Vy, Anh Phạm, Yên Đan, Anh Đức, Lương Gia Huy, Nguyễn Văn Chung', '', 109, 'https://www.youtube.com/embed/-HoO0gKvxhM', '2026-06-01', '2026-07-31', '"ỐC MƯỢN HỒN - MÀN "MƯỢN XÁC HOÀN HỒN" CHÍNH THẤT & TIỂU TAM TÁO BẠO NHẤT HÈ NÀY!', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-omh_1.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-omh_1.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('michael', 'MICHAEL', 'MICHAEL', 'Antoine Fuqua', 'Jaafar Jackson, Nia Long, Laura Harrier, Juliano Krue Valdi, Miles Teller, Colman Domingo', '', 127, 'https://www.youtube.com/embed/q-Ap6oHz1js', '2026-04-22', '2026-06-21', 'Bộ phim mang đến góc nhìn chân thực hơn về Michael Jackson.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/m/v/mvn_badonesheet_700x1000.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/m/v/mvn_badonesheet_700x1000.jpg', 'ENDED');
INSERT INTO public.movie VALUES ('white-snake', 'WHITE SNAKE', 'BẠCH XÀ: MỘT KIẾP NHÂN GIAN', 'Jianxi Chen, Jiakai Li', NULL, NULL, 133, 'https://www.youtube.com/embed/ldWM08f3zL0', '2026-06-19', '2026-08-18', 'Bạch Tố Trinh bước vào thế giới loài người để báo đáp ân tình trong quá khứ.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/6/4/640x396-bachxa.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/3/5/350x495-bachxa.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('kings-warden', 'KINGS WARDEN', 'DƯỚI BÓNG ĐIỆN HẠ', 'Chang Hang-jun', 'Yoo Hai-jin, Park Ji-hoon, Yoo Ji-tae, Jeon Mi-do', '', 117, 'https://www.youtube.com/embed/aPsEOR-WK6U', '2026-04-10', '2026-06-09', 'Vị vua trẻ Danjong bị lật đổ và đày đến vùng Cheongnyeongpo.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/t/h/thumb-main_1_5.jpg', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/t/h/the_king_s_warden_main_poster.jpg', 'ENDED');
INSERT INTO public.movie VALUES ('5b1c9335-c698-4053-812a-19e9fad75128', 'Avatar 3: Fire and Ash', 'Avatar 3: Lua Va Tro', 'James Cameron', 'Sam Worthington, Zoe Saldana', '20th Century Studios', 190, 'https://www.youtube.com/watch?v=avatar3', '2026-07-20', '2026-09-30', 'Hanh trinh ky thu cua toc Na''vi chong lai bo toc tro tan Pandora.', 'https://example.com/avatar3_large.jpg', 'https://example.com/avatar3_small.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('221d7710-5738-4bb9-a32f-c31b387e5438', 'Avatar 3: Fire and Ash', 'Avatar 3: Lua Va Tro', 'James Cameron', 'Sam Worthington, Zoe Saldana', '20th Century Studios', 190, 'https://www.youtube.com/watch?v=avatar3', '2026-07-20', '2026-09-30', 'Hanh trinh ky thu cua toc Na''vi chong lai bo toc tro tan Pandora.', 'https://example.com/avatar3_large.jpg', 'https://example.com/avatar3_small.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('5f5b04c2-ce0f-4e48-af9e-a0e24d773135', 'Avatar 1784511890: Fire and Ash', 'Avatar 3: Lua Va Tro', 'James Cameron', 'Sam Worthington, Zoe Saldana', '20th Century Studios', 190, 'https://www.youtube.com/watch?v=avatar3', '2026-07-20', '2026-09-30', 'Hanh trinh ky thu cua toc Na''vi chong lai bo toc tro tan Pandora.', 'https://example.com/avatar3_large.jpg', 'https://example.com/avatar3_small.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('baadf72e-abd9-4bd9-afba-e3dc6a361983', 'Avatar 1784511898: Fire and Ash', 'Avatar 3: Lua Va Tro', 'James Cameron', 'Sam Worthington, Zoe Saldana', '20th Century Studios', 120, 'https://www.youtube.com/watch?v=avatar3', '2026-07-20', '2026-09-30', 'Hanh trinh ky thu cua toc Na''vi chong lai bo toc tro tan Pandora.', 'https://example.com/avatar3_large.jpg', 'https://example.com/avatar3_small.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('c9071ace-9fdb-415a-ab1e-73767696ec18', 'Avatar 1784511911: Fire and Ash', 'Avatar 3: Lua Va Tro', 'James Cameron', 'Sam Worthington, Zoe Saldana', '20th Century Studios', 120, 'https://www.youtube.com/watch?v=avatar3', '2026-07-20', '2026-09-30', 'Hanh trinh ky thu cua toc Na''vi chong lai bo toc tro tan Pandora.', 'https://example.com/avatar3_large.jpg', 'https://example.com/avatar3_small.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('5cd28958-9be9-41dc-b852-602252933e5f', 'Avatar 1784511927: Fire and Ash', 'Avatar 3: Lua Va Tro', 'James Cameron', 'Sam Worthington, Zoe Saldana', '20th Century Studios', 120, 'https://www.youtube.com/watch?v=avatar3', '2026-07-20', '2026-09-30', 'Hanh trinh ky thu cua toc Na''vi chong lai bo toc tro tan Pandora.', 'https://example.com/avatar3_large.jpg', 'https://example.com/avatar3_small.jpg', 'SHOWING');
INSERT INTO public.movie VALUES ('doraemon-movie-45', 'DORAEMON MOVIE 45', 'NOBITA VÀ LÂU ĐÀI DƯỚI ĐÁY BIỂN', 'Tetsuo Yajima', 'Wasabi Mizuta, Megumi Oohara, Yumi Kakazu, Subaru Kimura, Tomokazu Seki', '', 101, 'https://www.youtube.com/embed/u3JgYkmuK78', '2026-05-22', '2026-07-21', 'Nobita và các bạn quyết định cắm trại giữa lòng đại dương theo đề xuất của Doraemon.', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/small_image/600x314/a134659ca47b28f7b266e1777fbf870f/9/8/980x448__1_.png', 'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/o/poster_doraemon_movie_2026_g_c.jpg', 'ENDED');


--
-- Data for Name: movie_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440001', 1);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440001', 5);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440002', 1);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440002', 5);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440003', 4);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440004', 2);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440005', 1);
INSERT INTO public.movie_type VALUES ('550e8400-e29b-41d4-a716-446655440005', 5);
INSERT INTO public.movie_type VALUES ('supergirl', 1);
INSERT INTO public.movie_type VALUES ('supergirl', 5);
INSERT INTO public.movie_type VALUES ('obsession', 2);
INSERT INTO public.movie_type VALUES ('toy-story-5', 4);
INSERT INTO public.movie_type VALUES ('backrooms', 2);
INSERT INTO public.movie_type VALUES ('colony', 2);
INSERT INTO public.movie_type VALUES ('lau-chu-hoa', 2);
INSERT INTO public.movie_type VALUES ('madames-thanh-sac', 3);
INSERT INTO public.movie_type VALUES ('caged-butterfly', 2);
INSERT INTO public.movie_type VALUES ('once-a-thief', 1);
INSERT INTO public.movie_type VALUES ('doraemon-movie-45', 4);
INSERT INTO public.movie_type VALUES ('lieu-trai-nhuoc-tu', 5);
INSERT INTO public.movie_type VALUES ('ponyo', 4);
INSERT INTO public.movie_type VALUES ('devil-black-cat', 2);
INSERT INTO public.movie_type VALUES ('your-name', 3);
INSERT INTO public.movie_type VALUES ('yen-chi-khau', 3);
INSERT INTO public.movie_type VALUES ('assassination-classroom', 4);
INSERT INTO public.movie_type VALUES ('marsupilami', 4);
INSERT INTO public.movie_type VALUES ('gohan', 3);
INSERT INTO public.movie_type VALUES ('oc-muon-hon', 2);
INSERT INTO public.movie_type VALUES ('michael', 3);
INSERT INTO public.movie_type VALUES ('kings-warden', 1);
INSERT INTO public.movie_type VALUES ('5b1c9335-c698-4053-812a-19e9fad75128', 5);
INSERT INTO public.movie_type VALUES ('5b1c9335-c698-4053-812a-19e9fad75128', 1);
INSERT INTO public.movie_type VALUES ('221d7710-5738-4bb9-a32f-c31b387e5438', 1);
INSERT INTO public.movie_type VALUES ('221d7710-5738-4bb9-a32f-c31b387e5438', 5);
INSERT INTO public.movie_type VALUES ('5f5b04c2-ce0f-4e48-af9e-a0e24d773135', 5);
INSERT INTO public.movie_type VALUES ('5f5b04c2-ce0f-4e48-af9e-a0e24d773135', 1);
INSERT INTO public.movie_type VALUES ('baadf72e-abd9-4bd9-afba-e3dc6a361983', 1);
INSERT INTO public.movie_type VALUES ('baadf72e-abd9-4bd9-afba-e3dc6a361983', 5);
INSERT INTO public.movie_type VALUES ('c9071ace-9fdb-415a-ab1e-73767696ec18', 5);
INSERT INTO public.movie_type VALUES ('c9071ace-9fdb-415a-ab1e-73767696ec18', 1);
INSERT INTO public.movie_type VALUES ('5cd28958-9be9-41dc-b852-602252933e5f', 5);
INSERT INTO public.movie_type VALUES ('5cd28958-9be9-41dc-b852-602252933e5f', 1);
INSERT INTO public.movie_type VALUES ('white-snake', 3);


--
-- Data for Name: movie_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.movie_version VALUES ('550e8400-e29b-41d4-a716-446655440001', 1);
INSERT INTO public.movie_version VALUES ('550e8400-e29b-41d4-a716-446655440002', 3);
INSERT INTO public.movie_version VALUES ('550e8400-e29b-41d4-a716-446655440003', 1);
INSERT INTO public.movie_version VALUES ('550e8400-e29b-41d4-a716-446655440004', 2);
INSERT INTO public.movie_version VALUES ('550e8400-e29b-41d4-a716-446655440005', 4);
INSERT INTO public.movie_version VALUES ('supergirl', 1);
INSERT INTO public.movie_version VALUES ('supergirl', 2);
INSERT INTO public.movie_version VALUES ('obsession', 1);
INSERT INTO public.movie_version VALUES ('toy-story-5', 1);
INSERT INTO public.movie_version VALUES ('backrooms', 1);
INSERT INTO public.movie_version VALUES ('colony', 1);
INSERT INTO public.movie_version VALUES ('lau-chu-hoa', 1);
INSERT INTO public.movie_version VALUES ('madames-thanh-sac', 1);
INSERT INTO public.movie_version VALUES ('caged-butterfly', 1);
INSERT INTO public.movie_version VALUES ('once-a-thief', 1);
INSERT INTO public.movie_version VALUES ('doraemon-movie-45', 1);
INSERT INTO public.movie_version VALUES ('lieu-trai-nhuoc-tu', 1);
INSERT INTO public.movie_version VALUES ('ponyo', 1);
INSERT INTO public.movie_version VALUES ('devil-black-cat', 1);
INSERT INTO public.movie_version VALUES ('your-name', 1);
INSERT INTO public.movie_version VALUES ('yen-chi-khau', 1);
INSERT INTO public.movie_version VALUES ('assassination-classroom', 1);
INSERT INTO public.movie_version VALUES ('marsupilami', 1);
INSERT INTO public.movie_version VALUES ('gohan', 1);
INSERT INTO public.movie_version VALUES ('oc-muon-hon', 1);
INSERT INTO public.movie_version VALUES ('michael', 1);
INSERT INTO public.movie_version VALUES ('kings-warden', 1);
INSERT INTO public.movie_version VALUES ('5b1c9335-c698-4053-812a-19e9fad75128', 3);
INSERT INTO public.movie_version VALUES ('5b1c9335-c698-4053-812a-19e9fad75128', 2);
INSERT INTO public.movie_version VALUES ('5b1c9335-c698-4053-812a-19e9fad75128', 1);
INSERT INTO public.movie_version VALUES ('221d7710-5738-4bb9-a32f-c31b387e5438', 3);
INSERT INTO public.movie_version VALUES ('221d7710-5738-4bb9-a32f-c31b387e5438', 1);
INSERT INTO public.movie_version VALUES ('221d7710-5738-4bb9-a32f-c31b387e5438', 2);
INSERT INTO public.movie_version VALUES ('5f5b04c2-ce0f-4e48-af9e-a0e24d773135', 1);
INSERT INTO public.movie_version VALUES ('5f5b04c2-ce0f-4e48-af9e-a0e24d773135', 2);
INSERT INTO public.movie_version VALUES ('5f5b04c2-ce0f-4e48-af9e-a0e24d773135', 3);
INSERT INTO public.movie_version VALUES ('baadf72e-abd9-4bd9-afba-e3dc6a361983', 1);
INSERT INTO public.movie_version VALUES ('baadf72e-abd9-4bd9-afba-e3dc6a361983', 2);
INSERT INTO public.movie_version VALUES ('baadf72e-abd9-4bd9-afba-e3dc6a361983', 3);
INSERT INTO public.movie_version VALUES ('c9071ace-9fdb-415a-ab1e-73767696ec18', 1);
INSERT INTO public.movie_version VALUES ('c9071ace-9fdb-415a-ab1e-73767696ec18', 2);
INSERT INTO public.movie_version VALUES ('c9071ace-9fdb-415a-ab1e-73767696ec18', 3);
INSERT INTO public.movie_version VALUES ('5cd28958-9be9-41dc-b852-602252933e5f', 3);
INSERT INTO public.movie_version VALUES ('5cd28958-9be9-41dc-b852-602252933e5f', 1);
INSERT INTO public.movie_version VALUES ('5cd28958-9be9-41dc-b852-602252933e5f', 2);
INSERT INTO public.movie_version VALUES ('white-snake', 1);
INSERT INTO public.movie_version VALUES ('white-snake', 4);
INSERT INTO public.movie_version VALUES ('white-snake', 3);
INSERT INTO public.movie_version VALUES ('white-snake', 2);


--
-- Data for Name: payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payment VALUES (1, 1, 'CLX-1784511015430', 'CASH', 140000, 'SUCCESS', '2026-07-20 08:30:15.430114');
INSERT INTO public.payment VALUES (2, 2, 'MOMO_TXN_2', 'MOMO', 70000, 'SUCCESS', '2026-07-20 08:37:26.253102');
INSERT INTO public.payment VALUES (3, 3, 'CLX-1784511928166', 'CASH', 140000, 'SUCCESS', '2026-07-20 08:45:28.166093');
INSERT INTO public.payment VALUES (4, 4, 'CLX-1784512196959', 'CASH', 527000, 'SUCCESS', '2026-07-20 08:49:56.95962');
INSERT INTO public.payment VALUES (5, 5, 'CLX-1784512242642', 'CASH', 349000, 'SUCCESS', '2026-07-20 08:50:42.642793');
INSERT INTO public.payment VALUES (6, 6, 'CLX-1784598746987', 'CASH', 448000, 'SUCCESS', '2026-07-21 08:52:26.988445');
INSERT INTO public.payment VALUES (7, 7, 'CLX-1784598758275', 'CASH', 259000, 'SUCCESS', '2026-07-21 08:52:38.275097');
INSERT INTO public.payment VALUES (8, 8, 'EMP-1784816364784', 'CASH', 70000, 'SUCCESS', '2026-07-23 21:19:24.785542');
INSERT INTO public.payment VALUES (9, 9, 'CLX-1784817100178', 'CASH', 90000, 'SUCCESS', '2026-07-23 21:31:40.179587');
INSERT INTO public.payment VALUES (10, 10, '4784974039', 'MOMO', 289000, 'SUCCESS', '2026-07-24 08:43:55.02015');
INSERT INTO public.payment VALUES (11, 11, '4785059972', 'MOMO', 100000, 'SUCCESS', '2026-07-24 10:01:04.555932');
INSERT INTO public.payment VALUES (12, 12, 'MOMO-FAIL-1784863857213', 'MOMO', 456000, 'FAILED', '2026-07-24 10:30:57.21416');
INSERT INTO public.payment VALUES (13, 13, '4785422196', 'MOMO', 300000, 'SUCCESS', '2026-07-24 16:30:30.854417');


--
-- Data for Name: promotion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.promotion VALUES (1, 'KM10', 'Giảm giá 10%', 'Áp dụng cho mọi hóa đơn đặt vé online', '2026-06-01 00:00:00', '2026-12-31 23:59:59', 10.00, 'PERCENT', 1000, 0, '', '', 'ACTIVE', NULL, NULL, NULL, false, 0);
INSERT INTO public.promotion VALUES (2, 'GIAM50K', 'Giảm ngay 50.000đ', 'Giảm trực tiếp 50k vào tổng tiền hóa đơn', '2026-06-01 00:00:00', '2026-12-31 23:59:59', 50000.00, 'FIXED', 1000, 0, '', '', 'ACTIVE', NULL, NULL, NULL, false, 0);


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.role VALUES (1, 'Admin');
INSERT INTO public.role VALUES (2, 'Customer');
INSERT INTO public.role VALUES (3, 'Employee');


--
-- Data for Name: room_format; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.room_format VALUES (1, 1);
INSERT INTO public.room_format VALUES (1, 2);
INSERT INTO public.room_format VALUES (2, 1);
INSERT INTO public.room_format VALUES (2, 2);
INSERT INTO public.room_format VALUES (3, 3);
INSERT INTO public.room_format VALUES (4, 4);
INSERT INTO public.room_format VALUES (5, 1);
INSERT INTO public.room_format VALUES (5, 2);


--
-- Data for Name: schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.schedule VALUES (1, '550e8400-e29b-41d4-a716-446655440003', 1, '2026-07-20 08:00:00', '2026-07-20 09:40:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (2, '550e8400-e29b-41d4-a716-446655440004', 1, '2026-07-20 10:10:00', '2026-07-20 12:02:00', 30, 2, 'SCHEDULED');
INSERT INTO public.schedule VALUES (3, 'assassination-classroom', 1, '2026-07-20 12:32:00', '2026-07-20 13:58:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (4, 'backrooms', 1, '2026-07-20 14:28:00', '2026-07-20 16:18:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (5, 'caged-butterfly', 1, '2026-07-20 16:48:00', '2026-07-20 18:19:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (6, 'colony', 1, '2026-07-20 18:49:00', '2026-07-20 20:51:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (7, 'devil-black-cat', 1, '2026-07-20 21:21:00', '2026-07-20 22:48:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (8, '550e8400-e29b-41d4-a716-446655440004', 2, '2026-07-20 08:00:00', '2026-07-20 09:52:00', 30, 2, 'SCHEDULED');
INSERT INTO public.schedule VALUES (9, 'assassination-classroom', 2, '2026-07-20 10:22:00', '2026-07-20 11:48:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (10, 'backrooms', 2, '2026-07-20 12:18:00', '2026-07-20 14:08:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (11, 'caged-butterfly', 2, '2026-07-20 14:38:00', '2026-07-20 16:09:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (12, 'colony', 2, '2026-07-20 16:39:00', '2026-07-20 18:41:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (13, 'devil-black-cat', 2, '2026-07-20 19:11:00', '2026-07-20 20:38:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (14, 'doraemon-movie-45', 2, '2026-07-20 21:08:00', '2026-07-20 22:49:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (15, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-20 08:00:00', '2026-07-20 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (16, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-20 11:12:00', '2026-07-20 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (17, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-20 14:24:00', '2026-07-20 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (18, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-20 17:36:00', '2026-07-20 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (19, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-20 20:48:00', '2026-07-20 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (20, 'caged-butterfly', 5, '2026-07-20 08:00:00', '2026-07-20 09:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (21, 'colony', 5, '2026-07-20 10:01:00', '2026-07-20 12:03:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (22, 'devil-black-cat', 5, '2026-07-20 12:33:00', '2026-07-20 14:00:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (23, 'doraemon-movie-45', 5, '2026-07-20 14:30:00', '2026-07-20 16:11:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (24, 'gohan', 5, '2026-07-20 16:41:00', '2026-07-20 19:01:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (25, 'kings-warden', 5, '2026-07-20 19:31:00', '2026-07-20 21:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (26, 'lau-chu-hoa', 5, '2026-07-20 21:58:00', '2026-07-20 23:32:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (27, '550e8400-e29b-41d4-a716-446655440004', 1, '2026-07-21 08:00:00', '2026-07-21 09:52:00', 30, 2, 'SCHEDULED');
INSERT INTO public.schedule VALUES (28, 'assassination-classroom', 1, '2026-07-21 10:22:00', '2026-07-21 11:48:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (29, 'backrooms', 1, '2026-07-21 12:18:00', '2026-07-21 14:08:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (30, 'caged-butterfly', 1, '2026-07-21 14:38:00', '2026-07-21 16:09:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (31, 'colony', 1, '2026-07-21 16:39:00', '2026-07-21 18:41:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (32, 'devil-black-cat', 1, '2026-07-21 19:11:00', '2026-07-21 20:38:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (33, 'doraemon-movie-45', 1, '2026-07-21 21:08:00', '2026-07-21 22:49:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (34, 'assassination-classroom', 2, '2026-07-21 08:00:00', '2026-07-21 09:26:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (35, 'backrooms', 2, '2026-07-21 09:56:00', '2026-07-21 11:46:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (36, 'caged-butterfly', 2, '2026-07-21 12:16:00', '2026-07-21 13:47:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (37, 'colony', 2, '2026-07-21 14:17:00', '2026-07-21 16:19:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (38, 'devil-black-cat', 2, '2026-07-21 16:49:00', '2026-07-21 18:16:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (39, 'doraemon-movie-45', 2, '2026-07-21 18:46:00', '2026-07-21 20:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (40, 'gohan', 2, '2026-07-21 20:57:00', '2026-07-21 23:17:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (41, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-21 08:00:00', '2026-07-21 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (42, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-21 11:12:00', '2026-07-21 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (43, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-21 14:24:00', '2026-07-21 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (44, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-21 17:36:00', '2026-07-21 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (45, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-21 20:48:00', '2026-07-21 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (46, 'colony', 5, '2026-07-21 08:00:00', '2026-07-21 10:02:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (47, 'devil-black-cat', 5, '2026-07-21 10:32:00', '2026-07-21 11:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (48, 'doraemon-movie-45', 5, '2026-07-21 12:29:00', '2026-07-21 14:10:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (49, 'gohan', 5, '2026-07-21 14:40:00', '2026-07-21 17:00:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (50, 'kings-warden', 5, '2026-07-21 17:30:00', '2026-07-21 19:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (51, 'lau-chu-hoa', 5, '2026-07-21 19:57:00', '2026-07-21 21:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (52, 'lieu-trai-nhuoc-tu', 5, '2026-07-21 22:01:00', '2026-07-21 23:53:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (53, 'assassination-classroom', 1, '2026-07-22 08:00:00', '2026-07-22 09:26:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (54, 'backrooms', 1, '2026-07-22 09:56:00', '2026-07-22 11:46:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (55, 'caged-butterfly', 1, '2026-07-22 12:16:00', '2026-07-22 13:47:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (56, 'colony', 1, '2026-07-22 14:17:00', '2026-07-22 16:19:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (57, 'devil-black-cat', 1, '2026-07-22 16:49:00', '2026-07-22 18:16:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (58, 'doraemon-movie-45', 1, '2026-07-22 18:46:00', '2026-07-22 20:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (59, 'gohan', 1, '2026-07-22 20:57:00', '2026-07-22 23:17:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (60, 'backrooms', 2, '2026-07-22 08:00:00', '2026-07-22 09:50:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (61, 'caged-butterfly', 2, '2026-07-22 10:20:00', '2026-07-22 11:51:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (62, 'colony', 2, '2026-07-22 12:21:00', '2026-07-22 14:23:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (63, 'devil-black-cat', 2, '2026-07-22 14:53:00', '2026-07-22 16:20:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (64, 'doraemon-movie-45', 2, '2026-07-22 16:50:00', '2026-07-22 18:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (65, 'gohan', 2, '2026-07-22 19:01:00', '2026-07-22 21:21:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (66, 'kings-warden', 2, '2026-07-22 21:51:00', '2026-07-22 23:48:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (67, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-22 08:00:00', '2026-07-22 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (68, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-22 11:12:00', '2026-07-22 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (69, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-22 14:24:00', '2026-07-22 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (70, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-22 17:36:00', '2026-07-22 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (71, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-22 20:48:00', '2026-07-22 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (72, 'devil-black-cat', 5, '2026-07-22 08:00:00', '2026-07-22 09:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (73, 'doraemon-movie-45', 5, '2026-07-22 09:57:00', '2026-07-22 11:38:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (74, 'gohan', 5, '2026-07-22 12:08:00', '2026-07-22 14:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (75, 'kings-warden', 5, '2026-07-22 14:58:00', '2026-07-22 16:55:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (76, 'lau-chu-hoa', 5, '2026-07-22 17:25:00', '2026-07-22 18:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (77, 'lieu-trai-nhuoc-tu', 5, '2026-07-22 19:29:00', '2026-07-22 21:21:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (78, 'madames-thanh-sac', 5, '2026-07-22 21:51:00', '2026-07-22 23:56:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (79, 'backrooms', 1, '2026-07-23 08:00:00', '2026-07-23 09:50:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (80, 'caged-butterfly', 1, '2026-07-23 10:20:00', '2026-07-23 11:51:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (81, 'colony', 1, '2026-07-23 12:21:00', '2026-07-23 14:23:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (82, 'devil-black-cat', 1, '2026-07-23 14:53:00', '2026-07-23 16:20:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (83, 'doraemon-movie-45', 1, '2026-07-23 16:50:00', '2026-07-23 18:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (84, 'gohan', 1, '2026-07-23 19:01:00', '2026-07-23 21:21:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (85, 'kings-warden', 1, '2026-07-23 21:51:00', '2026-07-23 23:48:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (86, 'caged-butterfly', 2, '2026-07-23 08:00:00', '2026-07-23 09:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (87, 'colony', 2, '2026-07-23 10:01:00', '2026-07-23 12:03:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (88, 'devil-black-cat', 2, '2026-07-23 12:33:00', '2026-07-23 14:00:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (89, 'doraemon-movie-45', 2, '2026-07-23 14:30:00', '2026-07-23 16:11:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (90, 'gohan', 2, '2026-07-23 16:41:00', '2026-07-23 19:01:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (91, 'kings-warden', 2, '2026-07-23 19:31:00', '2026-07-23 21:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (92, 'lau-chu-hoa', 2, '2026-07-23 21:58:00', '2026-07-23 23:32:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (93, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-23 08:00:00', '2026-07-23 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (94, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-23 11:12:00', '2026-07-23 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (95, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-23 14:24:00', '2026-07-23 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (96, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-23 17:36:00', '2026-07-23 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (97, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-23 20:48:00', '2026-07-23 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (98, 'doraemon-movie-45', 5, '2026-07-23 08:00:00', '2026-07-23 09:41:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (99, 'gohan', 5, '2026-07-23 10:11:00', '2026-07-23 12:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (100, 'kings-warden', 5, '2026-07-23 13:01:00', '2026-07-23 14:58:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (101, 'lau-chu-hoa', 5, '2026-07-23 15:28:00', '2026-07-23 17:02:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (102, 'lieu-trai-nhuoc-tu', 5, '2026-07-23 17:32:00', '2026-07-23 19:24:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (103, 'madames-thanh-sac', 5, '2026-07-23 19:54:00', '2026-07-23 21:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (104, 'marsupilami', 5, '2026-07-23 22:29:00', '2026-07-24 00:08:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (105, 'caged-butterfly', 1, '2026-07-24 08:00:00', '2026-07-24 09:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (106, 'colony', 1, '2026-07-24 10:01:00', '2026-07-24 12:03:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (107, 'devil-black-cat', 1, '2026-07-24 12:33:00', '2026-07-24 14:00:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (108, 'doraemon-movie-45', 1, '2026-07-24 14:30:00', '2026-07-24 16:11:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (109, 'gohan', 1, '2026-07-24 16:41:00', '2026-07-24 19:01:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (110, 'kings-warden', 1, '2026-07-24 19:31:00', '2026-07-24 21:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (111, 'lau-chu-hoa', 1, '2026-07-24 21:58:00', '2026-07-24 23:32:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (112, 'colony', 2, '2026-07-24 08:00:00', '2026-07-24 10:02:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (113, 'devil-black-cat', 2, '2026-07-24 10:32:00', '2026-07-24 11:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (114, 'doraemon-movie-45', 2, '2026-07-24 12:29:00', '2026-07-24 14:10:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (115, 'gohan', 2, '2026-07-24 14:40:00', '2026-07-24 17:00:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (116, 'kings-warden', 2, '2026-07-24 17:30:00', '2026-07-24 19:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (117, 'lau-chu-hoa', 2, '2026-07-24 19:57:00', '2026-07-24 21:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (118, 'lieu-trai-nhuoc-tu', 2, '2026-07-24 22:01:00', '2026-07-24 23:53:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (119, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-24 08:00:00', '2026-07-24 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (120, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-24 11:12:00', '2026-07-24 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (121, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-24 14:24:00', '2026-07-24 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (122, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-24 17:36:00', '2026-07-24 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (123, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-24 20:48:00', '2026-07-24 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (124, 'gohan', 5, '2026-07-24 08:00:00', '2026-07-24 10:20:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (125, 'kings-warden', 5, '2026-07-24 10:50:00', '2026-07-24 12:47:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (126, 'lau-chu-hoa', 5, '2026-07-24 13:17:00', '2026-07-24 14:51:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (127, 'lieu-trai-nhuoc-tu', 5, '2026-07-24 15:21:00', '2026-07-24 17:13:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (128, 'madames-thanh-sac', 5, '2026-07-24 17:43:00', '2026-07-24 19:48:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (129, 'marsupilami', 5, '2026-07-24 20:18:00', '2026-07-24 21:57:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (130, 'michael', 5, '2026-07-24 22:27:00', '2026-07-25 00:34:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (131, 'colony', 1, '2026-07-25 08:00:00', '2026-07-25 10:02:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (132, 'devil-black-cat', 1, '2026-07-25 10:32:00', '2026-07-25 11:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (133, 'doraemon-movie-45', 1, '2026-07-25 12:29:00', '2026-07-25 14:10:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (134, 'gohan', 1, '2026-07-25 14:40:00', '2026-07-25 17:00:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (135, 'kings-warden', 1, '2026-07-25 17:30:00', '2026-07-25 19:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (136, 'lau-chu-hoa', 1, '2026-07-25 19:57:00', '2026-07-25 21:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (137, 'lieu-trai-nhuoc-tu', 1, '2026-07-25 22:01:00', '2026-07-25 23:53:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (138, 'devil-black-cat', 2, '2026-07-25 08:00:00', '2026-07-25 09:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (139, 'doraemon-movie-45', 2, '2026-07-25 09:57:00', '2026-07-25 11:38:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (140, 'gohan', 2, '2026-07-25 12:08:00', '2026-07-25 14:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (141, 'kings-warden', 2, '2026-07-25 14:58:00', '2026-07-25 16:55:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (142, 'lau-chu-hoa', 2, '2026-07-25 17:25:00', '2026-07-25 18:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (143, 'lieu-trai-nhuoc-tu', 2, '2026-07-25 19:29:00', '2026-07-25 21:21:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (144, 'madames-thanh-sac', 2, '2026-07-25 21:51:00', '2026-07-25 23:56:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (145, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-25 08:00:00', '2026-07-25 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (146, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-25 11:12:00', '2026-07-25 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (147, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-25 14:24:00', '2026-07-25 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (148, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-25 17:36:00', '2026-07-25 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (149, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-25 20:48:00', '2026-07-25 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (150, 'kings-warden', 5, '2026-07-25 08:00:00', '2026-07-25 09:57:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (151, 'lau-chu-hoa', 5, '2026-07-25 10:27:00', '2026-07-25 12:01:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (152, 'lieu-trai-nhuoc-tu', 5, '2026-07-25 12:31:00', '2026-07-25 14:23:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (153, 'madames-thanh-sac', 5, '2026-07-25 14:53:00', '2026-07-25 16:58:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (154, 'marsupilami', 5, '2026-07-25 17:28:00', '2026-07-25 19:07:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (155, 'michael', 5, '2026-07-25 19:37:00', '2026-07-25 21:44:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (156, 'obsession', 5, '2026-07-25 22:14:00', '2026-07-26 00:03:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (157, 'devil-black-cat', 1, '2026-07-26 08:00:00', '2026-07-26 09:27:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (158, 'doraemon-movie-45', 1, '2026-07-26 09:57:00', '2026-07-26 11:38:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (159, 'gohan', 1, '2026-07-26 12:08:00', '2026-07-26 14:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (160, 'kings-warden', 1, '2026-07-26 14:58:00', '2026-07-26 16:55:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (161, 'lau-chu-hoa', 1, '2026-07-26 17:25:00', '2026-07-26 18:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (162, 'lieu-trai-nhuoc-tu', 1, '2026-07-26 19:29:00', '2026-07-26 21:21:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (163, 'madames-thanh-sac', 1, '2026-07-26 21:51:00', '2026-07-26 23:56:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (164, 'doraemon-movie-45', 2, '2026-07-26 08:00:00', '2026-07-26 09:41:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (165, 'gohan', 2, '2026-07-26 10:11:00', '2026-07-26 12:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (166, 'kings-warden', 2, '2026-07-26 13:01:00', '2026-07-26 14:58:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (167, 'lau-chu-hoa', 2, '2026-07-26 15:28:00', '2026-07-26 17:02:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (168, 'lieu-trai-nhuoc-tu', 2, '2026-07-26 17:32:00', '2026-07-26 19:24:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (169, 'madames-thanh-sac', 2, '2026-07-26 19:54:00', '2026-07-26 21:59:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (170, 'marsupilami', 2, '2026-07-26 22:29:00', '2026-07-27 00:08:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (171, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-26 08:00:00', '2026-07-26 10:42:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (172, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-26 11:12:00', '2026-07-26 13:54:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (173, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-26 14:24:00', '2026-07-26 17:06:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (174, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-26 17:36:00', '2026-07-26 20:18:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (175, '550e8400-e29b-41d4-a716-446655440005', 4, '2026-07-26 20:48:00', '2026-07-26 23:30:00', 30, 4, 'SCHEDULED');
INSERT INTO public.schedule VALUES (176, 'lau-chu-hoa', 5, '2026-07-26 08:00:00', '2026-07-26 09:34:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (177, 'lieu-trai-nhuoc-tu', 5, '2026-07-26 10:04:00', '2026-07-26 11:56:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (178, 'madames-thanh-sac', 5, '2026-07-26 12:26:00', '2026-07-26 14:31:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (179, 'marsupilami', 5, '2026-07-26 15:01:00', '2026-07-26 16:40:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (180, 'michael', 5, '2026-07-26 17:10:00', '2026-07-26 19:17:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (181, 'obsession', 5, '2026-07-26 19:47:00', '2026-07-26 21:36:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (182, 'oc-muon-hon', 5, '2026-07-26 22:06:00', '2026-07-26 23:55:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (183, '5b1c9335-c698-4053-812a-19e9fad75128', 1, '2026-07-28 19:00:00', '2026-07-28 22:10:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (184, '5cd28958-9be9-41dc-b852-602252933e5f', 3, '2026-07-27 14:00:00', '2026-07-27 16:00:00', 30, 3, 'SCHEDULED');
INSERT INTO public.schedule VALUES (185, '550e8400-e29b-41d4-a716-446655440001', 1, '2026-07-28 09:00:00', '2026-07-28 11:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (186, '550e8400-e29b-41d4-a716-446655440001', 1, '2026-07-29 10:00:00', '2026-07-29 12:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (187, '550e8400-e29b-41d4-a716-446655440001', 1, '2026-07-30 11:00:00', '2026-07-30 13:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (188, '550e8400-e29b-41d4-a716-446655440001', 1, '2026-07-31 12:00:00', '2026-07-31 14:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (189, '550e8400-e29b-41d4-a716-446655440001', 1, '2026-08-01 13:00:00', '2026-08-01 15:28:00', 30, 1, 'SCHEDULED');
INSERT INTO public.schedule VALUES (190, '550e8400-e29b-41d4-a716-446655440001', 1, '2026-08-02 14:00:00', '2026-08-02 16:28:00', 30, 1, 'SCHEDULED');


--
-- Data for Name: schedule_seat; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.schedule_seat VALUES (1, 183, 1, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (2, 183, 2, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (3, 1, 1, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (6, 2, 34, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (7, 2, 58, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (4, 184, 161, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (5, 184, 162, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (8, 31, 56, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (9, 31, 57, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (10, 31, 24, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (12, 1, 3, 1, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (14, 185, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (13, 185, 1, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (15, 186, 1, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (16, 186, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (20, 188, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (22, 189, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (24, 190, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (51, 156, 343, 1, '2026-07-24 16:29:53.85261', 'acc-01');
INSERT INTO public.schedule_seat VALUES (17, 187, 1, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (18, 187, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (19, 188, 1, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (21, 189, 1, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (25, 118, 136, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (26, 118, 146, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (48, 156, 344, 1, '2026-07-24 16:29:53.85261', 'acc-01');
INSERT INTO public.schedule_seat VALUES (47, 156, 336, 1, '2026-07-24 16:29:53.85261', 'acc-01');
INSERT INTO public.schedule_seat VALUES (11, 1, 2, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (31, 127, 344, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (30, 127, 343, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (23, 190, 1, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (27, 127, 355, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (28, 127, 332, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (29, 127, 353, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (33, 120, 287, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (37, 120, 290, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (36, 120, 292, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (35, 120, 288, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (34, 120, 289, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (32, 127, 334, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (38, 106, 45, 1, '2026-07-24 09:59:25.101135', 'acc-02');
INSERT INTO public.schedule_seat VALUES (39, 131, 8, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (40, 131, 28, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (41, 131, 37, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (42, 131, 23, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (43, 131, 14, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (44, 131, 25, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (45, 131, 34, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (49, 156, 335, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (50, 156, 345, 0, NULL, NULL);
INSERT INTO public.schedule_seat VALUES (46, 156, 346, 0, NULL, NULL);


--
-- Data for Name: score_transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.score_transaction VALUES (1, 'mem-01', 1, 'ADD', 7, 257, '2026-07-20 08:30:15.42026');
INSERT INTO public.score_transaction VALUES (2, 'mem-01', 2, 'ADD', 3, 260, '2026-07-20 08:37:26.256479');
INSERT INTO public.score_transaction VALUES (3, 'mem-01', 3, 'ADD', 7, 267, '2026-07-20 08:45:28.15405');
INSERT INTO public.score_transaction VALUES (4, 'mem-01', 4, 'ADD', 26, 293, '2026-07-20 08:49:56.950211');
INSERT INTO public.score_transaction VALUES (5, 'mem-01', 5, 'ADD', 17, 310, '2026-07-20 08:50:42.620379');
INSERT INTO public.score_transaction VALUES (6, 'mem-01', 3, 'SUB', 7, 303, '2026-07-20 08:54:57.012418');
INSERT INTO public.score_transaction VALUES (7, 'mem-01', 6, 'ADD', 22, 325, '2026-07-21 08:52:26.959694');
INSERT INTO public.score_transaction VALUES (8, 'mem-01', 7, 'ADD', 12, 337, '2026-07-21 08:52:38.266962');
INSERT INTO public.score_transaction VALUES (9, 'mem-01', 9, 'ADD', 4, 341, '2026-07-23 21:31:40.161694');
INSERT INTO public.score_transaction VALUES (10, 'mem-01', 10, 'ADD', 14, 355, '2026-07-24 08:43:55.036571');
INSERT INTO public.score_transaction VALUES (11, 'mem-01', 9, 'SUB', 4, 351, '2026-07-24 08:45:15.117746');
INSERT INTO public.score_transaction VALUES (12, 'mem-01', 10, 'SUB', 14, 337, '2026-07-24 08:45:19.242546');
INSERT INTO public.score_transaction VALUES (13, 'mem-01', 11, 'ADD', 5, 342, '2026-07-24 10:01:04.570879');


--
-- Data for Name: seat; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.seat VALUES (1, 1, '1', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (2, 1, '2', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (3, 1, '3', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (4, 1, '4', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (5, 1, '5', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (6, 1, '6', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (7, 1, '7', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (8, 1, '8', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (9, 1, '9', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (10, 1, '10', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (11, 1, '1', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (12, 1, '2', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (13, 1, '3', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (14, 1, '4', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (15, 1, '5', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (16, 1, '6', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (17, 1, '7', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (18, 1, '8', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (19, 1, '9', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (20, 1, '10', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (21, 1, '1', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (22, 1, '2', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (23, 1, '3', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (24, 1, '4', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (25, 1, '5', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (26, 1, '6', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (27, 1, '7', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (28, 1, '8', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (29, 1, '9', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (30, 1, '10', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (31, 1, '1', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (32, 1, '2', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (33, 1, '3', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (34, 1, '4', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (35, 1, '5', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (36, 1, '6', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (37, 1, '7', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (38, 1, '8', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (39, 1, '9', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (40, 1, '10', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (41, 1, '1', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (42, 1, '2', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (43, 1, '3', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (44, 1, '4', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (45, 1, '5', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (46, 1, '6', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (47, 1, '7', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (48, 1, '8', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (49, 1, '9', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (50, 1, '10', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (51, 1, '1', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (52, 1, '2', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (53, 1, '3', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (54, 1, '4', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (55, 1, '5', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (56, 1, '6', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (57, 1, '7', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (58, 1, '8', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (59, 1, '9', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (60, 1, '10', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (61, 1, '1', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (62, 1, '2', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (63, 1, '3', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (64, 1, '4', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (65, 1, '5', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (66, 1, '6', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (67, 1, '7', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (68, 1, '8', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (69, 1, '9', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (70, 1, '10', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (71, 1, '1', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (72, 1, '2', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (73, 1, '3', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (74, 1, '4', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (75, 1, '5', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (76, 1, '6', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (77, 1, '7', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (78, 1, '8', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (79, 1, '9', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (80, 1, '10', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (81, 2, '1', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (82, 2, '2', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (83, 2, '3', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (84, 2, '4', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (85, 2, '5', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (86, 2, '6', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (87, 2, '7', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (88, 2, '8', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (89, 2, '9', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (90, 2, '10', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (91, 2, '1', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (92, 2, '2', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (93, 2, '3', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (94, 2, '4', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (95, 2, '5', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (96, 2, '6', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (97, 2, '7', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (98, 2, '8', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (99, 2, '9', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (100, 2, '10', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (101, 2, '1', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (102, 2, '2', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (103, 2, '3', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (104, 2, '4', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (105, 2, '5', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (106, 2, '6', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (107, 2, '7', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (108, 2, '8', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (109, 2, '9', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (110, 2, '10', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (111, 2, '1', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (112, 2, '2', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (113, 2, '3', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (114, 2, '4', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (115, 2, '5', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (116, 2, '6', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (117, 2, '7', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (118, 2, '8', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (119, 2, '9', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (120, 2, '10', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (121, 2, '1', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (122, 2, '2', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (123, 2, '3', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (124, 2, '4', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (125, 2, '5', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (126, 2, '6', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (127, 2, '7', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (128, 2, '8', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (129, 2, '9', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (130, 2, '10', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (131, 2, '1', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (132, 2, '2', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (133, 2, '3', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (134, 2, '4', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (135, 2, '5', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (136, 2, '6', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (137, 2, '7', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (138, 2, '8', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (139, 2, '9', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (140, 2, '10', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (141, 2, '1', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (142, 2, '2', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (143, 2, '3', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (144, 2, '4', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (145, 2, '5', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (146, 2, '6', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (147, 2, '7', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (148, 2, '8', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (149, 2, '9', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (150, 2, '10', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (151, 2, '1', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (152, 2, '2', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (153, 2, '3', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (154, 2, '4', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (155, 2, '5', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (156, 2, '6', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (157, 2, '7', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (158, 2, '8', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (159, 2, '9', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (160, 2, '10', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (161, 3, '1', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (162, 3, '2', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (163, 3, '3', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (164, 3, '4', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (165, 3, '5', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (166, 3, '6', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (167, 3, '7', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (168, 3, '8', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (169, 3, '9', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (170, 3, '10', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (171, 3, '1', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (172, 3, '2', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (173, 3, '3', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (174, 3, '4', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (175, 3, '5', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (176, 3, '6', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (177, 3, '7', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (178, 3, '8', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (179, 3, '9', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (180, 3, '10', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (181, 3, '1', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (182, 3, '2', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (183, 3, '3', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (184, 3, '4', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (185, 3, '5', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (186, 3, '6', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (187, 3, '7', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (188, 3, '8', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (189, 3, '9', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (190, 3, '10', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (191, 3, '1', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (192, 3, '2', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (193, 3, '3', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (194, 3, '4', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (195, 3, '5', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (196, 3, '6', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (197, 3, '7', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (198, 3, '8', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (199, 3, '9', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (200, 3, '10', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (201, 3, '1', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (202, 3, '2', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (203, 3, '3', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (204, 3, '4', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (205, 3, '5', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (206, 3, '6', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (207, 3, '7', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (208, 3, '8', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (209, 3, '9', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (210, 3, '10', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (211, 3, '1', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (212, 3, '2', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (213, 3, '3', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (214, 3, '4', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (215, 3, '5', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (216, 3, '6', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (217, 3, '7', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (218, 3, '8', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (219, 3, '9', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (220, 3, '10', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (221, 3, '1', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (222, 3, '2', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (223, 3, '3', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (224, 3, '4', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (225, 3, '5', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (226, 3, '6', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (227, 3, '7', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (228, 3, '8', 7, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (229, 3, '9', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (230, 3, '10', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (231, 3, '1', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (232, 3, '2', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (233, 3, '3', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (234, 3, '4', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (235, 3, '5', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (236, 3, '6', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (237, 3, '7', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (238, 3, '8', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (239, 3, '9', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (240, 3, '10', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (241, 3, '1', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (242, 3, '2', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (243, 3, '3', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (244, 3, '4', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (245, 3, '5', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (246, 3, '6', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (247, 3, '7', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (248, 3, '8', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (249, 3, '9', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (250, 3, '10', 9, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (251, 3, '1', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (252, 3, '2', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (253, 3, '3', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (254, 3, '4', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (255, 3, '5', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (256, 3, '6', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (257, 3, '7', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (258, 3, '8', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (259, 3, '9', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (260, 3, '10', 10, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (261, 4, '1', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (262, 4, '2', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (263, 4, '3', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (264, 4, '4', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (265, 4, '5', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (266, 4, '6', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (267, 4, '7', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (268, 4, '8', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (269, 4, '1', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (270, 4, '2', 2, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (271, 4, '3', 2, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (272, 4, '4', 2, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (273, 4, '5', 2, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (274, 4, '6', 2, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (275, 4, '7', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (276, 4, '8', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (277, 4, '1', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (278, 4, '2', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (279, 4, '3', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (280, 4, '4', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (281, 4, '5', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (282, 4, '6', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (283, 4, '7', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (284, 4, '8', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (285, 4, '1', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (286, 4, '2', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (287, 4, '3', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (288, 4, '4', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (289, 4, '5', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (290, 4, '6', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (291, 4, '7', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (292, 4, '8', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (293, 4, '1', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (294, 4, '2', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (295, 4, '3', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (296, 4, '4', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (297, 4, '5', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (298, 4, '6', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (299, 4, '7', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (300, 4, '8', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (301, 4, '1', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (302, 4, '2', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (303, 4, '3', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (304, 4, '4', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (305, 4, '5', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (306, 4, '6', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (307, 4, '7', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (308, 4, '8', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (309, 5, '1', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (310, 5, '2', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (311, 5, '3', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (312, 5, '4', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (313, 5, '5', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (314, 5, '6', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (315, 5, '7', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (316, 5, '8', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (317, 5, '9', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (318, 5, '10', 1, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (319, 5, '1', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (320, 5, '2', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (321, 5, '3', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (322, 5, '4', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (323, 5, '5', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (324, 5, '6', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (325, 5, '7', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (326, 5, '8', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (327, 5, '9', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (328, 5, '10', 2, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (329, 5, '1', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (330, 5, '2', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (331, 5, '3', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (332, 5, '4', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (333, 5, '5', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (334, 5, '6', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (335, 5, '7', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (336, 5, '8', 3, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (337, 5, '9', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (338, 5, '10', 3, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (339, 5, '1', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (340, 5, '2', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (341, 5, '3', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (342, 5, '4', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (343, 5, '5', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (344, 5, '6', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (345, 5, '7', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (346, 5, '8', 4, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (347, 5, '9', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (348, 5, '10', 4, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (349, 5, '1', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (350, 5, '2', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (351, 5, '3', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (352, 5, '4', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (353, 5, '5', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (354, 5, '6', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (355, 5, '7', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (356, 5, '8', 5, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (357, 5, '9', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (358, 5, '10', 5, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (359, 5, '1', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (360, 5, '2', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (361, 5, '3', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (362, 5, '4', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (363, 5, '5', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (364, 5, '6', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (365, 5, '7', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (366, 5, '8', 6, 1, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (367, 5, '9', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (368, 5, '10', 6, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (369, 5, '1', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (370, 5, '2', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (371, 5, '3', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (372, 5, '4', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (373, 5, '5', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (374, 5, '6', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (375, 5, '7', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (376, 5, '8', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (377, 5, '9', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (378, 5, '10', 7, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (379, 5, '1', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (380, 5, '2', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (381, 5, '3', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (382, 5, '4', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (383, 5, '5', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (384, 5, '6', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (385, 5, '7', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (386, 5, '8', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (387, 5, '9', 8, 0, NULL, 'ACTIVE');
INSERT INTO public.seat VALUES (388, 5, '10', 8, 0, NULL, 'ACTIVE');


--
-- Data for Name: type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.type VALUES (1, 'Hành động');
INSERT INTO public.type VALUES (2, 'Kinh dị');
INSERT INTO public.type VALUES (3, 'Tình cảm');
INSERT INTO public.type VALUES (4, 'Hài hước');
INSERT INTO public.type VALUES (5, 'Khoa học viễn tưởng');


--
-- Data for Name: version; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.version VALUES (1, '2D', 70000.00, 30000.00, 20000.00);
INSERT INTO public.version VALUES (2, '3D', 100000.00, 30000.00, 20000.00);
INSERT INTO public.version VALUES (3, 'IMAX', 120000.00, 30000.00, 20000.00);
INSERT INTO public.version VALUES (4, '4DX', 120000.00, 50000.00, 30000.00);


--
-- Name: cancelled_ticket_cancelled_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cancelled_ticket_cancelled_id_seq', 1, false);


--
-- Name: cinema_room_cinema_room_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cinema_room_cinema_room_id_seq', 5, true);


--
-- Name: combo_combo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.combo_combo_id_seq', 4, true);


--
-- Name: concession_price_concession_price_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.concession_price_concession_price_id_seq', 29, true);


--
-- Name: drink_drink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drink_drink_id_seq', 4, true);


--
-- Name: food_food_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.food_food_id_seq', 5, true);


--
-- Name: golden_hour_config_golden_hour_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.golden_hour_config_golden_hour_id_seq', 1, true);


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_invoice_id_seq', 13, true);


--
-- Name: invoice_seat_invoice_seat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_seat_invoice_seat_id_seq', 24, true);


--
-- Name: payment_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_payment_id_seq', 13, true);


--
-- Name: promotion_promotion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promotion_promotion_id_seq', 2, true);


--
-- Name: role_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_role_id_seq', 3, true);


--
-- Name: schedule_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schedule_schedule_id_seq', 190, true);


--
-- Name: schedule_seat_schedule_seat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schedule_seat_schedule_seat_id_seq', 51, true);


--
-- Name: score_transaction_txn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.score_transaction_txn_id_seq', 13, true);


--
-- Name: seat_seat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seat_seat_id_seq', 388, true);


--
-- Name: type_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_type_id_seq', 5, true);


--
-- Name: version_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.version_version_id_seq', 4, true);


--
-- Name: account account_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_email_key UNIQUE (email);


--
-- Name: account account_identity_card_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_identity_card_key UNIQUE (identity_card);


--
-- Name: account account_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_phone_number_key UNIQUE (phone_number);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (account_id);


--
-- Name: account account_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_username_key UNIQUE (username);


--
-- Name: cancelled_ticket cancelled_ticket_invoice_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_ticket
    ADD CONSTRAINT cancelled_ticket_invoice_id_key UNIQUE (invoice_id);


--
-- Name: cancelled_ticket cancelled_ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_ticket
    ADD CONSTRAINT cancelled_ticket_pkey PRIMARY KEY (cancelled_id);


--
-- Name: cinema_room cinema_room_cinema_room_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cinema_room
    ADD CONSTRAINT cinema_room_cinema_room_name_key UNIQUE (cinema_room_name);


--
-- Name: cinema_room cinema_room_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cinema_room
    ADD CONSTRAINT cinema_room_pkey PRIMARY KEY (cinema_room_id);


--
-- Name: combo combo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo
    ADD CONSTRAINT combo_pkey PRIMARY KEY (combo_id);


--
-- Name: concession_price concession_price_combo_id_size_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT concession_price_combo_id_size_key UNIQUE (combo_id, size);


--
-- Name: concession_price concession_price_drink_id_size_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT concession_price_drink_id_size_key UNIQUE (drink_id, size);


--
-- Name: concession_price concession_price_food_id_size_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT concession_price_food_id_size_key UNIQUE (food_id, size);


--
-- Name: concession_price concession_price_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT concession_price_pkey PRIMARY KEY (concession_price_id);


--
-- Name: drink drink_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drink
    ADD CONSTRAINT drink_pkey PRIMARY KEY (drink_id);


--
-- Name: employee employee_account_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_account_id_key UNIQUE (account_id);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employee_id);


--
-- Name: food food_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food
    ADD CONSTRAINT food_pkey PRIMARY KEY (food_id);


--
-- Name: golden_hour_config golden_hour_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.golden_hour_config
    ADD CONSTRAINT golden_hour_config_pkey PRIMARY KEY (golden_hour_id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: invoice_seat invoice_seat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_seat
    ADD CONSTRAINT invoice_seat_pkey PRIMARY KEY (invoice_seat_id);


--
-- Name: member member_account_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_account_id_key UNIQUE (account_id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (member_id);


--
-- Name: movie movie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie
    ADD CONSTRAINT movie_pkey PRIMARY KEY (movie_id);


--
-- Name: movie_type movie_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_type
    ADD CONSTRAINT movie_type_pkey PRIMARY KEY (movie_id, type_id);


--
-- Name: movie_version movie_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_version
    ADD CONSTRAINT movie_version_pkey PRIMARY KEY (movie_id, version_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: promotion promotion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion
    ADD CONSTRAINT promotion_pkey PRIMARY KEY (promotion_id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);


--
-- Name: room_format room_format_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_format
    ADD CONSTRAINT room_format_pkey PRIMARY KEY (cinema_room_id, version_id);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (schedule_id);


--
-- Name: schedule_seat schedule_seat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_seat
    ADD CONSTRAINT schedule_seat_pkey PRIMARY KEY (schedule_seat_id);


--
-- Name: score_transaction score_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_transaction
    ADD CONSTRAINT score_transaction_pkey PRIMARY KEY (txn_id);


--
-- Name: seat seat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat
    ADD CONSTRAINT seat_pkey PRIMARY KEY (seat_id);


--
-- Name: type type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type
    ADD CONSTRAINT type_pkey PRIMARY KEY (type_id);


--
-- Name: type type_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type
    ADD CONSTRAINT type_type_name_key UNIQUE (type_name);


--
-- Name: schedule_seat uq_schedule_seat; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_seat
    ADD CONSTRAINT uq_schedule_seat UNIQUE (schedule_id, seat_id);


--
-- Name: version version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version
    ADD CONSTRAINT version_pkey PRIMARY KEY (version_id);


--
-- Name: version version_version_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version
    ADD CONSTRAINT version_version_name_key UNIQUE (version_name);


--
-- Name: uq_combo_name_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_combo_name_active ON public.combo USING btree (lower((combo_name)::text)) WHERE ((status)::text <> 'DELETED'::text);


--
-- Name: uq_drink_name_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_drink_name_active ON public.drink USING btree (lower((drink_name)::text)) WHERE ((status)::text <> 'DELETED'::text);


--
-- Name: uq_food_name_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_food_name_active ON public.food USING btree (lower((food_name)::text)) WHERE ((status)::text <> 'DELETED'::text);


--
-- Name: account fk_account_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT fk_account_role FOREIGN KEY (role_id) REFERENCES public.role(role_id);


--
-- Name: concession_price fk_cp_combo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT fk_cp_combo FOREIGN KEY (combo_id) REFERENCES public.combo(combo_id);


--
-- Name: concession_price fk_cp_drink; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT fk_cp_drink FOREIGN KEY (drink_id) REFERENCES public.drink(drink_id);


--
-- Name: concession_price fk_cp_food; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concession_price
    ADD CONSTRAINT fk_cp_food FOREIGN KEY (food_id) REFERENCES public.food(food_id);


--
-- Name: cancelled_ticket fk_ct_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_ticket
    ADD CONSTRAINT fk_ct_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id);


--
-- Name: employee fk_employee_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT fk_employee_account FOREIGN KEY (account_id) REFERENCES public.account(account_id);


--
-- Name: invoice fk_invoice_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_invoice_account FOREIGN KEY (account_id) REFERENCES public.account(account_id);


--
-- Name: invoice fk_invoice_promotion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_invoice_promotion FOREIGN KEY (promotion_id) REFERENCES public.promotion(promotion_id);


--
-- Name: invoice fk_invoice_schedule; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT fk_invoice_schedule FOREIGN KEY (schedule_id) REFERENCES public.schedule(schedule_id);


--
-- Name: invoice_seat fk_is_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_seat
    ADD CONSTRAINT fk_is_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id);


--
-- Name: invoice_seat fk_is_ss; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_seat
    ADD CONSTRAINT fk_is_ss FOREIGN KEY (schedule_seat_id) REFERENCES public.schedule_seat(schedule_seat_id);


--
-- Name: member fk_member_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT fk_member_account FOREIGN KEY (account_id) REFERENCES public.account(account_id);


--
-- Name: movie_type fk_mt_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_type
    ADD CONSTRAINT fk_mt_movie FOREIGN KEY (movie_id) REFERENCES public.movie(movie_id);


--
-- Name: movie_type fk_mt_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_type
    ADD CONSTRAINT fk_mt_type FOREIGN KEY (type_id) REFERENCES public.type(type_id);


--
-- Name: movie_version fk_mv_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_version
    ADD CONSTRAINT fk_mv_movie FOREIGN KEY (movie_id) REFERENCES public.movie(movie_id);


--
-- Name: movie_version fk_mv_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movie_version
    ADD CONSTRAINT fk_mv_version FOREIGN KEY (version_id) REFERENCES public.version(version_id);


--
-- Name: payment fk_payment_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id);


--
-- Name: room_format fk_rf_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_format
    ADD CONSTRAINT fk_rf_room FOREIGN KEY (cinema_room_id) REFERENCES public.cinema_room(cinema_room_id);


--
-- Name: room_format fk_rf_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_format
    ADD CONSTRAINT fk_rf_version FOREIGN KEY (version_id) REFERENCES public.version(version_id);


--
-- Name: schedule fk_schedule_movie; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT fk_schedule_movie FOREIGN KEY (movie_id) REFERENCES public.movie(movie_id);


--
-- Name: schedule fk_schedule_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT fk_schedule_room FOREIGN KEY (cinema_room_id) REFERENCES public.cinema_room(cinema_room_id);


--
-- Name: schedule fk_schedule_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT fk_schedule_version FOREIGN KEY (version_id) REFERENCES public.version(version_id);


--
-- Name: seat fk_seat_pair; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat
    ADD CONSTRAINT fk_seat_pair FOREIGN KEY (pair_seat_id) REFERENCES public.seat(seat_id);


--
-- Name: seat fk_seat_room; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat
    ADD CONSTRAINT fk_seat_room FOREIGN KEY (cinema_room_id) REFERENCES public.cinema_room(cinema_room_id);


--
-- Name: schedule_seat fk_ss_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_seat
    ADD CONSTRAINT fk_ss_account FOREIGN KEY (reserved_by) REFERENCES public.account(account_id);


--
-- Name: schedule_seat fk_ss_schedule; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_seat
    ADD CONSTRAINT fk_ss_schedule FOREIGN KEY (schedule_id) REFERENCES public.schedule(schedule_id);


--
-- Name: schedule_seat fk_ss_seat; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_seat
    ADD CONSTRAINT fk_ss_seat FOREIGN KEY (seat_id) REFERENCES public.seat(seat_id);


--
-- Name: score_transaction fk_st_invoice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_transaction
    ADD CONSTRAINT fk_st_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id);


--
-- Name: score_transaction fk_st_member; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_transaction
    ADD CONSTRAINT fk_st_member FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 9a4lcqsLl9UtZDdikrvqvPKoYrXoRxgDryLT8b5ZjV8KyO9rAErIACWcxrNecjn

