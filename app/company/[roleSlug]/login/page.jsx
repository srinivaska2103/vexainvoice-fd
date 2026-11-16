'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import DynamicRoleLogin from '@/components/auth/DynamicRoleLogin';

export default function RoleLoginPage() {
  const params = useParams();
  const roleSlug = params?.roleSlug;

  return <DynamicRoleLogin roleSlug={roleSlug} />;
}

