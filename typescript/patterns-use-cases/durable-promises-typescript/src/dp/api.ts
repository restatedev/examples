// ----------------------------------------------------------------------------
//               Interfaces and Types for the Durable Promises
// ----------------------------------------------------------------------------

/**
 * The core durable promise type.
 */
export type DurablePromise<T> = {
  /** The ID of the durable promise. */
  id: string;

  /** A JS promises that represents the durable promise.
   * Will complete when the durable promise completes */
  get(): Promise<T>;

  /** A JS promises that represents the current value, and return 'null'
   * if the durable promise is not yet complete. */
  peek(): Promise<T | null>;

  /** Resolves the durable promise. The returned promise resolves to the
   * actual value of the promise, which can be different if the promise was
   * completed before by some other request. */
  resolve(value?: T): Promise<T>;

  /** Rejects the durable promise with an error message (not an actual Error, due
   * to the footguns in serializing Errors across processes).
   * The returned promise resolves to the actual value of the promise, which can
   * be different if the promise was completed before by some other request. */
  reject(errorMsg: string): Promise<T>;
};
