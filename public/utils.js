/**
 * Utility function to disable a button while a promise is loading
 * @param {HTMLElement} button - The button element to disable
 * @param {Promise} promise - The promise that represents the loading operation
 */
function disableButtonWhileLoading(button, promise) {
  if (!(button instanceof HTMLElement)) {
    throw new Error('First argument must be an HTML element');
  }
  
  if (!(promise instanceof Promise)) {
    throw new Error('Second argument must be a Promise');
  }
  
  button.dataset.originalText = button.innerText;
  button.innerText = 'Loading...';
  button.disabled = true;
  promise.finally(() => {
    button.innerText = button.dataset.originalText;
    button.disabled = false;
  });
} 