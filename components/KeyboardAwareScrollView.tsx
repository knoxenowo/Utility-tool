import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, ScrollViewProps, TextInput, findNodeHandle, UIManager } from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  /** Extra offset from top when scrolling to input. Default 120. */
  extraScrollOffset?: number;
}

/**
 * A drop-in replacement for ScrollView that automatically scrolls to make
 * the currently focused TextInput visible when the keyboard opens.
 * Adds dynamic bottom padding so even the lowest inputs can be scrolled up.
 */
export default function KeyboardAwareScrollView({
  children,
  extraScrollOffset = 120,
  contentContainerStyle,
  ...props
}: KeyboardAwareScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollToFocusedInput = useCallback((e?: any) => {
    // If we have the event, extract the keyboard height so we can pad the bottom
    if (e && e.endCoordinates) {
      setKeyboardHeight(e.endCoordinates.height);
    }

    // Small delay to let the keyboard fully appear and layout settle
    setTimeout(() => {
      const focusedInput = TextInput.State.currentlyFocusedInput?.();
      if (!focusedInput || !scrollRef.current) return;

      const inputNodeHandle = findNodeHandle(focusedInput as any);
      const scrollNodeHandle = findNodeHandle(scrollRef.current);
      if (!inputNodeHandle || !scrollNodeHandle) return;

      // Measure the focused input relative to the ScrollView
      UIManager.measureLayout(
        inputNodeHandle as any,
        scrollNodeHandle as any,
        () => {
          // Fallback: scroll to end if measurement fails
          scrollRef.current?.scrollToEnd({ animated: true });
        },
        (_x: number, y: number, _width: number, _height: number) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - extraScrollOffset),
            animated: true,
          });
        }
      );
    }, 350);
  }, [extraScrollOffset]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, scrollToFocusedInput);
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToFocusedInput]);

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: keyboardHeight }
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
