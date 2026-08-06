import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Keyboard, Film, Clock, MapPin, Armchair, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import TicketService from '../../services/TicketService';
import { TICKET_CHECKIN_LABELS as L } from '../../constants/labels';

const SCANNER_ELEMENT_ID = 'employee-ticket-qr-reader';

const STATUS_BADGE = {
  BOOKED: { className: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30', label: L.statusBooked },
  CHECKED_IN: { className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', label: L.statusCheckedIn },
  CANCELLED: { className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30', label: L.statusCancelled },
  EXPIRED: { className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700', label: L.statusExpired },
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const EmployeeTicketCheckInPage = () => {
  const [mode, setMode] = useState('scan');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const scannerRef = useRef(null);
  const lastScannedRef = useRef('');

  const lookupTicket = (code) => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setTicket(null);
    setJustCheckedIn(false);

    TicketService.previewTicket(trimmed)
      .then((res) => {
        setTicket(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response?.status === 404 ? L.notFound : (err.response?.data?.message || L.genericError));
      });
  };

  useEffect(() => {
    if (mode !== 'scan') {
      return undefined;
    }

    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      { fps: 10, experimentalFeatures: { useBarCodeDetectorIfSupported: true } },
      false
    );
    scanner.render(
      (decodedText) => {
        if (decodedText === lastScannedRef.current) return;
        lastScannedRef.current = decodedText;
        lookupTicket(decodedText);
      },
      () => {}
    );
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [mode]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    lookupTicket(manualCode);
  };

  const handleConfirmCheckIn = () => {
    if (!ticket) return;
    setConfirming(true);
    setError('');
    TicketService.checkIn(ticket.ticketCode)
      .then((res) => {
        setTicket(res.data.data);
        setJustCheckedIn(true);
        setConfirming(false);
      })
      .catch((err) => {
        setConfirming(false);
        setError(err.response?.data?.message || L.genericError);
      });
  };

  const resetLookup = () => {
    setTicket(null);
    setError('');
    setManualCode('');
    setJustCheckedIn(false);
    lastScannedRef.current = '';
  };

  const seatLabels = (ticket?.seats || []).map((s) => s.seatLabel).join(', ');
  const badge = ticket ? STATUS_BADGE[ticket.status] : null;

  return (
    <div className="checkin-dark-surface space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{L.pageTitle}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-5 transition-colors duration-300">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMode('scan'); resetLookup(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'scan' ? 'bg-[#C00000] text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <QrCode size={16} /> {L.scanTabLabel}
            </button>
            <button
              type="button"
              onClick={() => { setMode('manual'); resetLookup(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'manual' ? 'bg-[#C00000] text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Keyboard size={16} /> {L.manualTabLabel}
            </button>
          </div>

          {mode === 'scan' ? (
            <div>
              <div id={SCANNER_ELEMENT_ID} className="rounded-xl overflow-hidden" />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">{L.scannerPlaceholder}</p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={L.manualInputPlaceholder}
                className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm font-bold uppercase tracking-widest rounded-xl px-4 py-3.5 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-gray-400 dark:focus:border-gray-500 transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || loading}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {L.manualSubmitButton}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl shadow-sm p-6 space-y-5 min-h-[280px] transition-colors duration-300">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 tracking-wider uppercase border-b border-gray-100 dark:border-gray-800 pb-2">
            {L.ticketFound}
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-10 text-sm font-bold text-[#C00000] dark:text-[#E50914] animate-pulse">
              {L.loading}
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl text-sm font-bold text-red-600 dark:text-red-300">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && !ticket && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">{L.scannerPlaceholder}</p>
          )}

          {!loading && ticket && (
            <div className="space-y-4">
              {justCheckedIn && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/30 rounded-xl text-sm font-bold text-green-700 dark:text-green-300">
                  <CheckCircle2 size={20} />
                  <span>{L.checkInSuccess}</span>
                </div>
              )}

              {!justCheckedIn && ticket.status === 'CHECKED_IN' && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm font-bold text-amber-700 dark:text-amber-300">
                  <AlertTriangle size={20} />
                  <span>{L.alreadyCheckedInWarning}</span>
                </div>
              )}

              {ticket.status === 'CANCELLED' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl text-sm font-bold text-red-600 dark:text-red-300">
                  <XCircle size={20} />
                  <span>{L.cancelledWarning}</span>
                </div>
              )}

              {ticket.status === 'EXPIRED' && (
                <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400">
                  <XCircle size={20} />
                  <span>{L.expiredWarning}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-gray-900 dark:text-white tracking-widest">{ticket.ticketCode}</span>
                {badge && (
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-bold text-gray-600 dark:text-gray-400">
                <p className="flex items-center gap-2"><Film size={14} className="text-[#C00000] dark:text-[#E50914]" /> {L.movieLabel}: <span className="text-gray-900 dark:text-white">{ticket.movieName}</span></p>
                <p className="flex items-center gap-2"><Clock size={14} className="text-[#C00000] dark:text-[#E50914]" /> {L.showtimeLabel}: <span className="text-gray-900 dark:text-white">{formatDateTime(ticket.showtime)}</span></p>
                <p className="flex items-center gap-2"><MapPin size={14} className="text-[#C00000] dark:text-[#E50914]" /> {L.roomLabel}: <span className="text-gray-900 dark:text-white">{ticket.roomName}</span></p>
                <p className="flex items-center gap-2"><Armchair size={14} className="text-[#C00000] dark:text-[#E50914]" /> {L.seatsLabel} ({ticket.ticketCount}): <span className="text-gray-900 dark:text-white">{seatLabels}</span></p>
              </div>

              {ticket.status === 'CHECKED_IN' && ticket.checkedInAt && (
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{L.checkedInAtLabel}: {formatDateTime(ticket.checkedInAt)}</p>
              )}
              {ticket.status === 'CANCELLED' && ticket.cancelledAt && (
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{L.cancelledAtLabel}: {formatDateTime(ticket.cancelledAt)}</p>
              )}

              {ticket.status === 'BOOKED' && !justCheckedIn && (
                <button
                  type="button"
                  onClick={handleConfirmCheckIn}
                  disabled={confirming}
                  className="w-full py-3.5 bg-[#C00000] hover:bg-[#a00000] disabled:bg-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  {confirming ? L.confirming : L.confirmButton}
                </button>
              )}

              {(justCheckedIn || ticket.status !== 'BOOKED') && (
                <button
                  type="button"
                  onClick={resetLookup}
                  className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {L.scanAnotherButton}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTicketCheckInPage;
