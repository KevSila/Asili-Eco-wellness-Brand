export type PublicPage = "home" | "honey";

export const orderFormHref = (page: PublicPage) => page === "honey" ? "#order" : "/honey/#order";
