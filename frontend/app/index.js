import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Input, Card, Typography, LoadingState, ErrorState, EmptyState } from '../components';
import { useState } from 'react';

export default function Home() {
  const [inputValue, setInputValue] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h1" align="center">Featherstill</Typography>
      
      <Card style={styles.section}>
        <Typography variant="h2">State Components</Typography>
        <Typography variant="body" style={styles.mb}>
          Standardized states for loading, error, and empty data scenarios.
        </Typography>
      </Card>

      <Card style={styles.section}>
        <Typography variant="h3">Loading State</Typography>
        <LoadingState />
      </Card>

      <Card style={styles.section}>
        <Typography variant="h3">Error State</Typography>
        <ErrorState 
          onRetry={() => alert('Retrying...')} 
        />
      </Card>

      <Card style={styles.section}>
        <Typography variant="h3">Empty State</Typography>
        <EmptyState 
          actionLabel="Create New"
          onAction={() => alert('Creating...')}
        />
      </Card>

      <Card style={styles.section}>
        <Typography variant="h2">Input & Actions</Typography>

        <Input
          label="Example Input"
          placeholder="Type something..."
          value={inputValue}
          onChangeText={setInputValue}
        />

        <View style={styles.buttonGroup}>
          <Button title="Primary Button" onPress={() => {}} style={styles.mb} />
          <Button title="Secondary" variant="secondary" onPress={() => {}} style={styles.mb} />
          <Button title="Outline" variant="outline" onPress={() => {}} style={styles.mb} />
          <Button title="Danger" variant="danger" onPress={() => {}} />
        </View>
      </Card>

      <Card variant="elevated" style={styles.section}>
        <Typography variant="h3">Elevated Card</Typography>
        <Typography variant="caption">This card has a shadow elevation.</Typography>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  },
});
