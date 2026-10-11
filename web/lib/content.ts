export const chapters = [
  { label: 'The field', title: 'Every season starts with a stack of bills.', body: 'Seed, fertilizer, labour, diesel. The receipts pile up long before the harvest comes in.' },
  { label: 'Snap a bill', title: "Snap a bill. That's the whole job.", body: "In the app we're building, you take one photo of a bill the day you get it. No typing, no ledger." },
  { label: 'Filed for you', title: 'AI files it under crop and season.', body: 'Each cost is matched to the crop it was spent on, like Wheat · Rabi or Cotton · Kharif, so nothing gets lost in a drawer.' },
  { label: 'Profit per crop', title: 'See what each crop really earned.', body: 'Sales minus expenses, crop by crop. A clearer picture for planning next season.' },
];
export const bills = [
  { id: 'urea', label: 'Urea fertilizer', vendor: 'Sample Agro Centre', amount: 2680, category: 'Fertilizer', crop: 'Wheat', season: 'Rabi' },
  { id: 'diesel', label: 'Diesel', vendor: 'Sample Fuel Station', amount: 1450, category: 'Diesel', crop: 'Cotton', season: 'Kharif' },
  { id: 'labour', label: 'Field labour', vendor: 'Sample field workers', amount: 3200, category: 'Labour', crop: 'Rice', season: 'Kharif' },
  { id: 'seed', label: 'Wheat seed', vendor: 'Sample Seed Store', amount: 4100, category: 'Seed', crop: 'Wheat', season: 'Rabi' },
];
export const categories = ['Seed', 'Fertilizer', 'Labour', 'Diesel', 'Pesticide', 'Irrigation', 'Equipment', 'Transport', 'Wheat · Rabi', 'Cotton · Kharif'];
export const crops = {
  wheat: { name: 'Wheat', season: 'Rabi', sales: 80800, costs: [12000, 9800, 6500, 4300] },
  rice: { name: 'Rice', season: 'Kharif', sales: 105000, costs: [18500, 14200, 8200, 6100] },
  cotton: { name: 'Cotton', season: 'Kharif', sales: 92000, costs: [21000, 12800, 9400, 5800] },
};
export const PRIVACY_EMAIL = 'privacy@cropbillai.me'; // TODO: confirm monitored mailbox before launch.
