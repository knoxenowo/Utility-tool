import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { TOOLS, ToolCategory } from '../../constants/tools';
import { spacing, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Group tools by category
  const categories: ToolCategory[] = ['Quick Utilities', 'Productivity', 'Images', 'Documents', 'Tools'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={styles.header} entering={FadeInDown.duration(400)}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>What do you need to do?</Text>
      </Animated.View>

      {categories.map((category, catIndex) => {
        const categoryTools = TOOLS.filter(t => t.category === category);
        if (categoryTools.length === 0) return null;

        return (
          <Animated.View 
            key={category} 
            style={styles.categorySection}
            entering={FadeIn.delay(catIndex * 100).duration(400)}
          >
            <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>{category}</Text>
            <View style={styles.grid}>
              {categoryTools.map((tool, toolIndex) => (
                <AnimatedTouchableOpacity 
                  key={tool.id} 
                  entering={FadeInDown.delay((catIndex * 100) + (toolIndex * 50)).duration(400)}
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name={tool.icon} size={24} color={theme.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{tool.name}</Text>
                  <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {tool.description}
                  </Text>
                </AnimatedTouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
  },
  greeting: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  categorySection: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  categoryTitle: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.m,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  cardTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
