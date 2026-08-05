import PreviewBanner from "@/components/PreviewBanner";
import ComparisonPage from "@/pages/ComparisonPage";

/** Public, read-only view of the competitive intelligence workspace. */
const PreviewComparePage = () => (
  <>
    <PreviewBanner />
    <ComparisonPage preview />
  </>
);

export default PreviewComparePage;
