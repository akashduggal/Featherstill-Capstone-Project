import { View, StyleSheet, ScrollView,Image } from 'react-native';
import { Button, Input, Card, Typography } from '../../components';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h1" align="center">Fetherstill</Typography>
      <Card style={[styles.section, styles.profileCard]}>
          <View style={styles.profileHeader}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Typography variant="h2" style={{ color: '#fff' }}>
                  {user?.displayName ? user.displayName.charAt(0) : '?'}
                </Typography>
              </View>
            )}
            <View style={styles.profileText}>
              <Typography variant="h2">{user?.displayName || 'User'}</Typography>
              <Typography variant="body">{user?.email}</Typography>
            </View>
          </View>
      </Card>
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
  profileCard: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e1e1e1',
  },
  placeholderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF', // You can change this to colors.tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    marginLeft: 15,
    flex: 1,
  },
  mb: {
    marginBottom: 10,
  },
  buttonGroup: {
    marginTop: 10,
    gap: 10,
  },
});
