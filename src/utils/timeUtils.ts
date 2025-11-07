/**
 * 时间格式化工具函数
 */

/**
 * 格式化时间（秒数转换为时分秒格式）
 * @param seconds - 秒数
 * @returns 格式化后的时间字符串
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * 格式化时间戳
 * @param timestamp - 时间戳（毫秒）
 * @returns 格式化后的日期时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 计算时间差（秒）
 * @param startTime - 开始时间戳（毫秒）
 * @param endTime - 结束时间戳（毫秒）
 * @returns 时间差（秒）
 */
export function calculateTimeDiff(startTime: number, endTime: number): number {
  return Math.floor((endTime - startTime) / 1000);
}