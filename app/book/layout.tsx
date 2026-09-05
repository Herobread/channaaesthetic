import BookingBar from "@/components/booking/BookingBar";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <BookingBar />
    </div>
  );
}
