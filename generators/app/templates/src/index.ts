import { IOptions, IOffset, ITouch } from './interface';
import { buildElement, triggerEvent, sum, isCloseTo } from './utils';
import DetectGestures from './detect-gestures';

export default class ScaleElement {
  options: IOptions = {
    tapZoomFactor: 2,
    zoomOutFactor: 1.2,
    animationDuration: 300,
    maxZoom: 4,
    minZoom: 0.5,
    draggableUnzoomed: true,
    lockDragAxis: false,
    setOffsetsOnce: false,
    use2d: true,
    isIntial: true,
    zoomStartEventName: 'zoomstart',
    zoomUpdateEventName: 'zoomupdate',
    zoomEndEventName: 'zoomend',
    dragStartEventName: 'dragstart',
    dragUpdateEventName: 'dragupdate',
    dragEndEventName: 'dragend',
    doubleTapEventName: 'doubletap',
    verticalPadding: 0,
    horizontalPadding: 0,
    onZoomStart: null,
    onZoomEnd: null,
    onZoomUpdate: null,
    onDragStart: null,
    onDragEnd: null,
    onDragUpdate: null,
    onDoubleTap: null,
  };

  /**
   * 克隆临时元素
   *
   * @type {(HTMLElement | null)}
   * @memberof ScaleElement
   */
  clone: HTMLElement | null = null;

  /**
   * 手势实例对象
   *
   * @type {(DetectGestures | null)}
   * @memberof ScaleElement
   */
  detectGestures: DetectGestures | null = null;

  /**
   * 实际缩放倍数
   *
   * @type {number}
   * @memberof ScaleElement
   */
  zoomFactor = 1;

  /**
   * 当前缩放过程中最新的缩放倍数，重新执行新的缩放时会重置为1
   *
   * @type {number}
   * @memberof ScaleElement
   */
  lastScale = 1;

  /**
   * 当前缩放过程中执行的缩放次数
   *
   * @type {number}
   * @memberof ScaleElement
   */
  nthZoom = 0;

  /**
   * 当前的位置偏移量
   *
   * @type {IOffset}
   * @memberof ScaleElement
   */
  offset: IOffset = {
    x: 0,
    y: 0,
  };

  /**
   * 起始的位置偏移量
   *
   * @type {IOffset}
   * @memberof ScaleElement
   */
  initialOffset: IOffset = {
    x: 0,
    y: 0,
  };

  /**
   * 操作元素的容器元素，动态创建
   *
   * @type {(HTMLElement | null)}
   * @memberof ScaleElement
   */
  container: HTMLElement | null = null;

  /**
   * 是否已经启动更新
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  updatePlaned = false;

  /**
   * 是否设置偏移位置
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  isOffsetsSet = false;

  /**
   * 是否使用3d方式
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  is3d = false;

  /**
   * 是否已经处于拖动或者移动状态
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  hasInteraction = false;

  /**
   * 是否正处于动画中状态
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  inAnimation = false;

  /**
   * 当前缩放上一次的多点触屏的中心坐标
   *
   * @type {(ITouch | null)}
   * @memberof ScaleElement
   */
  lastZoomCenter: ITouch | null = null;

  /**
   * 当前拖拽上一次的坐标
   *
   * @type {(ITouch | null)}
   * @memberof ScaleElement
   */
  lastDragPosition: ITouch | null = null;

  /**
   * 是否为双击
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  isDoubleTap = false;

  /**
   * 是否启用缩放和拖拽功能
   *
   * @type {boolean}
   * @memberof ScaleElement
   */
  enabled = true;

  /**
   * Creates an instance of ScaleElement.
   * @param {HTMLElement} el 缩放的元素
   * @param {IOptions} [options] 配置项
   * @memberof ScaleElement
   */
  constructor(public el: HTMLElement, options?: IOptions) {
    this.el = el;
    this.options = { ...this.options, ...(options || {}) };

    this.setupMarkup();
    this.bindEvents();
    this.update();

    if (this.isImageLoaded(this.el)) {
      this.updateAspectRatio();
      this.setupOffsets();
    }

    this.enable();
  }

  /**
   * 设置区域样式
   *
   * @memberof ScaleElement
   */
  setupMarkup() {
    this.container = buildElement('scroll-element-container');
    if (this.el.parentNode) {
      this.el.parentNode.insertBefore(this.container, this.el);
      this.container.appendChild(this.el);
      this.container.style.overflow = 'hidden';
      this.container.style.position = 'relative';
      this.el.style.webkitTransformOrigin = '0% 0%';
      this.el.style.transformOrigin = '0% 0%';
      this.el.style.position = 'absolute';
    }
  }

  /**
   * 绑定事件
   *
   * @memberof ScaleElement
   */
  bindEvents() {
    if (this.container) {
      this.detectGestures = new DetectGestures(this.container, this);
    }
    window.addEventListener('resize', this.eventHandler);
    Array.from(this.el.querySelectorAll('img')).forEach((imgEl) => {
      imgEl.addEventListener('load', this.eventHandler);
    });
    if (this.el.nodeName === 'IMG') {
      this.el.addEventListener('load', this.eventHandler);
    }
  }

  /**
   * 销毁
   *
   * @memberof ScaleElement
   */
  destory() {
    if (this.detectGestures) {
      this.detectGestures.destory();
    }
    window.removeEventListener('resize', this.eventHandler);
    Array.from(this.el.querySelectorAll('img')).forEach((imgEl) => {
      imgEl.removeEventListener('load', this.eventHandler);
    });
    if (this.el.nodeName === 'IMG') {
      this.el.removeEventListener('load', this.eventHandler);
    }
  }

  eventHandler = function (this: ScaleElement, event: Event) {
    this.update(event);
  }.bind(this);

  /**
   * 更新视图
   *
   * @param {Event} [event]
   * @return {*}
   * @memberof ScaleElement
   */
  update(event?: Event) {
    if (this.updatePlaned) return;
    this.updatePlaned = true;
    setTimeout(() => {
      this.updatePlaned = false;

      if (event && event.type === 'resize') {
        this.updateAspectRatio();
        this.setupOffsets();
      }

      if (event && event.type === 'load') {
        this.updateAspectRatio();
        this.setupOffsets();
      }

      const zoomFactor = this.getInitialZoomFactor() * this.zoomFactor;
      const offsetX = -this.offset.x / zoomFactor;
      const offsetY = -this.offset.y / zoomFactor;
      const transform3d = `scale3d(${zoomFactor}, ${zoomFactor},1) translate3d(${offsetX}px,${offsetY}px,0px)`;
      const transform2d = `scale(${zoomFactor}, ${zoomFactor}) translate(${offsetX}px,${offsetY}px)`;

      const removeClone = function (this: ScaleElement) {
        if (this.clone && this.clone.parentNode) {
          this.clone.parentNode.removeChild(this.clone);
          delete this.clone;
        }
      }.bind(this);

      if (!this.options.use2d || this.hasInteraction || this.inAnimation) {
        this.is3d = true;
        removeClone();

        this.el.style.webkitTransform = transform3d;
        this.el.style.transform = transform3d;
      } else {
        // TODO
        if (this.is3d) {
          this.clone = this.el.cloneNode(true) as HTMLElement;
          this.clone.style.pointerEvents = 'none';
          if (this.container) {
            this.container.appendChild(this.clone);
          }
          window.setTimeout(removeClone, 200);
        }

        this.el.style.webkitTransform = transform2d;
        this.el.style.transform = transform2d;

        this.is3d = false;
      }
    }, 0);
  }

  /**
   * 判断图片元素是否已经加载完，获取高度
   *
   * @param {HTMLElement} el 标签
   * @return {*}
   * @memberof ScaleElement
   */
  isImageLoaded(el: HTMLElement) {
    if (el.nodeName === 'IMG') {
      return (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalHeight !== 0;
    }
    return Array.from(el.querySelectorAll('img')).every(this.isImageLoaded);
  }

  /**
   * 启用缩放和拖拽功能
   *
   * @memberof ScaleElement
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 设置容器的高度
   *
   * @memberof ScaleElement
   */
  updateAspectRatio() {
    this.unsetContainerY();
    if (this.container && this.container.parentElement) {
      this.setContainerY(this.container.parentElement.offsetHeight);
    }
  }

  /**
   * 初始化设置偏移位置
   *
   * @memberof ScaleElement
   */
  setupOffsets() {
    if (this.options.setOffsetsOnce && this.isOffsetsSet) return;
    this.isOffsetsSet = true;

    this.computeInitialOffset();
    this.resetOffset();
  }

  /**
   * 重置容器元素的高度
   *
   * @memberof ScaleElement
   */
  unsetContainerY() {
    if (this.container) {
      this.container.style.height = '';
    }
  }

  /**
   * 设置容器元素的高度
   *
   * @param {number} y 高度值
   * @return {*}  {string}
   * @memberof ScaleElement
   */
  setContainerY(y: number): string {
    if (this.container) {
      return (this.container.style.height = `${y}px`);
    }
    return '';
  }

  /**
   * 设置初始化的偏移位置
   *
   * @memberof ScaleElement
   */
  computeInitialOffset() {
    const x = this.options.isIntial
      ? 0
      : -Math.abs(this.el.offsetWidth * this.getInitialZoomFactor() - (this.container as HTMLElement).offsetWidth) / 2;
    const y = this.options.isIntial
      ? 0
      : -Math.abs(this.el.offsetHeight * this.getInitialZoomFactor() - (this.container as HTMLElement).offsetHeight) /
        2;
    this.initialOffset = { x, y };
  }

  /**
   * 获取初始话的缩放比例
   *
   * @return {number}  {number} 缩放比例
   * @memberof ScaleElement
   */
  getInitialZoomFactor(): number {
    if (this.container) {
      const xZoomFactor = this.container.offsetWidth / this.el.offsetWidth;
      const yZoomFactor = this.container.offsetHeight / this.el.offsetHeight;
      return Math.max(xZoomFactor, yZoomFactor);
    }
    return 1;
  }

  /**
   * 重置偏移量为初始化值
   *
   * @memberof ScaleElement
   */
  resetOffset(): void {
    this.offset.x = this.initialOffset.x;
    this.offset.y = this.initialOffset.y;
  }

  /**
   * 获取多点触碰的中心点
   *
   * @param {ITouch[]} touches 多点触屏的触屏点坐标集合
   * @return {ITouch}  {ITouch} 返回中心点坐标
   * @memberof ScaleElement
   */
  getTouchCenter(touches: ITouch[]): ITouch {
    return this.getVectorAvg(touches);
  }

  /**
   * 获取多点触碰的中心点
   *
   * @param {ITouch[]} vectors
   * @return {ITouch}  {ITouch} 返回中心点坐标
   * @memberof ScaleElement
   */
  getVectorAvg(vectors: ITouch[]): ITouch {
    return {
      x: vectors.map((v) => v.x).reduce(sum) / vectors.length,
      y: vectors.map((v) => v.y).reduce(sum) / vectors.length,
    };
  }

  /**
   * 获取多点触屏的坐标值集合
   *
   * @param {TouchEvent} event 当前触屏事件对象
   * @return {ITouch[]}  {ITouch[]} 坐标数组集合
   * @memberof ScaleElement
   */
  getTouches(event: TouchEvent): ITouch[] {
    const rect = (this.container as HTMLElement).getBoundingClientRect();
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    const posTop = rect.top + scrollTop;
    const posLeft = rect.left + scrollLeft;

    return Array.prototype.slice.call(event.touches).map((touch) => ({
      x: touch.pageX - posLeft,
      y: touch.pageY - posTop,
    }));
  }

  /**
   * 开始缩放
   *
   * @param {TouchEvent} event 事件对象
   * @memberof ScaleElement
   */
  handleZoomStart(event: TouchEvent): void {
    triggerEvent(this.el, this.options.zoomStartEventName);
    if (typeof this.options.onZoomStart == 'function') {
      this.options.onZoomStart(this, event);
    }
    this.stopAnimation();
    this.lastScale = 1;
    this.nthZoom = 0;
    this.lastZoomCenter = null;
    this.hasInteraction = true;
  }

  /**
   * 执行缩放
   *
   * @param {TouchEvent} event 事件对象
   * @param {number} newScale 只是此时当前缩放的缩放比，而非整体实际的缩放比
   * @memberof ScaleElement
   */
  handleZoom(event: TouchEvent, newScale: number): void {
    const touchCenter = this.getTouchCenter(this.getTouches(event));
    const scale = newScale / this.lastScale;
    this.lastScale = newScale;

    // 防止误操作
    this.nthZoom += 1;
    if (this.nthZoom > 3) {
      this.scale(scale, touchCenter);
      this.drag(touchCenter, this.lastZoomCenter);
    }
    this.lastZoomCenter = touchCenter;
  }

  /**
   * 结束缩放
   *
   * @param {TouchEvent} event 事件对象
   * @memberof ScaleElement
   */
  handleZoomEnd(event: TouchEvent): void {
    triggerEvent(this.el, this.options.zoomEndEventName);
    if (typeof this.options.onZoomEnd == 'function') {
      this.options.onZoomEnd(this, event);
    }
    this.end();
  }

  /**
   * 开始拖拽
   *
   * @param {TouchEvent} event 事件对象
   * @memberof ScaleElement
   */
  handleDragStart(event: TouchEvent): void {
    triggerEvent(this.el, this.options.dragStartEventName);
    if (typeof this.options.onDragStart == 'function') {
      this.options.onDragStart(this, event);
    }
    this.stopAnimation();
    this.lastDragPosition = null;
    this.hasInteraction = true;
    this.handleDrag(event);
  }

  /**
   * 执行拖拽
   *
   * @param {Event} TouchEvent 事件对象
   * @memberof ScaleElement
   */
  handleDrag(event: TouchEvent): void {
    const touch = this.getTouches(event)[0];
    this.drag(touch, this.lastDragPosition);
    this.offset = this.sanitizeOffset(this.offset);
    this.lastDragPosition = touch;
  }

  /**
   * 结束拖拽
   *
   * @param {TouchEvent} [event] 事件对象
   * @memberof ScaleElement
   */
  handleDragEnd(event?: TouchEvent): void {
    triggerEvent(this.el, this.options.dragEndEventName);
    if (typeof this.options.onDragEnd == 'function') {
      this.options.onDragEnd(this, event);
    }
    this.end();
  }

  /**
   * 执行双击
   *
   * @param {TouchEvent} event 事件对象
   * @memberof ScaleElement
   */
  handleDoubleTap(event: TouchEvent): void {
    let center = this.getTouches(event)[0];
    const zoomFactor = this.zoomFactor > 1 ? 1 : this.options.tapZoomFactor;
    const startZoomFactor = this.zoomFactor;
    const updateProgress = function (this: ScaleElement, progress: number) {
      this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center);
    }.bind(this);

    if (this.hasInteraction) {
      return;
    }

    this.isDoubleTap = true;

    if (startZoomFactor > zoomFactor) {
      center = this.getCurrentZoomCenter();
    }

    this.animate(this.options.animationDuration, updateProgress, this.swing);
    triggerEvent(this.el, this.options.doubleTapEventName);
    if (typeof this.options.onDoubleTap == 'function') {
      this.options.onDoubleTap(this, event);
    }
  }

  /**
   * 设置缩放信息
   *
   * @param {number} scale 当前缩放过程的缩放倍数
   * @param {ITouch} center 多点触屏的坐标中心点
   * @memberof ScaleElement
   */
  scale(scale: number, center: ITouch): void {
    // 获取实际缩放倍数
    scale = this.scaleZoomFactor(scale);
    // 设置当前偏移量
    this.addOffset({
      x: (scale - 1) * (center.x + this.offset.x),
      y: (scale - 1) * (center.y + this.offset.y),
    });
    triggerEvent(this.el, this.options.zoomUpdateEventName);
    if (typeof this.options.onZoomUpdate == 'function') {
      this.options.onZoomUpdate(this, event);
    }
  }

  /**
   * 缩放到指定的比例
   *
   * @param {number} zoomFactor 缩放的比例
   * @param {ITouch} center 当前多点触屏的中心坐标
   * @memberof ScaleElement
   */
  scaleTo(zoomFactor: number, center: ITouch): void {
    this.scale(zoomFactor / this.zoomFactor, center);
  }

  /**
   * 返回实际的缩放倍数
   *
   * @param {number} scale 当前缩放过程的缩放倍数，非实际缩放倍数
   * @return {number}  {number} 返回实际的缩放比
   * @memberof ScaleElement
   */
  scaleZoomFactor(scale: number): number {
    const originalZoomFactor = this.zoomFactor;
    this.zoomFactor *= scale;
    this.zoomFactor = Math.min(this.options.maxZoom, Math.max(this.zoomFactor, this.options.minZoom));
    return this.zoomFactor / originalZoomFactor;
  }

  /**
   * 设置当前偏移坐标值
   *
   * @param {IOffset} offset 当前缩放过程中产生的坐标偏移量
   * @memberof ScaleElement
   */
  addOffset(offset: IOffset): void {
    this.offset = {
      x: this.offset.x + offset.x,
      y: this.offset.y + offset.y,
    };
  }

  /**
   * 拖拽设置偏差量
   *
   * @param {ITouch} center 当前最新的多点触屏的中心坐标
   * @param {ITouch} lastCenter 当前最新上一节点的多点触屏的中心坐标
   * @memberof ScaleElement
   */
  drag(center: ITouch, lastCenter: ITouch | null): void {
    if (lastCenter) {
      if (this.options.lockDragAxis) {
        // 单方向滑动
        // 判断哪个方向偏差量大，滑动哪个方向
        if (Math.abs(center.x - lastCenter.x) > Math.abs(center.y - lastCenter.y)) {
          this.addOffset({
            x: -(center.x - lastCenter.x),
            y: 0,
          });
        } else {
          this.addOffset({
            y: -(center.y - lastCenter.y),
            x: 0,
          });
        }
      } else {
        this.addOffset({
          y: -(center.y - lastCenter.y),
          x: -(center.x - lastCenter.x),
        });
      }
      triggerEvent(this.el, this.options.dragUpdateEventName);
      if (typeof this.options.onDragUpdate == 'function') {
        this.options.onDragUpdate(this, event);
      }
    }
  }

  /**
   * 设置动画状态为停止
   *
   * @memberof ScaleElement
   */
  stopAnimation(): void {
    this.inAnimation = false;
  }

  /**
   * 结束拖拽或者缩放
   *
   * @memberof ScaleElement
   */
  end(): void {
    this.hasInteraction = false;
    this.sanitize();
    this.update();
  }

  /**
   *
   *
   * @memberof ScaleElement
   */
  sanitize(): void {
    // 如果当前缩放结束时，缩放比小于给定的阈值缩放比时，自动缩放为初始值
    if (this.zoomFactor < this.options.zoomOutFactor) {
      this.zoomOutAnimation();
    } else if (this.isInsaneOffset(this.offset)) {
      this.sanitizeOffsetAnimation();
    }
  }

  /**
   * 比较偏差量是否相等
   *
   * @param {IOffset} offset 偏差量
   * @return {boolean}
   * @memberof ScaleElement
   */
  isInsaneOffset(offset: IOffset): boolean {
    const sanitizedOffset = this.sanitizeOffset(offset);
    return sanitizedOffset.x !== offset.x || sanitizedOffset.y !== offset.y;
  }

  /**
   *
   *
   * @param {IOffset} offset
   * @return {IOffset}  {IOffset}
   * @memberof ScaleElement
   */
  sanitizeOffset(offset: IOffset): IOffset {
    // TODO
    const elWidth = this.el.offsetWidth * this.getInitialZoomFactor() * this.zoomFactor;
    const elHeight = this.el.offsetHeight * this.getInitialZoomFactor() * this.zoomFactor;
    const maxX = elWidth - this.getContainerX() + this.options.horizontalPadding;
    const maxY = elHeight - this.getContainerY() + this.options.verticalPadding;
    const maxOffsetX = Math.max(maxX, 0);
    const maxOffsetY = Math.max(maxY, 0);
    const minOffsetX = Math.min(maxX, 0) - this.options.horizontalPadding;
    const minOffsetY = Math.min(maxY, 0) - this.options.verticalPadding;

    return {
      x: Math.min(Math.max(offset.x, minOffsetX), maxOffsetX),
      y: Math.min(Math.max(offset.y, minOffsetY), maxOffsetY),
    };
  }

  /**
   *
   *
   * @memberof ScaleElement
   */
  sanitizeOffsetAnimation(): void {
    const targetOffset = this.sanitizeOffset(this.offset);
    const startOffset = {
      x: this.offset.x,
      y: this.offset.y,
    };
    const updateProgress = function (this: ScaleElement, progress: number) {
      this.offset.x = startOffset.x + progress * (targetOffset.x - startOffset.x);
      this.offset.y = startOffset.y + progress * (targetOffset.y - startOffset.y);
      this.update();
    }.bind(this);

    this.animate(this.options.animationDuration, updateProgress, this.swing);
  }

  /**
   * 还原到缩放状态为初始化状态
   *
   * @return {*}
   * @memberof ScaleElement
   */
  zoomOutAnimation(): void {
    if (this.zoomFactor === 1) {
      return;
    }

    const startZoomFactor = this.zoomFactor;
    const zoomFactor = 1;
    const center = this.getCurrentZoomCenter();
    const updateProgress = function (this: ScaleElement, progress: number) {
      this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center);
    }.bind(this);

    this.animate(this.options.animationDuration, updateProgress, this.swing);
  }

  /**
   * 执行动画
   *
   * @param {*} duration 动画事件
   * @param {*} framefn
   * @param {*} timefn
   * @param {Function} [callback]
   * @memberof ScaleElement
   */
  animate(
    duration: number,
    framefn: (num: number) => void,
    timefn: (progress: number) => number,
    callback?: () => void,
  ): void {
    const startTime = new Date().getTime(),
      renderFrame = function (this: ScaleElement) {
        if (!this.inAnimation) {
          return;
        }
        const frameTime = new Date().getTime() - startTime;
        let progress = frameTime / duration;
        if (frameTime >= duration) {
          framefn(1);
          if (callback) {
            callback();
          }
          this.update();
          this.stopAnimation();
          this.update();
        } else {
          if (timefn) {
            progress = timefn(progress);
          }
          framefn(progress);
          this.update();
          requestAnimationFrame(renderFrame);
        }
      }.bind(this);
    this.inAnimation = true;
    requestAnimationFrame(renderFrame);
  }

  /**
   * 动画轨迹函数
   *
   * @param {number} p
   * @return {number}
   * @memberof ScaleElement
   */
  swing(p: number): number {
    return -Math.cos(p * Math.PI) / 2 + 0.5;
  }

  /**
   * 获取当前容器宽度
   *
   * @return {number}
   * @memberof ScaleElement
   */
  getContainerX(): number {
    return (this.container as HTMLElement).offsetWidth;
  }

  /**
   * 获取当前容器高度
   *
   * @return {number}
   * @memberof ScaleElement
   */
  getContainerY(): number {
    return (this.container as HTMLElement).offsetHeight;
  }

  /**
   * 获取当前缩放的中心坐标
   *
   * @return {*}  {ITouch}
   * @memberof ScaleElement
   */
  getCurrentZoomCenter(): ITouch {
    const offsetLeft = this.offset.x - this.initialOffset.x; // 相对上次横向位置偏移
    const centerX = -this.offset.x - offsetLeft / (1 / this.zoomFactor - 1);

    const offsetTop = this.offset.y - this.initialOffset.y; // 相对上次纵向位置偏移
    const centerY = -this.offset.y - offsetTop / (1 / this.zoomFactor - 1);

    return {
      x: centerX,
      y: centerY,
    };
  }

  /**
   * 是否可以拖拽
   *
   * @return {boolean}
   * @memberof ScaleElement
   */
  canDrag(): boolean {
    return this.options.draggableUnzoomed || !isCloseTo(this.zoomFactor, 1);
  }
}
