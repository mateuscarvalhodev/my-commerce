import { HighlightCategoryPageContent } from "./page-content";

type HighlightCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HighlightCategoryPage({
  params,
}: HighlightCategoryPageProps) {
  const { slug } = await params;

  return <HighlightCategoryPageContent slug={slug} />;
}
