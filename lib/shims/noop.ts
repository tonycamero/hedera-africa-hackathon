/**
 * No-op shim module for disabling legacy TrustMesh components in Fairfield Voice mode
 */

export default {};
export const noop = () => {};
export const noopComponent = () => null;
export const noopStore = {};
export const noopService = {
  init: noop,
  start: noop,
  stop: noop,
  get: () => null,
  set: noop,
  add: noop,
  remove: noop,
  update: noop,
};