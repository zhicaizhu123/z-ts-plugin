import ScaleElement from './index';
import { ITouch, TInteraction } from './interface';

export default class DetectGestures {
  /**
   * 操作方式，'zoom'-缩放 'drag'-拖拽
   *
   * @type {('zoom' | 'drag' | null)}
   * @memberof DetectGestures
   */
  interaction: TInteraction = null;


  /**
   * 使用多少个触点操作
   *
   * @type {number}
   * @memberof DetectGestures
   */
  fingers: number = 0;


  /**
   * 与上次操作的时间节点，用于判断双击操作，通过时间差判断是否为双击
   *
   * @type {number}
   * @memberof DetectGestures
   */
  lastTouchStart: number = 0;

  /**
   * 每次触屏的开始时的触点坐标
   *
   * @type {ITouch[]}
   * @memberof DetectGestures
   */
  startTouches: ITouch[] = [];

  /**
   * 是否刚开始出发touchmove事件
   *
   * @type {boolean}
   * @memberof DetectGestures
   */
  firstMove: boolean = true;


  /**
   * Creates an instance of DetectGestures.
   * @param {HTMLElement} el 操作手势的元素
   * @param {ScaleElement} target
   * @memberof DetectGestures
   */
  constructor(public el: HTMLElement, public target: ScaleElement) {
    this.el = el;
    this.target = target;
    this.init();
  }


  /**
   * 初始化
   *
   * @memberof DetectGestures
   */
  init() {
    this.bindEvents();
  }


  /**
   * 销毁事件等
   *
   * @memberof DetectGestures
   */
  destory() {
    this.removeEvents();
  }


  /**
   * 设置状态
   *
   * @param {string|null} newInteraction 状态值
   * @param {TouchEvent} event
   * @memberof DetectGestures
   */
  setInteraction(newInteraction: TInteraction, event: TouchEvent) {
    if (this.interaction !== newInteraction) {
      // 只有前后状态不相同时
      if (this.interaction && !newInteraction) {
        // 如果不是单点或者双点触屏则结束缩放和拖拽
        switch (this.interaction) {
          case 'zoom':
            // 结束缩放状态
            this.target.handleZoomEnd(event);
            break;
          case 'drag':
            // 结束拖拽状态
            this.target.handleDragEnd(event);
            break;
          default:
            break;
        }
      }

      switch (newInteraction) {
        case 'zoom':
          // 设置为缩放状态，初始化缩放状态
          this.target.handleZoomStart(event);
          break;
        case 'drag':
          // 设置为拖拽状态，初始化拖拽状态
          this.target.handleDragStart(event);
          break;
        default:
          break;
      }
    }
    this.interaction = newInteraction;
  }


  /**
   * 更新当前操作类型状态
   *
   * @param {TouchEvent} event 事件对象
   * @memberof DetectGestures
   */
  updateInteraction(event: TouchEvent) {
    if (this.fingers === 2) {
      // 设置为缩放状态
      this.setInteraction('zoom', event);
    } else if (this.fingers === 1 && this.target.canDrag()) {
      // 设置为拖拽状态
      this.setInteraction('drag', event);
    } else {
      // 设置为结束缩放或拖拽，之后不做任何操作
      this.setInteraction(null, event);
    }
  }

  /**
   * 转为触点信息为横纵坐标
   *
   * @param {*} touches 触点信息集合
   * @return {ITouch[]}  {ITouch[]}
   * @memberof DetectGestures
   */
  targetTouches(touches: TouchList): ITouch[] {
    return Array.from(touches).map((touch: any) => ({
      x: touch.pageX,
      y: touch.pageY,
    }));
  }


  /**
   * 计算横纵坐标偏差值的勾股
   *
   * @param {ITouch} a 触点坐标
   * @param {ITouch} b 触点坐标
   * @return {*} 
   * @memberof DetectGestures
   */
  getDistance(a: ITouch, b: ITouch) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return Math.sqrt(x * x + y * y);
  }

  /**
   * 计算缩放比例
   *
   * @param {ITouch[]} startTouches
   * @param {ITouch[]} endTouches
   * @return {number} 缩放的比例值
   * @memberof DetectGestures
   */
  calculateScale(startTouches: ITouch[], endTouches: ITouch[]): number {
    const startDistance = this.getDistance(startTouches[0], startTouches[1]);
    const endDistance = this.getDistance(endTouches[0], endTouches[1]);
    return endDistance / startDistance;
  }


  /**
   * 阻止默认行为和冒泡
   *
   * @param {TouchEvent} event 事件对象
   * @memberof DetectGestures
   */
  cancelEvent(event: TouchEvent) {
    event.stopPropagation();
    event.preventDefault();
  }

  detectDoubleTap(event: TouchEvent) {
    const time = (new Date()).getTime();

    if (this.fingers > 1) {
      // 重置，如果是多指触屏则永远不会双击状态
      this.lastTouchStart = 0;
    }

    if (time - this.lastTouchStart < 300) {
      // 每次单指操作的时长间距少于300时任务时双击事件
      this.cancelEvent(event);

      this.target.handleDoubleTap(event);
      switch (this.interaction) {
        // 如果当前
        case 'zoom':
          this.target.handleZoomEnd(event);
          break;
        case 'drag':
          this.target.handleDragEnd(event);
          break;
        default:
          break;
      }
    } else {
      this.target.isDoubleTap = false;
    }

    if (this.fingers === 1) {
      this.lastTouchStart = time;
    }
  }

  touchStartHandler = (function (this: DetectGestures, event: TouchEvent) {
    if (this.target.enabled) {
      this.firstMove = true;
      this.fingers = event.touches.length;
      this.detectDoubleTap(event);
    }
  }).bind(this)

  touchMoveHandler = (function (this: DetectGestures, event: TouchEvent) {
    if (this.target.enabled && !this.target.isDoubleTap) {
      if (this.firstMove) {
        // 单指或者双指触屏时，更新阶段状态为开始缩放或开始拖拽
        this.updateInteraction(event);
        if (this.interaction) {
          // 只要在缩放和拖拽过程中，阻止默认行为和阻止冒泡，使用自定义行为
          this.cancelEvent(event);
        }
        this.startTouches = this.targetTouches(event.touches);
      } else {
        switch (this.interaction) {
          case 'zoom':
            if (this.startTouches.length == 2 && event.touches.length == 2) {
              this.target.handleZoom(event, this.calculateScale(this.startTouches, this.targetTouches(event.touches)));
            }
            break;
          case 'drag':
            this.target.handleDrag(event);
            break;
          default:
            break;
        }
        if (this.interaction) {
          this.cancelEvent(event);
          this.target.update();
        }
      }

      this.firstMove = false;
    }
  }).bind(this)

  touchEndHandler = (function (this: DetectGestures, event: TouchEvent) {
    if (this.target.enabled) {
      // 设置有手指离开时当前屏幕剩余的手指数
      this.fingers = event.touches.length;
      // 设置阶段状态，如果屏幕上还有两个手指则为zoom缩放，一个手指则为drag拖拽，其他则为退出缩放和拖拽后不做任何操作
      this.updateInteraction(event);
    }
  }).bind(this)

  bindEvents() {
    this.el.addEventListener('touchstart', this.touchStartHandler);
    this.el.addEventListener('touchmove', this.touchMoveHandler);
    this.el.addEventListener('touchend', this.touchEndHandler);
  }

  removeEvents() {
    this.el.removeEventListener('touchstart', this.touchStartHandler);
    this.el.removeEventListener('touchmove', this.touchMoveHandler);
    this.el.removeEventListener('touchend', this.touchEndHandler);
  }
}
