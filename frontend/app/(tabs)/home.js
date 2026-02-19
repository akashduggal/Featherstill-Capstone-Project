import { View, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card, Typography } from '../../components';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Typography variant="h1" align="center">Fetherstill</Typography>
        <Card style={styles.section}>
          <Typography variant="h2">Component Showcase</Typography>
          <Typography variant="body" style={styles.mb}>
            This is a demonstration of our reusable UI components.
          </Typography>

          <Input
            label="Example Input"
            placeholder="Type something..."
            value={inputValue}
            onChangeText={setInputValue}
          />

          <View style={styles.buttonGroup}>
            <Button title="Primary Button" onPress={() => { }} style={styles.mb} />
            <Button title="Secondary" variant="secondary" onPress={() => { }} style={styles.mb} />
            <Button title="Outline" variant="outline" onPress={() => { }} style={styles.mb} />
            <Button title="Danger" variant="danger" onPress={() => { }} />
          </View>
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Typography variant="h3">Elevated Card</Typography>
          <Typography variant="caption">This card has a shadow elevation.</Typography>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  section: {
    marginBottom: 20,
  },
  mb: {
    marginBottom: 10,
  },
  buttonGroup: {
    marginTop: 10,
    gap: 10,
  },
});
