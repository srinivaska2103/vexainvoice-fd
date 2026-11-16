import SupplierDetailContent from '@/components/SupplierDetailContent';

export const dynamicParams = true;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function SupplierDetailPage() {
  return <SupplierDetailContent />;
}
