/**
 * RIVO Haptic Feedback Engine
 * Provides native tactile vibration responses on touch devices (Android & WebKit Vibration API)
 */

export type HapticImpactStyle = 'light' | 'medium' | 'heavy';
export type HapticNotificationType = 'success' | 'warning' | 'error';

export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
}

/**
 * Triggers arbitrary vibration pattern safely in client environments
 */
export function triggerHaptic(pattern: number | number[] = 15): boolean {
  if (isHapticsSupported()) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Simulates iOS UIImpactFeedbackGenerator styles
 */
export function hapticImpact(style: HapticImpactStyle = 'medium'): boolean {
  switch (style) {
    case 'light':
      return triggerHaptic(10);
    case 'heavy':
      return triggerHaptic([30, 20, 30]);
    case 'medium':
    default:
      return triggerHaptic(18);
  }
}

/**
 * Simulates UINotificationFeedbackGenerator feedback
 */
export function hapticNotification(type: HapticNotificationType = 'success'): boolean {
  switch (type) {
    case 'warning':
      return triggerHaptic([25, 40, 25]);
    case 'error':
      return triggerHaptic([50, 40, 50, 40, 50]);
    case 'success':
    default:
      return triggerHaptic([25, 35, 40]);
  }
}

/**
 * Subtle tactile feedback for button clicks and selections
 */
export function hapticSelection(): boolean {
  return triggerHaptic(12);
}

/**
 * Tactile feedback for ink stamping fidelity passes
 */
export function hapticStamp(): boolean {
  return triggerHaptic([20, 25, 35]);
}

/**
 * Celebratory multi-pulse haptic feedback for loyalty reward unlocking
 */
export function hapticReward(): boolean {
  return triggerHaptic([40, 30, 50, 30, 70]);
}

/**
 * Confirmation haptic feedback
 */
export function hapticConfirm(): boolean {
  return triggerHaptic([20, 30]);
}

/**
 * Light touch feedback for regular taps
 */
export function hapticTap(): boolean {
  return hapticImpact('light');
}

/**
 * Success notification haptic feedback
 */
export function hapticSuccess(): boolean {
  return hapticNotification('success');
}

/**
 * Warning notification haptic feedback
 */
export function hapticWarning(): boolean {
  return hapticNotification('warning');
}

/**
 * NFC scan pulse haptic pattern
 */
export function hapticNfcPulse(): boolean {
  return triggerHaptic([15, 30, 45, 30, 60]);
}

/**
 * Star rating tactile feedback
 */
export function hapticStarRating(rating: number = 1): boolean {
  return triggerHaptic(Array(Math.max(1, rating)).fill(12));
}

/**
 * Bell / Waiter call haptic pulse pattern
 */
export function hapticWaiterCall(): boolean {
  return triggerHaptic([35, 25, 35, 25, 60]);
}
