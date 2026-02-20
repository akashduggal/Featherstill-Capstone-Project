import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from 'expo-router';
import { useAuth } from "../../context";

export default function Settings() {
  const router = useRouter();
  const { user, logout, isGuest } = useAuth();

  const handleLogout = async () => {
    try {
      await logout(); 
      router.replace("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.emailText}>
        User: {isGuest ? 'Guest User' : user?.email || 'Unknown Email'}
      </Text>

      <Button title="Logout" color="red" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  emailText: { fontSize: 16, marginBottom: 30, color: '#555' }
});