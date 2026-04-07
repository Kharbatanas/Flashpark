import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '../../theme/useTheme'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface CountdownTimerProps {
  targetDate: Date
  onExpired?: () => void
  size?: number
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
  return {
    totalSeconds: diff,
    hours: Math.floor(diff / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function getColor(totalSeconds: number): string {
  if (totalSeconds > 1800) return '#10B981'
  if (totalSeconds > 600) return '#F5A623'
  return '#EF4444'
}

export function CountdownTimer({
  targetDate,
  onExpired,
  size = 80,
}: CountdownTimerProps): React.JSX.Element {
  const { colors } = useTheme()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetDate))

  const RADIUS = (size - 8) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const MAX_SECONDS = 3600
  const progress = Math.min(timeLeft.totalSeconds / MAX_SECONDS, 1)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)
  const timerColor = getColor(timeLeft.totalSeconds)

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getTimeLeft(targetDate)
      setTimeLeft(next)
      if (next.totalSeconds === 0) {
        clearInterval(interval)
        onExpired?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate, onExpired])

  return (
    <View style={styles.container} accessibilityLabel="Compte à rebours">
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          stroke={colors.borderLight}
          strokeWidth={4}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          stroke={timerColor}
          strokeWidth={4}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.label, { width: size, height: size }]}>
        <AppText variant="callout" color={timerColor}>
          {`${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`}
        </AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  svg: {
    position: 'absolute',
  },
  label: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
