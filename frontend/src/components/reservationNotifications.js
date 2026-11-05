// Gedeeld door de pop-upmeldingen, het meldingenoverzicht en de docentpagina's
export const NEW_RESERVATION_EVENT = 'vistaflow:nieuwe-reservering';
export const RESERVATIONS_REMOVED_EVENT = 'vistaflow:reserveringen-verwijderd';

export function describe(reservation) {
  return `${reservation.student_naam} reserveerde ${reservation.aantal} ${reservation.eenheid} ${reservation.product_naam}`;
}
