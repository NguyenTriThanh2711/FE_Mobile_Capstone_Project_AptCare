import React from "react";
import { View, Text, Image } from "react-native";
import { BaseToast, ErrorToast } from "react-native-toast-message";

export const toastConfig = {
  info: (props) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={6}
      text2Style={{ fontSize: 13, lineHeight: 18 }}
      style={{ borderLeftColor: "#3b82f6" }}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      text1NumberOfLines={10}
      text2NumberOfLines={12}
      text2Style={{ fontSize: 13, lineHeight: 18 }}
      style={{ borderLeftColor: "#ef4444" }}
    />
  ),

  imageInfo: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#3b82f6",maxHeight: 240, minHeight: 80 }}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      renderLeadingIcon={() => (
        <Image
          source={props?.props?.imageSource ?? { uri: props?.props?.imageUrl }}
          style={{ width: 90, height: 60, marginLeft: 12}}
        />
      )}
      text1NumberOfLines={1}
      text2NumberOfLines={3}
      text2Style={{ fontSize: 13, lineHeight: 18 }}
    />
  ),
};
