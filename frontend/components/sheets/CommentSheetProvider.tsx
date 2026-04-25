import React, { createContext, useContext, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CommentSheet } from './CommentSheet';

type CommentSheetContextValue = {
  openCommentSheet: (postId: string) => void;
  closeCommentSheet: () => void;
};

const CommentSheetContext = createContext<CommentSheetContextValue>({
  openCommentSheet: () => {},
  closeCommentSheet: () => {},
});

export function useCommentSheet() {
  return useContext(CommentSheetContext);
}

export function CommentSheetProvider({ children }: { children: React.ReactNode }) {
  const [activePostId, setActivePostId] = useState<string | null>(null);

  function openCommentSheet(postId: string) {
    setActivePostId(postId);
  }

  function closeCommentSheet() {
    setActivePostId(null);
  }

  return (
    <CommentSheetContext.Provider value={{ openCommentSheet, closeCommentSheet }}>
      <View style={styles.container}>
        {children}
        <CommentSheet postId={activePostId} onClose={closeCommentSheet} />
      </View>
    </CommentSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
