import ProductDetailContent from '@/components/ProductDetailContent';

export const dynamicParams = true;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ProductDetailPage({ params }) {
  const resolvedId = params?.id;
  return <ProductDetailContent productId={resolvedId} />;
}
