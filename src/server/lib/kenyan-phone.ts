const KENYAN_MOBILE_NATIONAL_NUMBER = /^[17]\d{8}$/;

export function normalizeKenyanPhoneNumber(input: string) {
  const compact = input.trim().replace(/[\s()-]/g, "");
  let nationalNumber: string;

  if (compact.startsWith("+254")) {
    nationalNumber = compact.slice(4);
  } else if (compact.startsWith("254")) {
    nationalNumber = compact.slice(3);
  } else if (compact.startsWith("0")) {
    nationalNumber = compact.slice(1);
  } else {
    nationalNumber = compact;
  }

  if (!KENYAN_MOBILE_NATIONAL_NUMBER.test(nationalNumber)) {
    return null;
  }

  return `+254${nationalNumber}`;
}
