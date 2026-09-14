export interface OrderCustomerIdentityInput {
  customerNameSnapshot?: string | null;
  customerPhoneSnapshot?: string | null;
  currentName?: string | null;
  currentPhone?: string | null;
}

export function resolveHistoricalOrderCustomer(input: OrderCustomerIdentityInput, fallbackName = "Customer") {
  return {
    name: input.customerNameSnapshot ?? input.currentName ?? fallbackName,
    phone: input.customerPhoneSnapshot ?? input.currentPhone ?? null,
  };
}
