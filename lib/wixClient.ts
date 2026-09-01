import { availabilityCalendar, services } from "@wix/bookings";
import { checkout } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { createClient, OAuthStrategy } from "@wix/sdk";

export const wixClient = createClient({
  modules: {
    services,
    availabilityCalendar,
    checkout,
    redirects,
  },
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID || "",
  }),
});
