import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '@/src/components/Icon.native';

export default function ChatComposer({ onSendText, onSendFile }) {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await onSendText(content);
  };

  const onPickFile = async () => {
    if (!onSendFile) return;
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.length) return;
    const f = res.assets[0];
    await onSendFile({ uri: f.uri, name: f.name, type: f.mimeType });
  };

  const handleContentSizeChange = (e) => {
    const h = e.nativeEvent.contentSize.height;
    const min = 40;
    const max = 120;
    const clamped = Math.min(max, Math.max(min, h));
    setInputHeight(clamped);
  };

  return (
    <View style={styles.inputBar}>
      {!!onSendFile && (
        <Pressable onPress={onPickFile} style={styles.iconBtn}>
          <Icon name="square.and.arrow.up" size={22} color="#0B6" />
        </Pressable>
      )}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Nhập tin nhắn…"
        style={[styles.textInput, { height: inputHeight }]}
        multiline
        returnKeyType="send"
        onSubmitEditing={handleSend}
        onContentSizeChange={handleContentSizeChange}
      />
      <Pressable onPress={handleSend} style={[styles.iconBtn, styles.sendBtn]}>
        <Icon name="paperplane" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    ...(Platform.OS === 'android' ? { textAlignVertical: 'top' } : {}),
  },
  sendBtn: { backgroundColor: '#0b5345' },
});
