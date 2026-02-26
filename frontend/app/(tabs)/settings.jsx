import { View, Text, Button, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context';
import VersionDisplay from '../../components/VersionDisplay';
import { Colors } from '../../constants/Colors';

export default function Settings() {
  const router = useRouter();
  const { user, logout, isGuest } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Setting</Text>

        <Text style={[styles.emailText, { color: theme.text }]}>
          User: {isGuest ? 'Guest User' : user?.email || 'Unknown Email'}
        </Text>

        <Button title='Logout' color='red' onPress={handleLogout} />
      </View>

      <VersionDisplay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: { fontSize: 22, marginBottom: 20 },
  emailText: { fontSize: 16, marginBottom: 30, color: '#555' },
});
