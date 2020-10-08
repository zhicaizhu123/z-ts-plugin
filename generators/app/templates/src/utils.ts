
/**
 * 创建指定类名的元素
 *
 * @param {string} className 标签类名
 * @return {HTMLElement}
 */
export const buildElement = function (className: string): HTMLElement {
  const el = document.createElement('div');
  el.classList.add(className);
  return el;
};


/**
 * 自定义事件
 *
 * @param {HTMLElement} el 触发事件的元素
 * @param {string} name 事件名
 */
export const triggerEvent = function (el: HTMLElement, name: string) {
  let event = document.createEvent('HTMLEvents');
  event.initEvent(name, true, false);
  el.dispatchEvent(event);
};


/**
 * 求和
 *
 * @param {number} a 数字
 * @param {number} b 数字
 * @return {number} 
 */
export const sum = function (a: number, b: number): number {
  return a + b;
};


/**
 * 两个值是否区域相等
 *
 * @param {number} value 数字
 * @param {number} expected 数字
 * @return {boolean} 
 */
export const isCloseTo = function (value: number, expected: number): boolean {
  return value > expected - 0.01 && value < expected + 0.01;
};
