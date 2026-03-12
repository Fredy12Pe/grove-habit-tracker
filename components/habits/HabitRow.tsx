import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { GroveColors, GroveBorderRadius } from '@/styles/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface HabitData {
  id: string;
  name: string;
  streak: number;
  icon: ImageSourcePropType;
  completed: boolean;
}

interface HabitRowProps {
  habit: HabitData;
  onToggle: (id: string) => void;
}

export function HabitRow({ habit, onToggle }: HabitRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Image source={habit.icon} style={styles.icon} resizeMode="contain" />
        </View>

        {/* Name & streak */}
        <View style={styles.info}>
          <AppText variant="paragraph" style={styles.name}>
            {habit.name}
          </AppText>
          <AppText variant="small" style={styles.streak}>
            Streak {habit.streak} days
          </AppText>
        </View>

        {/* Checkbox — stops propagation so it doesn't toggle the dropdown */}
        <TouchableOpacity
          style={[styles.checkbox, habit.completed && styles.checkboxDone]}
          onPress={(e) => { e.stopPropagation(); onToggle(habit.id); }}
          activeOpacity={0.7}
        >
          {habit.completed && (
            <IconSymbol name="checkmark" size={14} color={GroveColors.white} weight="bold" />
          )}
        </TouchableOpacity>

        {/* Expand chevron */}
        <View style={styles.chevronBtn}>
          <IconSymbol
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={16}
            color={GroveColors.secondaryText}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedArea}>
          <AppText variant="small" style={styles.expandedText}>
            Keep going! Complete this habit to grow your garden.
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: GroveColors.white,
    borderRadius: GroveBorderRadius.card,
    marginBottom: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: GroveColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 52,
    height: 52,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontWeight: '600',
    color: GroveColors.primaryText,
    fontSize: 15,
  },
  streak: {
    color: GroveColors.secondaryText,
    fontSize: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GroveColors.inactive,
    backgroundColor: GroveColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: GroveColors.primaryGreen,
    borderColor: GroveColors.primaryGreen,
  },
  chevronBtn: {
    padding: 4,
  },
  expandedArea: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  expandedText: {
    color: GroveColors.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
});
