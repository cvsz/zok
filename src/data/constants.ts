import { ChannelType, ChannelConfig } from '@/types';

export const channelConfigs: ChannelConfig[] = [
  {
    id: 'website',
    type: 'website',
    name: 'แชทวิดเจ็ตบนเว็บไซต์',
    connected: true,
    accountName: '1 บัญชีที่เชื่อมต่อแล้ว',
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/website-chat-widget',
    connectUrl: '#',
    icon: '/images/chat-widget.svg',
  },
  {
    id: 'facebook',
    type: 'facebook',
    name: 'Facebook',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/facebook-messenger/how-to-connect',
    connectUrl: 'https://business.facebook.com',
    icon: '/images/facebook.svg',
  },
  {
    id: 'instagram',
    type: 'instagram',
    name: 'Instagram',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/instagram/how-to-connect',
    connectUrl: 'https://business.facebook.com',
    icon: '/images/instagram.svg',
  },
  {
    id: 'whatsapp',
    type: 'whatsapp',
    name: 'WhatsApp',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/whatsapp-business/how-to-connect',
    connectUrl: 'https://business.facebook.com',
    icon: '/images/whatsapp.svg',
  },
  {
    id: 'line',
    type: 'line',
    name: 'LINE Official Account',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/line/how-to-connect',
    connectUrl: 'https://manager.line.biz',
    icon: '/images/line.svg',
  },
  {
    id: 'shopee',
    type: 'shopee',
    name: 'Shopee',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/shopee/how-to-connect',
    connectUrl: 'https://seller.shopee.co.th/portal',
    icon: '/images/shopee_icon.svg',
  },
  {
    id: 'lazada',
    type: 'lazada',
    name: 'Lazada',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/lazada/how-to-connect',
    connectUrl: 'https://sellercenter.lazada.co.th',
    icon: '/images/lazada.svg',
  },
  {
    id: 'tiktok',
    type: 'tiktok',
    name: 'TikTok Shop',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/tiktok/how-to-connect',
    connectUrl: 'https://seller-th.tiktok.com',
    icon: '/images/tiktok_shop_icon.svg',
  },
  {
    id: 'gmail',
    type: 'gmail',
    name: 'Gmail',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/gmail/how-to-connect',
    connectUrl: 'https://mail.google.com',
    icon: '/images/channels/gmail.svg',
  },
  {
    id: 'outlook',
    type: 'outlook',
    name: 'Outlook',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/outlook/how-to-connect',
    connectUrl: 'https://outlook.live.com',
    icon: '/images/channels/outlook.svg',
  },
  {
    id: 'shopify',
    type: 'shopify',
    name: 'Shopify',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/shopify/how-to-connect',
    connectUrl: 'https://shopify.com',
    icon: '/images/channels/shopify.svg',
  },
  {
    id: 'hubspot',
    type: 'hubspot',
    name: 'HubSpot',
    connected: false,
    setupGuideUrl: 'https://help.zok.zeaz.dev/integrations/hubspot/how-to-connect',
    connectUrl: 'https://hubspot.com',
    icon: '/images/channels/hubspot.svg',
  },
];

export const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

export const daysOfWeek = [
  { value: 0, label: 'วันอาทิตย์' },
  { value: 1, label: 'วันจันทร์' },
  { value: 2, label: 'วันอังคาร' },
  { value: 3, label: 'วันพุธ' },
  { value: 4, label: 'วันพฤหัสบดี' },
  { value: 5, label: 'วันศุกร์' },
  { value: 6, label: 'วันเสาร์' },
];

export const defaultBusinessHours = daysOfWeek.map(day => ({
  day: day.value,
  open: '09:00',
  close: '18:00',
  isClosed: false,
}));
