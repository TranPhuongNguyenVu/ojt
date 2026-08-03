import AuthService from "./AuthService";

const TicketService = {
  previewTicket: (ticketCode) => {
    return AuthService.get(`employee/tickets/${encodeURIComponent(ticketCode)}`);
  },
  checkIn: (ticketCode) => {
    return AuthService.post(`employee/tickets/${encodeURIComponent(ticketCode)}/check-in`);
  },
};

export default TicketService;
