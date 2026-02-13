import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text>User: user@example.com</Text>

      <Button title="Toggle Notifications" onPress={() => {}} />
      <Button title="Logout" onPress={() => {router.replace("/");}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
});