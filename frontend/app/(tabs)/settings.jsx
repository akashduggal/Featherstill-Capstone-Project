import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <Text>User: user@example.com</Text>

      <Button title="Toggle Notifications" onPress={() => {}} />
      <Button title="Logout" onPress={() => {router.replace("/");}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
});