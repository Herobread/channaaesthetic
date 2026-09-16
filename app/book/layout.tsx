import BookingBar from "@/components/booking/BookingBar";
import LocationPicker from "@/components/shared/LocationPicker";
import Navbar from "@/components/ui/NavBar";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary font-sans antialiased selection:bg-accent/20 selection:text-accent flex flex-col">
      <Navbar theme="dark" action={<LocationPicker />} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-36">
        {children}
      </main>
      <BookingBar />
    </div>
  );
}
