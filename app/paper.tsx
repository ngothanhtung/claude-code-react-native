import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, PaperProvider, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaperScreen() {
  const [visible, setVisible] = useState(false);

  const onToggleSnackBar = () => setVisible(!visible);

  const onDismissSnackBar = () => setVisible(false);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PaperProvider>
        <View
          style={{
            paddingTop: 50,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Button onPress={onToggleSnackBar}>{visible ? 'Hide' : 'Show'}</Button>
          <Snackbar
            visible={visible}
            onDismiss={onDismissSnackBar}
            action={{
              label: 'Undo',
              onPress: () => {
                // Do something
              },
            }}
          >
            Hey there! I'm a Snackbar.
          </Snackbar>
        </View>
      </PaperProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
