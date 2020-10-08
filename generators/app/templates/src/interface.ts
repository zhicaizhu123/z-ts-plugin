
export type TInteraction = 'zoom' | 'drag' | null

/**
 * 配置项
 *
 * @interface IOptions
 */
export interface IOptions {
  /** 
   * 双击的放大倍数
   */
  tapZoomFactor: number
  /** 
   * 缩放比小于该阈值则会自动缩放到原始比例
   */
  zoomOutFactor: number
  /** 
   * 动画的时间
   */
  animationDuration: number
  /** 
   * 缩放比最大值
   */
  maxZoom: number
  /** 
   * 缩放比最小值
   */
  minZoom: number
  /** 
   * 在没有缩放时可以拖拽
   */
  draggableUnzoomed: boolean
  /** 
   * 锁定每次只能单方向拖拽
   */
  lockDragAxis: boolean
  /** 
   * 初始化是是否设置偏移位置
   */
  setOffsetsOnce: boolean
  /** 
   * 是否使用transform 2d方式动画
   */
  use2d: boolean
  /** 
   * 初始化时是否保持原始比例
   */
  isIntial: boolean
  /** 
   * 开始缩放时触发的自定义事件
   */
  zoomStartEventName: 'zoomstart',
  /** 
   * 缩放时触发的自定义事件
   */
  zoomUpdateEventName: 'zoomupdate'
  /** 
   * 结束缩放时触发的自定义事件
   */
  zoomEndEventName: 'zoomend'
  /** 
   * 开始拖拽时触发的自定义事件
   */
  dragStartEventName: 'dragstart'
  /** 
   * 开始拖拽时触发的自定义事件
   */
  dragUpdateEventName: 'dragupdate'
  /** 
   * 开始拖拽时触发的自定义事件
   */
  dragEndEventName: 'dragend'
  /** 
   * 双击时触发的自定义事件
   */
  doubleTapEventName: 'doubletap'
  /** 
   * 垂直方向的padding值
   */
  verticalPadding: number
  /** 
   * 水平方向的padding值
   */
  horizontalPadding: number
  /** 
   * 开始缩放时触发的回调
   */
  onZoomStart: Function | null
  /** 
   * 缩放时触发的回调
   */
  onZoomUpdate: Function | null
  /** 
   * 结束缩放时触发的回调
   */
  onZoomEnd: Function | null
  /** 
   * 开始拖拽时触发的回调
   */
  onDragStart: Function | null
  /** 
   * 开始拖拽时触发的回调
   */
  onDragEnd: Function | null
  /** 
   * 开始拖拽时触发的回调
   */
  onDragUpdate: Function | null
  /** 
   * 双击时触发的回调
   */
  onDoubleTap: Function | null
}


/**
 * 偏移坐标
 *
 * @export
 * @interface IOffset
 */
export interface IOffset {
  x: number // 横坐标
  y: number // 纵坐标
}


/**
 * 多点触屏中心坐标
 *
 * @export
 * @interface ITouch
 */
export interface ITouch {
  x: number // 横坐标
  y: number // 纵坐标
}
