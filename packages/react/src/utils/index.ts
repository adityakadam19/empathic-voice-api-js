export const keepLastN = <T>(n: number, arr: T[]): T[] => {
  if (arr.length <= n) {
    return arr;
  }
  return arr.slice(arr.length - n);
};

export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  wait: number,
  immediate = false,
) {
  // This is a number in the browser and an object in Node.js,
  // so we'll use the ReturnType utility to cover both cases.
  let timeout: ReturnType<typeof setTimeout> | null;

  return function <U>(this: U, ...args: Parameters<typeof callback>) {
    const context = this;
    const later = () => {
      timeout = null;

      if (!immediate) {
        callback.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;

    if (typeof timeout === 'number') {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      callback.apply(context, args);
    }
  };
}
