import { ProductPageContent } from "./product-page-content";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductPageContent slug={slug} />;
}
