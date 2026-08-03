package org.example.be.service;

import org.example.be.dto.EmployeeBookingDetailDTO;
import org.example.be.dto.EmployeeConfirmBookingRequest;
import org.example.be.entity.Account;
import org.example.be.entity.CinemaRoom;
import org.example.be.entity.Invoice;
import org.example.be.entity.InvoiceSeat;
import org.example.be.entity.Member;
import org.example.be.entity.Movie;
import org.example.be.entity.Payment;
import org.example.be.entity.Schedule;
import org.example.be.entity.ScheduleSeat;
import org.example.be.entity.ScoreTransaction;
import org.example.be.entity.Seat;
import org.example.be.repository.AccountRepository;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.InvoiceRepository;
import org.example.be.repository.InvoiceSeatRepository;
import org.example.be.repository.MemberRepository;
import org.example.be.repository.MovieRepository;
import org.example.be.repository.PaymentRepository;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.ScheduleSeatRepository;
import org.example.be.repository.ScoreTransactionRepository;
import org.example.be.repository.SeatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers the employee counter-booking flow merged from origin/develop: point
 * spend/earn validation and the resulting invoice/payment/score bookkeeping.
 * No prior tests existed for BookingService.
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceCreateEmployeeBookingTest {

    private static final Integer SCHEDULE_ID = 1;

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private SeatRepository seatRepository;
    @Mock private ScheduleSeatRepository scheduleSeatRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private InvoiceSeatRepository invoiceSeatRepository;
    @Mock private ScoreTransactionRepository scoreTransactionRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private CinemaRoomRepository cinemaRoomRepository;
    @Mock private MovieRepository movieRepository;
    @Mock private PricingService pricingService;
    @Mock private SeatRealtimeService seatRealtimeService;

    @InjectMocks
    private BookingService bookingService;

    private Schedule schedule;
    private Seat normalSeat;
    private Seat vipSeat;

    @BeforeEach
    void setUp() {
        schedule = new Schedule();
        schedule.setScheduleId(SCHEDULE_ID);
        schedule.setMovieId("MOV1");
        schedule.setCinemaRoomId(1);
        schedule.setStartTime(LocalDateTime.now().plusDays(1));

        normalSeat = Seat.builder().seatId(10).cinemaRoomId(1).seatRow(1).seatColumn("1").seatType(0).build();
        vipSeat = Seat.builder().seatId(11).cinemaRoomId(1).seatRow(1).seatColumn("2").seatType(1).build();

        // createEmployeeBooking() (merged from develop's booking-flow fix) now requires a logged-in
        // employee to record Invoice.soldByAccountId; getLoggedInAccount() falls back to username
        // "customer" outside a real security context. lenient() since not every test reaches this call.
        lenient().when(accountRepository.findByUsername("customer"))
                .thenReturn(Optional.of(Account.builder().accountId("EMP1").username("customer").build()));
    }

    private void stubSeatPricing() {
        when(pricingService.calculatePrice(schedule, normalSeat)).thenReturn(BigDecimal.valueOf(80000));
        when(pricingService.calculatePrice(schedule, vipSeat)).thenReturn(BigDecimal.valueOf(96000));
    }

    /** confirmBooking() always runs these two lookups before any validation. */
    private void stubNoSeatConflicts(List<Integer> seatIds) {
        when(invoiceRepository.findByScheduleIdAndStatusAndBookingDateBefore(eq(SCHEDULE_ID), eq(0), any()))
                .thenReturn(List.of());
        for (Integer seatId : seatIds) {
            when(scheduleSeatRepository.findByScheduleIdAndSeatId(SCHEDULE_ID, seatId)).thenReturn(Optional.empty());
        }
    }

    @Test
    void rejectsEmptySeatSelection() {
        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(List.of())
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createEmployeeBooking(SCHEDULE_ID, request));
    }

    @Test
    void rejectsNegativePoints() {
        stubNoSeatConflicts(List.of(10));
        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(List.of(10))
                .pointsToUse(-1)
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createEmployeeBooking(SCHEDULE_ID, request));
    }

    @Test
    void requiresMemberWhenUsingPoints() {
        stubNoSeatConflicts(List.of(10));
        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(List.of(10))
                .pointsToUse(2)
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createEmployeeBooking(SCHEDULE_ID, request));
    }

    @Test
    void rejectsUnknownMember() {
        stubNoSeatConflicts(List.of(10));
        when(memberRepository.findByIdWithAccount("GHOST")).thenReturn(Optional.empty());

        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(List.of(10))
                .memberId("GHOST")
                .pointsToUse(1)
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createEmployeeBooking(SCHEDULE_ID, request));
    }

    @Test
    void rejectsPointsAboveBookingTotalCap() {
        List<Integer> seatIds = List.of(10, 11);
        stubNoSeatConflicts(seatIds);

        Member member = new Member();
        member.setMemberId("MEM1");
        member.setScore(1000);
        when(memberRepository.findByIdWithAccount("MEM1")).thenReturn(Optional.of(member));
        when(scheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(seatRepository.findById(10)).thenReturn(Optional.of(normalSeat));
        when(seatRepository.findById(11)).thenReturn(Optional.of(vipSeat));
        stubSeatPricing();

        // total = 80000 + 96000 = 176000 -> createEmployeeBooking's own cap is
        // floor(totalSeatPrice / 1000) = 176 points (unlike the 20%-of-total cap
        // createInvoiceAndPayment enforces for customer self-checkout — see the
        // business-rule note flagged in the DOD doc). 177 is the first value that
        // exceeds this flow's actual cap.
        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(seatIds)
                .memberId("MEM1")
                .pointsToUse(177)
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createEmployeeBooking(SCHEDULE_ID, request));
    }

    @Test
    void rejectsPointsAboveMemberBalance() {
        List<Integer> seatIds = List.of(10, 11);
        stubNoSeatConflicts(seatIds);

        Member member = new Member();
        member.setMemberId("MEM1");
        member.setScore(3);
        when(memberRepository.findByIdWithAccount("MEM1")).thenReturn(Optional.of(member));
        when(scheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(seatRepository.findById(10)).thenReturn(Optional.of(normalSeat));
        when(seatRepository.findById(11)).thenReturn(Optional.of(vipSeat));
        stubSeatPricing();

        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(seatIds)
                .memberId("MEM1")
                .pointsToUse(5) // under the 17-point total cap, but above this member's balance of 3
                .build();

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createEmployeeBooking(SCHEDULE_ID, request));
    }

    @Test
    void walkInCustomerPaysFullCashPriceWithNoScoreChange() {
        List<Integer> seatIds = List.of(10, 11);
        stubNoSeatConflicts(seatIds);

        when(scheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(seatRepository.findById(10)).thenReturn(Optional.of(normalSeat));
        when(seatRepository.findById(11)).thenReturn(Optional.of(vipSeat));
        stubSeatPricing();

        when(scheduleSeatRepository.save(any(ScheduleSeat.class))).thenAnswer(inv -> {
            ScheduleSeat ss = inv.getArgument(0);
            if (ss.getScheduleSeatId() == null) {
                ss.setScheduleSeatId(ss.getSeatId() + 1000);
            }
            return ss;
        });
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> {
            Invoice invoice = inv.getArgument(0);
            invoice.setInvoiceId(500);
            return invoice;
        });
        when(invoiceSeatRepository.findByInvoiceId(500)).thenReturn(List.of(
                InvoiceSeat.builder().invoiceId(500).scheduleSeatId(1010).price(80000.0).build(),
                InvoiceSeat.builder().invoiceId(500).scheduleSeatId(1011).price(96000.0).build()));
        when(scheduleSeatRepository.findById(1010)).thenReturn(Optional.of(
                ScheduleSeat.builder().scheduleSeatId(1010).scheduleId(SCHEDULE_ID).seatId(10).build()));
        when(scheduleSeatRepository.findById(1011)).thenReturn(Optional.of(
                ScheduleSeat.builder().scheduleSeatId(1011).scheduleId(SCHEDULE_ID).seatId(11).build()));
        when(movieRepository.findById("MOV1")).thenReturn(Optional.of(
                Movie.builder().movieId("MOV1").movieNameVn("Phim Test").build()));
        when(cinemaRoomRepository.findById(1)).thenReturn(Optional.of(
                CinemaRoom.builder().cinemaRoomId(1).cinemaRoomName("Phong 1").build()));

        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(seatIds)
                .build();

        EmployeeBookingDetailDTO result = bookingService.createEmployeeBooking(SCHEDULE_ID, request);

        assertEquals(176000.0, result.getTotalMoney(), 0.001);
        assertEquals(0, result.getUseScore());
        assertEquals(0, result.getAddScore());
        assertEquals("Phim Test", result.getMovieName());
        assertEquals("Phong 1", result.getScreen());
        assertNull(result.getMemberId());

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertEquals("CASH", paymentCaptor.getValue().getPaymentMethod());
        assertEquals(176000.0, paymentCaptor.getValue().getAmount(), 0.001);

        verify(memberRepository, never()).save(any());
        verify(scoreTransactionRepository, never()).save(any());
    }

    @Test
    void memberEarnsAndSpendsScoreInSameBooking() {
        List<Integer> seatIds = List.of(10, 11);
        stubNoSeatConflicts(seatIds);

        Account account = Account.builder().accountId("ACC1").fullName("Nguyen Van A").phoneNumber("0900000000").build();
        Member member = new Member();
        member.setMemberId("MEM1");
        member.setScore(50);
        member.setAccount(account);

        when(memberRepository.findByIdWithAccount("MEM1")).thenReturn(Optional.of(member));
        when(scheduleRepository.findById(SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(seatRepository.findById(10)).thenReturn(Optional.of(normalSeat));
        when(seatRepository.findById(11)).thenReturn(Optional.of(vipSeat));
        stubSeatPricing();
        when(scheduleSeatRepository.save(any(ScheduleSeat.class))).thenAnswer(inv -> {
            ScheduleSeat ss = inv.getArgument(0);
            if (ss.getScheduleSeatId() == null) {
                ss.setScheduleSeatId(ss.getSeatId() + 1000);
            }
            return ss;
        });
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> {
            Invoice invoice = inv.getArgument(0);
            invoice.setInvoiceId(600);
            return invoice;
        });
        when(invoiceSeatRepository.findByInvoiceId(600)).thenReturn(List.of(
                InvoiceSeat.builder().invoiceId(600).scheduleSeatId(1010).price(80000.0).build(),
                InvoiceSeat.builder().invoiceId(600).scheduleSeatId(1011).price(96000.0).build()));
        when(scheduleSeatRepository.findById(1010)).thenReturn(Optional.of(
                ScheduleSeat.builder().scheduleSeatId(1010).scheduleId(SCHEDULE_ID).seatId(10).build()));
        when(scheduleSeatRepository.findById(1011)).thenReturn(Optional.of(
                ScheduleSeat.builder().scheduleSeatId(1011).scheduleId(SCHEDULE_ID).seatId(11).build()));
        when(movieRepository.findById("MOV1")).thenReturn(Optional.of(
                Movie.builder().movieId("MOV1").movieNameVn("Phim Test").build()));
        when(cinemaRoomRepository.findById(1)).thenReturn(Optional.of(
                CinemaRoom.builder().cinemaRoomId(1).cinemaRoomName("Phong 1").build()));
        when(memberRepository.findByAccountAccountId("ACC1")).thenReturn(Optional.of(member));

        EmployeeConfirmBookingRequest request = EmployeeConfirmBookingRequest.builder()
                .seatIds(seatIds)
                .memberId("MEM1")
                .pointsToUse(5)
                .build();

        EmployeeBookingDetailDTO result = bookingService.createEmployeeBooking(SCHEDULE_ID, request);

        // 1 point = 1000d everywhere in this codebase: total 176000 - 5*1000 = 171000;
        // addScore = floor(171000 * 0.05 / 1000) = 8
        assertEquals(171000.0, result.getTotalMoney(), 0.001);
        assertEquals(5, result.getUseScore());
        assertEquals(8, result.getAddScore());
        assertEquals("MEM1", result.getMemberId());
        assertEquals("Nguyen Van A", result.getMemberFullName());
        assertEquals(53, result.getMemberScoreAfter()); // 50 - 5 + 8

        ArgumentCaptor<ScoreTransaction> txCaptor = ArgumentCaptor.forClass(ScoreTransaction.class);
        verify(scoreTransactionRepository, times(2)).save(txCaptor.capture());
        List<ScoreTransaction> txs = txCaptor.getAllValues();
        assertEquals("SUB", txs.get(0).getTxnType());
        assertEquals(5, txs.get(0).getPoints());
        assertEquals("ADD", txs.get(1).getTxnType());
        assertEquals(8, txs.get(1).getPoints());
    }
}
