/**
 * 游戏计时器Hook
 * 
 * 功能：
 * - 管理游戏计时逻辑
 * - 提供格式化时间显示
 * - 支持暂停和恢复
 */

import { useState, useEffect, useCallback } from 'react';

export interface TimerState {
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export const useTimer = (initialSeconds: number = 0) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * 开始计时器
   */
  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  /**
   * 暂停计时器
   */
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * 恢复计时器
   */
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * 停止计时器
   */
  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  /**
   * 重置计时器
   */
  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
    setIsPaused(false);
  }, [initialSeconds]);

  /**
   * 格式化时间显示
   * @param totalSeconds 总秒数
   * @returns 格式化的时间字符串
   */
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, []);

  /**
   * 获取当前格式化时间
   */
  const getFormattedTime = useCallback((): string => {
    return formatTime(seconds);
  }, [seconds, formatTime]);

  // 计时器核心逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused]);

  return {
    seconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
    formatTime,
    getFormattedTime
  };
};

/**
 * 基于时间戳的计时器Hook
 * 适用于需要精确时间计算的场景
 */
export const useTimestampTimer = (startTimestamp?: number) => {
  const [startTime, setStartTime] = useState(startTimestamp || 0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRunning, setIsRunning] = useState(false);

  /**
   * 开始计时
   * @param timestamp 开始时间戳，如果不提供则使用当前时间
   */
  const start = useCallback((timestamp?: number) => {
    setStartTime(timestamp || Date.now());
    setCurrentTime(Date.now());
    setIsRunning(true);
  }, []);

  /**
   * 停止计时
   */
  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  /**
   * 重置计时
   */
  const reset = useCallback(() => {
    setStartTime(Date.now());
    setCurrentTime(Date.now());
    setIsRunning(false);
  }, []);

  /**
   * 更新当前时间（用于外部定时更新）
   */
  const updateTime = useCallback(() => {
    if (isRunning) {
      setCurrentTime(Date.now());
    }
  }, [isRunning]);

  // 计算总秒数
  const totalSeconds = isRunning ? Math.floor((currentTime - startTime) / 1000) : 0;

  // 定时更新当前时间
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  /**
   * 格式化时间显示
   */
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }, []);

  return {
    startTime,
    currentTime,
    totalSeconds,
    isRunning,
    start,
    stop,
    reset,
    updateTime,
    formatTime,
    getFormattedTime: () => formatTime(totalSeconds)
  };
};