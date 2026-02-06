import { authenticatedFetch } from './salesmanAdminFetch';

export async function getSalesmen() {
  const data = await authenticatedFetch('/api/mobile/salesman-admin/list');
  return data.salesmen || [];
}

export async function getSalesmanDetail(id) {
  const data = await authenticatedFetch(`/api/mobile/salesman-admin/detail?id=${id}`);
  return data;
}
