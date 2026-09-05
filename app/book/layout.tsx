import BookingBar from "@/components/booking/BookingBar";

export default function BookingLayout({
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
