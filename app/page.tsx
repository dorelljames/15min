import ActivityTracker from "./components/ActivityTracker";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <ActivityTracker />
      <Footer />
    </div>
  );
}
