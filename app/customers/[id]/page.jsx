import CustomerDetailContent from '@/components/CustomerDetailContent';

export const dynamicParams = true;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function CustomerDetailPage() {
  return <CustomerDetailContent />;
}
