import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated'
import { Easing } from 'react-native-reanimated'

export const springDefault: WithSpringConfig = {
  damping: 20,
  stiffness: 200,
  mass: 1,
}

export const springBouncy: WithSpringConfig = {
  damping: 12,
  stiffness: 280,
  mass: 0.8,
}

export const springSnappy: WithSpringConfig = {
  damping: 30,
  stiffness: 400,
  mass: 0.6,
}

export const timingFast: WithTimingConfig = {
  duration: 150,
  easing: Easing.out(Easing.cubic),
}

export const timingNormal: WithTimingConfig = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
}

export const timingSlow: WithTimingConfig = {
  duration: 500,
  easing: Easing.out(Easing.cubic),
}
