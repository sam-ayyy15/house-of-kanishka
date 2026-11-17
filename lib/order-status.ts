/** How each order status is worded for customers. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  awaiting_confirmation: 'Awaiting your confirmation',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  expired: 'Lapsed',
  refunded: 'Refunded',
};

export const orderStatusLabel = (status: string) => ORDER_STATUS_LABEL[status] ?? status;

export const orderDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
