import { Navbar } from "@/src/widgets/Navbar";
import { Footer } from "@/src/widgets/Footer";
import { UndoProvider } from "@/src/share/ui/UndoProvider";
import { SkipToContent } from "@/src/share/ui/SkipToContent";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * The provider wraps the whole group, including the Navbar, because the undo
     * bar has to outlive the page that raised it: deleting a post navigates away,
     * and a bar owned by the page being left would unmount with it. It is also
     * outside <main> so the bar is never inside the max-width column and cannot be
     * clipped by it.
     *
     * <main> carries pb-28 on small screens so the mobile tab bar, which is fixed
     * to the bottom of the viewport, is never sitting on top of the last line of
     * content. The tab bar is a sibling of <main> and a fixed overlay, so nothing
     * in the flow can reserve space for it.
     */
    <UndoProvider>
      <SkipToContent />
      <Navbar />
      {/* id + tabIndex: the skip link's target. tabIndex -1 is what lets it take
          focus programmatically -- without it the browser scrolls but focus stays
          on the link, so the next Tab returns to the navigation the reader just
          skipped. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:pb-6 lg:px-8"
      >
        {children}
      </main>
      <Footer />
    </UndoProvider>
  );
}
