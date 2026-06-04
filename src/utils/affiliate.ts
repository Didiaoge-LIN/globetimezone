export const AFFILIATE_LINKS: Record<string, string> = {
  calendly: 'https://calendly.com/your-ref',
  zoom: 'https://zoom.us/your-ref',
  wise: 'https://wise.com/your-ref',
  shopify: 'https://shopify.com/your-ref',
};
export function getAffiliateUrl(key: string): string {
  return AFFILIATE_LINKS[key] || '#';
}
