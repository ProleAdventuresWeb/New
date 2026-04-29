/**
 * Umami Analytics Event Helpers
 * Wraps umami.track() calls with type safety and graceful fallback.
 */

interface UmamiTracker {
  track: (eventName: string, eventData?: Record<string, string | number>) => void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

function track(eventName: string, data?: Record<string, string | number>): void {
  try {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(eventName, data);
    }
  } catch {
    // Silently fail — analytics should never break the app
  }
}

// Shop events
export const analytics = {
  productView: (productId: string, productName: string) =>
    track('product_view', { product_id: productId, product_name: productName }),

  addToCart: (productId: string, variantId: string, quantity: number) =>
    track('add_to_cart', { product_id: productId, variant_id: variantId, quantity }),

  beginCheckout: (orderTotal: number, itemCount: number) =>
    track('begin_checkout', { order_total: orderTotal, item_count: itemCount }),

  purchaseComplete: (orderId: string, total: number) =>
    track('purchase_complete', { order_id: orderId, total }),

  // Account events
  accountCreated: () => track('account_created'),
  login: () => track('login'),
  orderViewed: (orderId: string) => track('order_viewed', { order_id: orderId }),

  // General
  pageView: (pageName: string) => track('page_view', { page: pageName }),
};
