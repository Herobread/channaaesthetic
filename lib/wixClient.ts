import { availabilityCalendar, bookings, services } from "@wix/bookings";
import { currentCart } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { createClient, OAuthStrategy } from "@wix/sdk";

export const wixClient = createClient({
  modules: {
    services,
    availabilityCalendar,
    bookings, // <-- Added this back
    redirects,
    currentCart,
  },
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID || "",
  }),
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      cache: "no-store",
    });
  },
});
