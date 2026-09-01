import { availabilityCalendar, services } from "@wix/bookings";
import { createClient, OAuthStrategy } from "@wix/sdk";

export const wixClient = createClient({
  modules: {
    services,
    availabilityCalendar,
  },
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
  }),
});
